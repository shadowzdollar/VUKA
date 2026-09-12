import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createTransactionWorkflow, createTraderInvoice, createTraderSupportTicket, createTraderTransfer, findTraderRecipient, getCorridors, getCorridorQuote, getTraderAccounts, getTraderBalance, getTraderInvoices, getTraderNotifications, getTraderSupportTickets, getTraderTransfer, getTraderTransfers, getTransactionWorkflow, markTraderNotificationRead, traderLogout } from "./api";
import type { CorridorConfig, Notification, SupportTicket, Trader, TraderAccount, TraderBalance, TraderInvoice, TraderQuote, TraderTransfer, TransactionWorkflow } from "./types";
import { translations, type Language } from "./i18n";
import { buildWhatsAppInvoiceShareUrl, buildSMSInvoiceShareUrl } from "./utils/whatsapp";

function money(minor: number, currency: string): string {
  return `${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

const traderPages = ["overview", "send", "activity", "invoices", "recipients", "reports", "support", "settings"] as const;
type TraderPage = typeof traderPages[number];

function pageFromHash(): TraderPage {
  const page = window.location.hash.replace(/^#/, "");
  return traderPages.includes(page as TraderPage) ? page as TraderPage : "overview";
}

function TrendChart({ values }: { values: { label: string; value: number }[] }) {
  const width = 520;
  const height = 180;
  const max = Math.max(...values.map((item) => item.value), 1);
  const points = values.map((item, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - 24 - (item.value / max) * (height - 48);
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,${height - 24} ${line} ${width},${height - 24}`;
  return <div className="chart-wrap">
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Transfer trend chart">
      <line x1="0" y1={height - 24} x2={width} y2={height - 24} className="chart-axis" />
      <polygon points={area} className="chart-area" />
      <polyline points={line} className="chart-line" />
      {points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="4" className="chart-point" /><title>{point.label}: {point.value} transfers</title></g>)}
    </svg>
    <div className="chart-labels">{values.map((item) => <span key={item.label}>{item.label}</span>)}</div>
  </div>;
}

function StatusDonut({ counts }: { counts: { label: string; value: number; className: string }[] }) {
  const total = counts.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return <div className="donut-layout">
    <div className="donut-chart">
      <svg viewBox="0 0 110 110" role="img" aria-label="Transfer status chart">
        <circle cx="55" cy="55" r={radius} className="donut-track" />
        {total > 0 && counts.filter((item) => item.value > 0).map((item) => {
          const length = (item.value / total) * circumference;
          const circle = <circle key={item.label} cx="55" cy="55" r={radius} className={`donut-segment ${item.className}`} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
          offset += length;
          return circle;
        })}
      </svg>
      <strong>{total}</strong>
      <span>transfers</span>
    </div>
    <div className="donut-legend">{counts.map((item) => <div key={item.label}><span className={`legend-dot ${item.className}`} /><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
  </div>;
}

export function TraderApp({ trader, onSignOut }: { trader: Trader; onSignOut: () => void }) {
  const [accounts, setAccounts] = useState<TraderAccount[]>([]);
  const [balances, setBalances] = useState<Record<string, TraderBalance>>({});
  const [transfers, setTransfers] = useState<TraderTransfer[]>([]);
  const [invoices, setInvoices] = useState<TraderInvoice[]>([]);
  const [corridors, setCorridors] = useState<CorridorConfig[]>([]);
  const [quote, setQuote] = useState<TraderQuote | null>(null);
  const [workflow, setWorkflow] = useState<TransactionWorkflow | null>(null);
  const [sendStep, setSendStep] = useState(1);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [amount, setAmount] = useState("");
  const [providerAuthorizationRef, setProviderAuthorizationRef] = useState("");
  const [quoteExecution, setQuoteExecution] = useState("disabled");
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccounts, setRecipientAccounts] = useState<TraderAccount[]>([]);
  const [corridorId, setCorridorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<TraderTransfer | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceCounterparty, setInvoiceCounterparty] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceQuantity, setInvoiceQuantity] = useState("1");
  const [invoiceUnitPrice, setInvoiceUnitPrice] = useState("");
  const [activePage, setActivePage] = useState<TraderPage>(pageFromHash);
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountResponse, transferResponse, invoiceResponse, corridorResponse, ticketResponse, notificationResponse] = await Promise.all([
        getTraderAccounts(trader.id),
        getTraderTransfers(trader.id),
        getTraderInvoices(trader.id),
        getCorridors(),
        getTraderSupportTickets(),
        getTraderNotifications()
      ]);
      const accounts = accountResponse.accounts ?? [];
      const transfers = transferResponse.transfers ?? [];
      const invoices = invoiceResponse.invoices ?? [];
      const corridors = corridorResponse.corridors ?? [];
      const tickets = ticketResponse.tickets ?? [];
      const notifications = notificationResponse.notifications ?? [];
      setAccounts(accounts);
      setTransfers(transfers);
      setInvoices(invoices);
      setCorridors(corridors);
      setTickets(tickets);
      setNotifications(notifications);
      const businessAccount = accounts.find((account) => account.type === "BUSINESS");
      if (!sourceAccount && businessAccount) setSourceAccount(businessAccount.id);
      if (!corridorId && corridors[0]) setCorridorId(corridors[0].id);
      const balanceEntries = await Promise.all(accounts.map(async (account) => [account.id, await getTraderBalance(account.id)] as const));
      setBalances(Object.fromEntries(balanceEntries));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your workspace.");
    } finally {
      setLoading(false);
    }
  }, [corridorId, destinationAccount, sourceAccount, trader.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!workflow || ["COMPLETED", "FAILED", "REQUIRES_REVIEW"].includes(workflow.state)) return;
    const timer = window.setInterval(() => {
      void getTransactionWorkflow(workflow.id)
        .then((current) => {
          setWorkflow(current);
          if (["COMPLETED", "FAILED", "REQUIRES_REVIEW"].includes(current.state)) void refresh();
        })
        .catch((workflowError) => setError(workflowError instanceof Error ? workflowError.message : "Unable to refresh transaction status."));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh, workflow]);

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectedSource = balances[sourceAccount];
  const selectedCorridor = corridors.find((corridor) => corridor.id === corridorId);
  const amountMinor = Math.round(Number(amount || 0) * 100);
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const notificationSeverity = (notification: Notification): NonNullable<Notification["severity"]> => notification.severity ?? "info";
  const highestNotification = notifications.find((item) => !item.read_at && notificationSeverity(item) === "error")
    ?? notifications.find((item) => !item.read_at && notificationSeverity(item) === "warning");
  const isOverview = activePage === "overview";
  const showPage = (page: Exclude<TraderPage, "overview">) => isOverview || activePage === page;
  const transferStatusCounts = [
    { label: "Completed", value: transfers.filter((item) => item.status === "COMPLETED" || item.status === "SETTLED").length, className: "chart-success" },
    { label: "Pending", value: transfers.filter((item) => ["PENDING", "PROCESSING", "SUBMITTED"].includes(item.status)).length, className: "chart-pending" },
    { label: "Failed", value: transfers.filter((item) => ["FAILED", "REJECTED"].includes(item.status)).length, className: "chart-failed" }
  ];
  const trendValues = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    const label = date.toLocaleDateString("en-US", { month: "short" });
    const value = transfers.filter((item) => {
      const created = new Date(item.created_at);
      return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
    }).length;
    return { label, value };
  });
  const completedTransfers = transferStatusCounts[0].value;
  const pendingTransfers = transferStatusCounts[1].value;
  const navItems = [
    ["overview", "Overview"],
    ["send", "Send money"],
    ["activity", "Activity"],
    ["invoices", "Invoices"],
    ["recipients", "Recipients"],
    ["reports", "Reports"],
    ["support", "Support"],
    ["settings", "Settings"]
  ] as const;

  async function lookupRecipient() {
    if (!recipientPhone.trim()) {
      setError("Enter a recipient phone number first.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const response = await findTraderRecipient(recipientPhone.trim());
      setRecipientName(response.user.full_name);
      setRecipientAccounts(response.accounts ?? []);
      setDestinationAccount(response.accounts?.find((account) => account.type === "BUSINESS")?.id ?? "");
      setMessage(`Recipient found: ${response.user.full_name}.`);
    } catch (recipientError) {
      setRecipientName("");
      setRecipientAccounts([]);
      setDestinationAccount("");
      setError(recipientError instanceof Error ? recipientError.message : "Unable to find recipient.");
    } finally {
      setWorking(false);
    }
  }

  async function requestQuote() {
    if (!corridorId || amountMinor <= 0) {
      setError("Enter an amount and choose a corridor before requesting a quote.");
      return;
    }
    const source = accounts.find((account) => account.id === sourceAccount);
    const destination = recipientAccounts.find((account) => account.id === destinationAccount);
    if (!source || !destination || !selectedCorridor) {
      setError("Find a recipient and choose both accounts before requesting a quote.");
      return;
    }
    if (!selectedSource || selectedSource.amount < Number(amount)) {
      setError(`Insufficient ${source.currency} balance. Available: ${money(Math.round((selectedSource?.amount ?? 0) * 100), source.currency)}.`);
      return;
    }
    if (source.currency !== selectedCorridor.from_currency || destination.currency !== selectedCorridor.to_currency) {
      setError(`Choose a ${selectedCorridor.from_currency} source account and a ${selectedCorridor.to_currency} recipient account for this corridor.`);
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const response = await getCorridorQuote(corridorId, amountMinor);
      setQuote(response.quote);
      setQuoteExecution(response.execution);
      setMessage("Quote prepared. Review the delivery amount before continuing.");
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Unable to prepare a quote.");
    } finally {
      setWorking(false);
    }
  }

  async function sendTransfer() {
    if (!quote || !sourceAccount || !destinationAccount || !selectedSource) {
      setError("Choose source and destination accounts and prepare a quote first.");
      return;
    }
    if (new Date(quote.expires_at).getTime() <= Date.now()) {
      setError("This quote has expired. Request a new quote before sending.");
      setQuote(null);
      return;
    }
    const destination = recipientAccounts.find((account) => account.id === destinationAccount);
    if (selectedSource.currency !== quote.from_currency || !destination || destination.currency !== quote.to_currency) {
      setError("The selected accounts do not match the quoted currencies. Find the recipient again and request a new quote.");
      setQuote(null);
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const key = idempotencyKey();
      if (quote.from_currency !== quote.to_currency) {
        const response = await createTransactionWorkflow({
          source_account_id: sourceAccount,
          destination_account_id: destinationAccount,
          collection_provider: quote.provider_id,
          payout_provider: selectedCorridor?.provider_id ?? "mpesa-ke",
          collection_phone: trader.phone_number,
          payout_phone: recipientPhone.trim(),
          corridor_id: quote.corridor_id,
          quote_id: quote.id,
          amount: Number(amount),
          currency_from: quote.from_currency,
          currency_to: quote.to_currency,
          rate: quote.rate,
          provider_authorization_ref: providerAuthorizationRef
        }, key);
        setWorkflow(response.workflow);
        setMessage(response.replay ? "This transaction request was safely replayed." : `Transaction workflow ${response.workflow.state.toLowerCase().replaceAll("_", " ")}.`);
      } else {
        const response = await createTraderTransfer({
          source_account_id: sourceAccount,
          destination_account_id: destinationAccount,
          amount: Number(amount),
          currency: selectedSource.currency
        }, key);
        setMessage(response.replayed ? "This request was safely replayed." : "Transfer submitted.");
      }
      setQuote(null);
      setAmount("");
      setProviderAuthorizationRef("");
      await refresh();
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : "Unable to submit transfer.");
    } finally {
      setWorking(false);
    }
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    setWorking(true);
    setError(null);
    try {
      await createTraderSupportTicket(ticketSubject.trim(), ticketDescription.trim(), idempotencyKey());
      setTicketSubject("");
      setTicketDescription("");
      setMessage("Your support request has been recorded.");
      await refresh();
    } catch (ticketError) {
      setError(ticketError instanceof Error ? ticketError.message : "Unable to create support request.");
    } finally {
      setWorking(false);
    }
  }

  async function inspectTransfer(id: string) {
    setWorking(true);
    setError(null);
    try {
      setSelectedTransfer(await getTraderTransfer(id));
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : "Unable to load transfer details.");
    } finally {
      setWorking(false);
    }
  }

  async function markRead(notification: Notification) {
    if (notification.read_at) return;
    try {
      await markTraderNotificationRead(notification.id, trader.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to update notification.");
    }
  }

  async function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const source = accounts.find((account) => account.currency === (accounts[0]?.currency ?? ""));
    if (!invoiceNumber.trim() || !invoiceCounterparty.trim() || !invoiceDueDate || !invoiceDescription.trim() || Number(invoiceUnitPrice) < 0) {
      setError("Complete the invoice number, counterparty, due date, item, and amount.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const invoice = await createTraderInvoice(trader.id, {
        number: invoiceNumber.trim(),
        counterparty_user_id: invoiceCounterparty.trim(),
        currency: source?.currency ?? "RWF",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: invoiceDueDate,
        vat_rate: 0,
        items: [{ description: invoiceDescription.trim(), quantity: Number(invoiceQuantity), unit_price: Number(invoiceUnitPrice) }]
      });
      setInvoices((current) => [invoice, ...current]);
      setInvoiceNumber("");
      setInvoiceCounterparty("");
      setInvoiceDueDate("");
      setInvoiceDescription("");
      setInvoiceUnitPrice("");
      setMessage("Invoice issued and added to your records.");
    } catch (invoiceError) {
      setError(invoiceError instanceof Error ? invoiceError.message : "Unable to issue invoice.");
    } finally {
      setWorking(false);
    }
  }

  return <div className="trader-shell">
    <aside className="trader-sidebar">
      <div className="brand"><span className="brand-mark">V</span><div><strong>VUKA</strong><span>TRADE TRUST</span></div></div>
      <div className="trader-intro"><p className="eyebrow">YOUR WORKSPACE</p><h1>Trade with clarity.</h1><p>Simple tools for moving business forward, with every step visible.</p></div>
      <nav className="trader-nav" aria-label="Trader navigation">
        {navItems.map(([id, label]) => <a key={id} href={`#${id}`} className={`nav-item ${activePage === id ? "active" : ""}`} aria-current={activePage === id ? "page" : undefined}>{label}</a>)}
      </nav>
      <div className="sidebar-footer"><span className="health-dot online" /><span>{trader.full_name}<br /><small>{trader.phone_number}</small></span></div>
    </aside>
    <main className="trader-content">
      <header className="trader-header"><div><p className="eyebrow">TRADER ACCOUNT</p><h2>{t.goodToSeeYou}, {trader.full_name.split(" ")[0]}.</h2><p className="refresh-note">Your account is protected and every transfer is traceable.</p></div><div className="topbar-actions"><select value={lang} onChange={(event) => setLang(event.target.value as Language)} className="outline-button lang-select" aria-label={t.selectLanguage}><option value="en">🇬🇧 English</option><option value="sw">🇰🇪/🇹🇿 Kiswahili</option><option value="fr">🇫🇷 Français</option><option value="rw">🇷🇼 Kinyarwanda</option></select><span className="notification-count">{unreadCount} unread</span><button className="outline-button" onClick={() => void refresh()}>{t.refresh}</button><button className="outline-button" onClick={async () => { await traderLogout(); onSignOut(); }}>{t.signOut}</button></div></header>
      {error && <div className="alert" role="alert">{error}</div>}
      {highestNotification && <div className={`alert alert-${highestNotification.severity}`} role="status"><strong>{highestNotification.title}.</strong> {highestNotification.body}</div>}
      {message && <div className="trader-message" role="status">{message}</div>}
      {isOverview && <section id="workspace" className="trader-overview">
        <div className="trader-welcome"><p className="eyebrow">ACCOUNT OVERVIEW</p><h1>Keep business moving.</h1><p>See what is available, what is in motion, and what needs your attention.</p></div>
        <div className="trader-account-list">{accounts.map((account) => <article className="trader-account" key={account.id}><span className="metric-label">{account.type} account</span><strong>{loading ? "—" : money(Math.round((balances[account.id]?.amount ?? 0) * 100), account.currency)}</strong><span className="cell-sub mono">{account.id.slice(0, 8)}…</span></article>)}</div>
      </section>}
      {isOverview && <section className="content-section analytics-grid">
        <article className="panel analytics-card analytics-trend"><div className="section-heading compact"><div><p className="eyebrow">ACTIVITY TREND</p><h3>Transfer volume</h3></div><span className="refresh-note">Last 6 months</span></div><TrendChart values={trendValues} /><div className="analytics-summary"><span><strong>{transfers.length}</strong> total records</span><span><strong>{completedTransfers}</strong> completed</span><span><strong>{pendingTransfers}</strong> pending</span></div></article>
        <article className="panel analytics-card"><div className="section-heading compact"><div><p className="eyebrow">PORTFOLIO HEALTH</p><h3>Transfer outcomes</h3></div><span className="refresh-note">Live records</span></div><StatusDonut counts={transferStatusCounts} /></article>
      </section>}
      {showPage("send") && <section id="send" className="content-section trader-send-grid">
        <article className="panel trader-form-panel"><div className="section-heading compact"><div><p className="eyebrow">PAYMENT WORKFLOW</p><h2>Send money</h2></div><span className="status status-pending">LOCAL / CONTROLLED</span></div><p className="drawer-note">Prepare a quote, confirm the details, then submit. This local environment does not contact external providers.</p>
          <label className="field-label">Amount<input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} placeholder="0.00" /></label>
          <div className="signup-progress transaction-progress" aria-label={`Transaction step ${sendStep} of 4`}><span className={sendStep >= 1 ? "active" : ""}>1. Details</span><span className={sendStep >= 2 ? "active" : ""}>2. Quote</span><span className={sendStep >= 3 ? "active" : ""}>3. Authorize</span><span className={sendStep >= 4 ? "active" : ""}>4. Confirm</span></div>
          <label className="field-label">Source account<select value={sourceAccount} onChange={(event) => setSourceAccount(event.target.value)}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.type} · {account.currency}</option>)}</select></label>
          <div className="recipient-lookup"><label className="field-label">Recipient phone<input type="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="+250 700 000 000" /></label><button className="row-button recipient-button" type="button" disabled={working} onClick={() => void lookupRecipient()}>Find recipient</button></div>
          {recipientName && <p className="field-note">Sending to <strong>{recipientName}</strong>.</p>}
          <label className="field-label">Destination account<select value={destinationAccount} onChange={(event) => setDestinationAccount(event.target.value)}><option value="">Choose destination</option>{recipientAccounts.length > 0 ? recipientAccounts.map((account) => <option key={account.id} value={account.id}>{account.type} · {account.currency}</option>) : accounts.map((account) => <option key={account.id} value={account.id}>{account.type} · {account.currency}</option>)}</select></label>
          <label className="field-label">Corridor<select value={corridorId} onChange={(event) => { setCorridorId(event.target.value); setQuote(null); }}>{corridors.map((corridor) => <option key={corridor.id} value={corridor.id}>{corridor.from_country} {corridor.from_currency} → {corridor.to_country} {corridor.to_currency}</option>)}</select></label>
          <div className="form-actions"><button className="login-submit" disabled={working} onClick={() => { setSendStep(2); void requestQuote(); }} type="button">Prepare quote <span>→</span></button></div>
          {quote && <div className="quote-card"><div><span className="eyebrow">QUOTE {quote.id.slice(0, 8)}</span><strong>{money(quote.deliver_amount_minor, quote.to_currency)}</strong><span className="cell-sub">Fee {money(quote.fee_minor, quote.from_currency)} · rate {quote.rate}</span><span className="field-note">{quote.observation_only ? "Observation only · external execution is disabled in this environment." : "Review the amount before continuing."}</span></div><button className="row-button" disabled={working || quote.observation_only} onClick={() => setSendStep(3)}>Continue to authorization →</button></div>}
          {quote && sendStep >= 3 && <div className="provider-authorization"><p className="eyebrow">{quoteExecution === "local_synthetic" ? "LOCAL TEST AUTHORIZATION" : "PROVIDER AUTHORIZATION"}</p><h3>{quoteExecution === "local_synthetic" ? "Authorize this synthetic test transaction" : "Approve this payment with your telecom provider"}</h3><p className="field-note">{quoteExecution === "local_synthetic" ? "This uses the local synthetic rail only. No telecom PIN or real money is involved." : "VUKA does not collect or store your MTN, M-Pesa, or Airtel PIN. The provider must return an authorization reference before this transaction can be submitted."}</p>{quoteExecution === "local_synthetic" ? <button className="login-submit" type="button" disabled={working} onClick={() => { setProviderAuthorizationRef("local-synthetic"); setSendStep(4); void sendTransfer(); }}>Authorize test transaction <span>→</span></button> : <><button className="row-button" type="button" disabled>Provider challenge unavailable until credentials are configured</button><p className="field-note">This transaction is blocked safely rather than accepting a manually entered or unverifiable authorization reference.</p><button className="login-submit" type="button" disabled={!providerAuthorizationRef || working} onClick={() => { setSendStep(4); void sendTransfer(); }}>Confirm and submit <span>→</span></button></>}</div>}
          {workflow && <div className="field-note">Workflow status: <strong>{workflow.state.replaceAll("_", " ")}</strong>{workflow.failure_reason ? ` · ${workflow.failure_reason}` : ""}</div>}
          {selectedCorridor && <p className="field-note">Limits: {money(selectedCorridor.min_amount_minor, selectedCorridor.from_currency)} – {money(selectedCorridor.max_amount_minor, selectedCorridor.from_currency)} · quote expires shortly.</p>}
        </article>
        <article className="panel"><p className="eyebrow">ACCOUNT CARE</p><h2>Need a hand?</h2><p className="drawer-note">Our support record keeps your question, context, and follow-up in one place.</p><a href="#support" className="outline-button support-link">Open support</a><div className="notification-preview"><div className="section-heading compact"><h3>Notifications</h3><span className="refresh-note">{unreadCount} unread</span></div>{notifications.slice(0, 3).map((item) => <div className={`activity-entry notification-${notificationSeverity(item)}`} key={item.id}><div><strong>{item.title}</strong><span className="cell-sub">{item.body}</span><span className="cell-sub">{notificationSeverity(item).toUpperCase()}</span></div><button className="row-button" disabled={Boolean(item.read_at)} onClick={() => void markRead(item)}>{item.read_at ? "Read" : "Mark read"}</button></div>)}{notifications.length === 0 && <div className="empty-state">No notifications.</div>}</div></article>
      </section>}
      {showPage("activity") && <section id="activity" className="content-section"><div className="section-heading"><div><p className="eyebrow">TRANSFER HISTORY</p><h2>Activity</h2></div><span className="refresh-note">{transfers.length} recorded transfers</span></div><div className="panel activity-list">{transfers.length === 0 ? <div className="empty-state">Your completed and pending transfers will appear here.</div> : transfers.map((transfer) => <div className="activity-entry" key={transfer.id}><div><strong>{money(Math.round(transfer.amount * 100), transfer.currency)}</strong><span className="cell-sub mono">{transfer.id.slice(0, 12)}…</span></div><div><span className={`status status-${transfer.status.toLowerCase()}`}>{transfer.status}</span><span className="cell-sub">{new Date(transfer.created_at).toLocaleString()}</span></div><button className="row-button" onClick={() => void inspectTransfer(transfer.id)}>Details</button></div>)}</div></section>}
      {selectedTransfer && (isOverview || activePage === "activity") && <div className="drawer-backdrop" role="presentation" onClick={() => setSelectedTransfer(null)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedTransfer(null)} aria-label="Close transfer details">×</button><p className="eyebrow">TRANSFER DETAIL</p><h2>{money(Math.round(selectedTransfer.amount * 100), selectedTransfer.currency)}</h2><span className={`status status-${selectedTransfer.status.toLowerCase()}`}>{selectedTransfer.status}</span><dl className="details"><div><dt>Transfer ID</dt><dd className="mono">{selectedTransfer.id}</dd></div><div><dt>Source account</dt><dd className="mono">{selectedTransfer.source_account_id}</dd></div><div><dt>Destination account</dt><dd className="mono">{selectedTransfer.destination_account_id}</dd></div><div><dt>Created</dt><dd>{new Date(selectedTransfer.created_at).toLocaleString()}</dd></div></dl></aside></div>}
      {showPage("invoices") && <section className="content-section trader-support-grid"><article className="panel"><p className="eyebrow">INVOICES</p><h2>{t.issueInvoice}</h2><form className="support-form" onSubmit={submitInvoice}><label className="field-label">{t.invoiceNumber}<input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="INV-2026-0001" required /></label><label className="field-label">{t.counterparty}<input value={invoiceCounterparty} onChange={(event) => setInvoiceCounterparty(event.target.value)} placeholder="Trader user ID" required /></label><div className="invoice-form-row"><label className="field-label">{t.dueDate}<input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} required /></label><label className="field-label">{t.unitPrice}<input inputMode="decimal" value={invoiceUnitPrice} onChange={(event) => setInvoiceUnitPrice(event.target.value)} placeholder="0" required /></label></div><label className="field-label">{t.lineItem}<input value={invoiceDescription} onChange={(event) => setInvoiceDescription(event.target.value)} placeholder="Goods or service description" required /></label><button className="login-submit" disabled={working}>{t.submitInvoice} <span>→</span></button></form></article><article className="panel"><p className="eyebrow">INVOICE REGISTER</p><h2>Your invoices</h2>{invoices.length === 0 ? <div className="empty-state">No invoices have been issued or received.</div> : invoices.map((invoice) => <div className="activity-entry" key={invoice.id}><div><strong>{invoice.number}</strong><span className="cell-sub">{invoice.items[0]?.description || "Invoice"} · due {invoice.due_date}</span></div><div className="invoice-share-actions"><a href={buildWhatsAppInvoiceShareUrl({ number: invoice.number, amount: invoice.items[0]?.unit_price ?? 0, currency: invoice.currency, description: invoice.items[0]?.description ?? "Trade Item", dueDate: invoice.due_date }, lang)} target="_blank" rel="noopener noreferrer" className="outline-button share-button">💬 {t.shareWhatsApp}</a></div><span className={`status status-${invoice.status.toLowerCase()}`}>{invoice.status}</span></div>)}</article></section>}
      {showPage("recipients") && <section className="content-section trader-support-grid"><article className="panel"><p className="eyebrow">RECIPIENT DIRECTORY</p><h2>Known business contacts</h2><p className="drawer-note">Recipients are resolved from verified account records when you prepare a transfer. VUKA does not create an unverified payout destination.</p><div className="enterprise-list"><div><strong>Search before sending</strong><span>Use a phone number to resolve the recipient and eligible destination account.</span></div><div><strong>Ownership checked</strong><span>Destination accounts are validated before quote preparation.</span></div><div><strong>Corridor aware</strong><span>Available currencies and provider rails determine what can be sent.</span></div></div></article><article className="panel"><p className="eyebrow">RECENT DESTINATIONS</p><h2>Transfer-linked accounts</h2>{transfers.length === 0 ? <div className="empty-state">Recipients will appear here after your first transfer.</div> : Array.from(new Set(transfers.map((transfer) => transfer.destination_account_id))).slice(0, 6).map((accountId) => <div className="activity-entry" key={accountId}><div><strong>Business destination</strong><span className="cell-sub mono">{accountId}</span></div><span className="status status-completed">VERIFIED RECORD</span></div>)}</article></section>}
      {showPage("reports") && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">BUSINESS REPORTING</p><h2>Movement at a glance</h2></div><span className="refresh-note">Derived from recorded activity</span></div><div className="metric-grid"><article className="metric-card"><span className="metric-label">Total transfers</span><strong>{transfers.length}</strong><span className="metric-note">Recorded in your workspace</span></article><article className="metric-card"><span className="metric-label">Completed</span><strong>{completedTransfers}</strong><span className="metric-note">Settled outcomes</span></article><article className="metric-card"><span className="metric-label">Pending</span><strong>{pendingTransfers}</strong><span className="metric-note">Still in motion</span></article><article className="metric-card"><span className="metric-label">Invoices</span><strong>{invoices.length}</strong><span className="metric-note">Issued or received</span></article></div><div className="panel"><p className="eyebrow">REPORTING STATUS</p><h3>Exportable reporting is being prepared</h3><p className="drawer-note">The current view is derived live from your ledger-linked records. CSV and accounting exports will be enabled with the reporting service.</p><button className="outline-button" type="button" disabled>Export report · coming soon</button></div></section>}
      {showPage("support") && <section id="support" className="content-section trader-support-grid"><article className="panel"><p className="eyebrow">SUPPORT</p><h2>Start a conversation</h2><form className="support-form" onSubmit={submitTicket}><label className="field-label">Subject<input value={ticketSubject} onChange={(event) => setTicketSubject(event.target.value)} placeholder="What do you need help with?" required /></label><label className="field-label">Message<textarea value={ticketDescription} onChange={(event) => setTicketDescription(event.target.value)} rows={5} placeholder="Tell us what happened or what you need." required /></label><button className="login-submit" disabled={working}>Send request <span>→</span></button></form></article><article className="panel"><p className="eyebrow">YOUR REQUESTS</p><h2>Support history</h2>{tickets.length === 0 ? <div className="empty-state">No support requests yet.</div> : tickets.map((ticket) => <div className="activity-entry" key={ticket.id}><div><strong>{ticket.subject}</strong><span className="cell-sub">{ticket.description}</span></div><span className="status status-pending">{ticket.status}</span></div>)}</article></section>}
      {showPage("settings") && <section className="content-section trader-support-grid"><article className="panel"><p className="eyebrow">ACCOUNT SETTINGS</p><h2>Business identity</h2><div className="enterprise-list"><div><span>Full name</span><strong>{trader.full_name}</strong></div><div><span>Phone number</span><strong>{trader.phone_number}</strong></div><div><span>Trader ID</span><strong className="mono">{trader.id}</strong></div></div></article><article className="panel"><p className="eyebrow">SECURITY POSTURE</p><h2>Protected by design</h2><div className="enterprise-list"><div><strong>Password authentication</strong><span>Active session controls are handled by the engine.</span></div><div><strong>Telecom PIN</strong><span>Never collected or stored by VUKA.</span></div><div><strong>Transaction authorization</strong><span>Provider-owned references or local synthetic authorization.</span></div></div></article></section>}
    </main>
  </div>;
}
