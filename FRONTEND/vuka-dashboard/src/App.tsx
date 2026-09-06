import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getCurrentOperator, getEscrowEvents, getEscrows, getHealth, getReconciliationStatus, login, logout, contract } from "./api";
import type { Escrow, EscrowEvent, EscrowState, Operator, ReconciliationStatus } from "./types";

const refreshInterval = 15000;

function formatAmount(amount: string): string {
  return new Intl.NumberFormat("en-US").format(Number(amount) / 1_000_000);
}

function shorten(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function StatusBadge({ state }: { state: EscrowState }) {
  return <span className={`status status-${state.toLowerCase()}`}>{state}</span>;
}

export function App() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [status, setStatus] = useState<ReconciliationStatus | null>(null);
  const [healthy, setHealthy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<EscrowEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"ALL" | EscrowState>("ALL");
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [operator, setOperator] = useState<Operator | null>(null);

  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      const [escrowResponse, reconciliationStatus, health, currentOperator] = await Promise.all([
        getEscrows(),
        getReconciliationStatus(),
        getHealth(),
        getCurrentOperator()
      ]);
      setEscrows(escrowResponse.escrows);
      setStatus(reconciliationStatus);
      setHealthy(health);
      setOperator(currentOperator);
      setError(null);
      setAuthRequired(false);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AuthenticationRequired") {
        setAuthRequired(true);
        setEscrows([]);
        setStatus(null);
        setSelectedId(null);
        setSelectedEvents([]);
        setOperator(null);
        setError(null);
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Unable to load operations data");
      setHealthy(false);
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login(email, password);
      setPassword("");
      await load();
    } catch (loginLoadError) {
      setLoginError(loginLoadError instanceof Error ? "Invalid operator credentials." : "Unable to sign in.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setAuthRequired(true);
      setEscrows([]);
      setStatus(null);
      setSelectedId(null);
      setSelectedEvents([]);
      setOperator(null);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), refreshInterval);
    return () => window.clearInterval(timer);
  }, [load]);

  const selected = useMemo(
    () => escrows.find((escrow) => escrow.escrow_id === selectedId) ?? null,
    [escrows, selectedId]
  );

  useEffect(() => {
    if (selectedId === null) {
      setSelectedEvents([]);
      setEventsError(null);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    void getEscrowEvents(selectedId)
      .then((response) => setSelectedEvents(response.events))
      .catch((loadError) => setEventsError(loadError instanceof Error ? loadError.message : "Unable to load event history"))
      .finally(() => setEventsLoading(false));
  }, [selectedId]);
  const locked = escrows.filter((escrow) => escrow.state === "LOCKED").length;
  const released = escrows.filter((escrow) => escrow.state === "RELEASED").length;
  const totalValue = escrows.reduce((sum, escrow) => sum + Number(escrow.amount), 0) / 1_000_000;
  const filteredEscrows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return escrows.filter((escrow) => {
      const matchesState = stateFilter === "ALL" || escrow.state === stateFilter;
      const matchesSearch = !normalizedSearch ||
        [escrow.invoice_ref, escrow.buyer, escrow.supplier, String(escrow.escrow_id)]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesState && matchesSearch;
    });
  }, [escrows, search, stateFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredEscrows.length / pageSize));
  const visibleEscrows = filteredEscrows.slice((page - 1) * pageSize, page * pageSize);
  const lagBlocks = status?.lag_blocks ?? null;
  const hasWorkerErrors = (status?.metrics.Errors ?? 0) > 0;
  const isStale = lagBlocks !== null && lagBlocks > 50;

  useEffect(() => {
    setPage(1);
  }, [search, stateFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    authRequired ? <main className="login-shell">
      <form className="login-card" onSubmit={handleLogin}>
        <p className="eyebrow">VUKA / OPERATIONS</p>
        <h1>Operator sign in</h1>
        <p className="login-note">Authenticate to access reconciled escrow operations.</p>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
        {loginError && <p className="login-error" role="alert">{loginError}</p>}
        <button className="outline-button" disabled={loggingIn}>{loggingIn ? "Signing in…" : "Sign in"}</button>
      </form>
    </main> :
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <div>
            <strong>VUKA</strong>
            <span>TRADE TRUST</span>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          <a className="nav-item active" href="#overview">Overview</a>
          <a className="nav-item" href="#escrows">Escrows</a>
          <a className="nav-item" href="#reconciliation">Reconciliation</a>
        </nav>
        <div className="sidebar-footer">
          <span className={`health-dot ${healthy ? "online" : ""}`} />
          <span>{operator ? `${operator.role} · ${operator.email}` : healthy ? "Engine operational" : "Engine unavailable"}</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">OPERATIONS CONSOLE / AMOY</p>
            <h1>Escrow control room</h1>
          </div>
          <div className="topbar-actions">
            <button className="outline-button" onClick={() => void load()}>Refresh data</button>
            <button className="outline-button" onClick={() => void handleLogout()} disabled={loggingOut}>
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>

        {error && <div className="alert" role="alert"><strong>Data unavailable.</strong> {error}</div>}
        {status && (isStale || hasWorkerErrors) && <div className="alert" role="status">
          <strong>{isStale ? "Reconciliation is behind." : "Reconciliation needs attention."}</strong>{" "}
          {isStale ? `${lagBlocks.toLocaleString()} finalized blocks remain to be indexed.` : "The worker has reported one or more errors; inspect telemetry below."}
        </div>}

        <section id="overview" className="metric-grid" aria-label="Escrow overview">
          <article className="metric-card">
            <span className="metric-label">Total escrows</span>
            <strong>{escrows.length}</strong>
            <span className="metric-note">Reconciled on-chain records</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Value tracked</span>
            <strong>{totalValue.toLocaleString("en-US")} <small>vUSDC</small></strong>
            <span className="metric-note">Six-decimal settlement asset</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Locked</span>
            <strong>{locked}</strong>
            <span className="metric-note">Funds awaiting outcome</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Released</span>
            <strong>{released}</strong>
            <span className="metric-note">Terminal supplier outcomes</span>
          </article>
        </section>

        <section id="escrows" className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ON-CHAIN STATE</p>
              <h2>Escrow register</h2>
            </div>
            <span className="refresh-note">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}</span>
          </div>
          <div className="register-tools">
            <label className="search-field">
              <span className="sr-only">Search escrows</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, participant, or ID"
              />
            </label>
            <label className="filter-field">
              <span className="sr-only">Filter by state</span>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as "ALL" | EscrowState)}>
                <option value="ALL">All states</option>
                <option value="CREATED">Created</option>
                <option value="LOCKED">Locked</option>
                <option value="RELEASED">Released</option>
                <option value="REFUNDED">Refunded</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            </label>
            <span className="result-count">{filteredEscrows.length} of {escrows.length} records</span>
          </div>
          <div className="table-frame">
            <table>
              <thead>
                <tr><th>Reference</th><th>Participants</th><th>Amount</th><th>State</th><th>Block</th><th /></tr>
              </thead>
              <tbody>
                {visibleEscrows.map((escrow) => (
                  <tr key={escrow.escrow_id}>
                    <td><strong>{escrow.invoice_ref}</strong><span className="cell-sub">Escrow #{escrow.escrow_id}</span></td>
                    <td><span className="cell-sub">Buyer {shorten(escrow.buyer)}</span><span className="cell-sub">Supplier {shorten(escrow.supplier)}</span></td>
                    <td><strong className="amount">{formatAmount(escrow.amount)} <small>vUSDC</small></strong></td>
                    <td><StatusBadge state={escrow.state} /></td>
                    <td className="mono">{escrow.updated_block.toLocaleString()}</td>
                    <td><button className="row-button" onClick={() => setSelectedId(escrow.escrow_id)}>Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {escrows.length === 0 && <div className="empty-state">No reconciled escrows are available.</div>}
            {escrows.length > 0 && filteredEscrows.length === 0 && <div className="empty-state">No escrows match the current search and filter.</div>}
          </div>
          {filteredEscrows.length > 0 && <div className="pagination" aria-label="Escrow register pagination">
            <span className="refresh-note">Page {page} of {pageCount}</span>
            <div className="pagination-actions">
              <button className="row-button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Previous</button>
              <button className="row-button" disabled={page === pageCount} onClick={() => setPage((currentPage) => currentPage + 1)}>Next</button>
            </div>
          </div>}
        </section>

        <section id="reconciliation" className="content-section bottom-grid">
          <article className="panel">
            <div className="section-heading compact"><div><p className="eyebrow">SYNC TELEMETRY</p><h2>Reconciliation health</h2></div></div>
            <div className="health-list">
              <div><span>Cursor</span><strong className="mono">{status?.cursor.toLocaleString() ?? "—"}</strong></div>
              <div><span>Latest finalized block</span><strong className="mono">{status?.finalized_block.toLocaleString() ?? "—"}</strong></div>
              <div><span>Indexing lag</span><strong>{status ? `${status.lag_blocks.toLocaleString()} blocks` : "—"}</strong></div>
              <div><span>Events applied</span><strong>{status?.metrics.EventsApplied ?? "—"}</strong></div>
              <div><span>Successful polls</span><strong>{status?.metrics.SuccessfulPolls ?? "—"}</strong></div>
              <div><span>Errors</span><strong>{status?.metrics.Errors ?? "—"}</strong></div>
            </div>
          </article>
          <article className="panel network-panel">
            <p className="eyebrow">NETWORK</p>
            <h2>Polygon Amoy</h2>
            <span className="mono">{shorten(contract)}</span>
            <div className="network-meta"><span>Chain ID</span><strong>80002</strong></div>
            <div className="network-meta"><span>Mode</span><strong>Read-only</strong></div>
          </article>
        </section>
      </main>

      {selected && <div className="drawer-backdrop" onClick={() => setSelectedId(null)}>
        <aside className="drawer" onClick={(event) => event.stopPropagation()}>
          <button className="drawer-close" onClick={() => setSelectedId(null)} aria-label="Close details">×</button>
          <p className="eyebrow">ESCROW #{selected.escrow_id}</p>
          <h2>{selected.invoice_ref}</h2>
          <StatusBadge state={selected.state} />
          <div className="detail-amount">{formatAmount(selected.amount)} <small>vUSDC</small></div>
          <dl className="details">
            <div><dt>Buyer</dt><dd className="mono">{selected.buyer}</dd></div>
            <div><dt>Supplier</dt><dd className="mono">{selected.supplier}</dd></div>
            <div><dt>Last indexed block</dt><dd>{selected.updated_block.toLocaleString()}</dd></div>
            <div><dt>Contract</dt><dd className="mono">{selected.contract_address}</dd></div>
          </dl>
          <section className="event-history" aria-labelledby="event-history-title">
            <div className="event-history-heading">
              <p className="eyebrow" id="event-history-title">CHAIN HISTORY</p>
              <span className="refresh-note">{selectedEvents.length} events</span>
            </div>
            {eventsLoading && <p className="drawer-note">Loading event history…</p>}
            {eventsError && <p className="drawer-note" role="alert">{eventsError}</p>}
            {!eventsLoading && !eventsError && selectedEvents.length === 0 && <p className="drawer-note">No indexed events are available.</p>}
            <ol className="event-list">
              {selectedEvents.map((event) => (
                <li key={`${event.transaction_hash}-${event.log_index}`}>
                  <div className="event-marker" />
                  <div>
                    <strong>{event.event_type}</strong>
                    <span className="cell-sub">Block {event.block_number.toLocaleString()} · Log {event.log_index}</span>
                    <span className="cell-sub mono">{shorten(event.transaction_hash)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>}
    </div>
  );
}
