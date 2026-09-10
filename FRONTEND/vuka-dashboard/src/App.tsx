import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { acknowledgeReconciliationAlert, addDisputeDecision, addDisputeReview, approveDisputeDecision, approvePilot, cancelPilot, completePilot, decideComplianceReview, getActivity, getActivityExportUrl, getAlertHistory, getComplianceReviews, getCorridors, getCurrentOperator, getCurrentTrader, getDisputeDecisions, getDisputeReviews, getDisputeTimeline, getDisputeExportUrl, getDisputes, getEscrowEvents, getEscrows, getHealth, getOrganizations, getPilots, getProviderStatus, getProviderWebhookEvents, getSettlementCommands, getReconciliationStatus, getReconciliationStatusExportUrl, login, logout, pausePilot, registerTrader, resumePilot, traderLogin, contract } from "./api";
import type { ComplianceReview, CorridorConfig, Dispute, DisputeDecision, DisputeReview, DisputeTimelineEntry, Escrow, EscrowEvent, EscrowState, Operator, OperatorActivity, Organization, Pilot, ProviderStatus, ProviderWebhookEvent, ReconciliationStatus, SettlementCommand, Trader } from "./types";
import { TraderApp } from "./TraderApp";

const refreshInterval = 15000;
const controlRoomPages = ["overview", "escrows", "reconciliation", "providers", "settlements", "pilots", "activity", "compliance", "disputes"] as const;
type ControlRoomPage = typeof controlRoomPages[number];

function controlRoomPageFromHash(): ControlRoomPage {
  const page = window.location.hash.replace(/^#/, "");
  return controlRoomPages.includes(page as ControlRoomPage) ? page as ControlRoomPage : "overview";
}

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
  const [trader, setTrader] = useState<Trader | null>(null);
  const [accessMode, setAccessMode] = useState<"operator" | "trader">("trader");
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [signupCurrency, setSignupCurrency] = useState("RWF");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activity, setActivity] = useState<OperatorActivity[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityAction, setActivityAction] = useState("ALL");
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [alertHistory, setAlertHistory] = useState<OperatorActivity[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingDispute, setReviewingDispute] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [decisionChoice, setDecisionChoice] = useState<Record<string, DisputeDecision["decision"]>>({});
  const [decisionRationales, setDecisionRationales] = useState<Record<string, string>>({});
  const [decidingDispute, setDecidingDispute] = useState<string | null>(null);
  const [disputeReviews, setDisputeReviews] = useState<Record<string, DisputeReview[]>>({});
  const [disputeDecisions, setDisputeDecisions] = useState<Record<string, DisputeDecision[]>>({});
  const [disputeTimelines, setDisputeTimelines] = useState<Record<string, DisputeTimelineEntry[]>>({});
  const [approvingDecision, setApprovingDecision] = useState<string | null>(null);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [alertAckError, setAlertAckError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [complianceReviews, setComplianceReviews] = useState<ComplianceReview[]>([]);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [complianceAction, setComplianceAction] = useState<string | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [corridors, setCorridors] = useState<CorridorConfig[]>([]);
  const [providerEvents, setProviderEvents] = useState<ProviderWebhookEvent[]>([]);
  const [settlementCommands, setSettlementCommands] = useState<SettlementCommand[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [activePage, setActivePage] = useState<ControlRoomPage>(controlRoomPageFromHash);

  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      let currentOperator: Operator;
      try {
        currentOperator = await getCurrentOperator();
      } catch (operatorError) {
        const currentTrader = await getCurrentTrader();
        setTrader(currentTrader);
        setAuthRequired(false);
        return;
      }
      setTrader(null);
      setDisputesLoading(currentOperator.role === "arbiter" || currentOperator.role === "operator");
      const [escrowResponse, reconciliationStatus, health, disputeResponse, activityResponse, alertHistoryResponse, organizationResponse, reviewResponse, providerResponse, corridorResponse, providerEventResponse, settlementResponse, pilotResponse] = await Promise.all([
        getEscrows(),
        getReconciliationStatus(),
        getHealth(),
        currentOperator.role === "operator" || currentOperator.role === "arbiter" ? getDisputes() : Promise.resolve({ disputes: [] }),
        getActivity({ action: activityAction, search: activitySearch.trim(), from: activityFrom, to: activityTo, offset: (activityPage - 1) * 20 }),
        getAlertHistory(),
        getOrganizations().catch(() => ({ organizations: [] })),
        getComplianceReviews("pending").catch(() => ({ reviews: [] })),
        getProviderStatus(),
        getCorridors(),
        getProviderWebhookEvents(),
        getSettlementCommands().catch(() => ({ commands: [] })),
        getPilots().catch(() => ({ pilots: [] }))
      ]);
      setEscrows(escrowResponse.escrows);
      setStatus(reconciliationStatus);
      setHealthy(health);
      setOperator(currentOperator);
      setActivity(activityResponse.activities);
      setActivityTotal(activityResponse.total);
      setAlertHistory(alertHistoryResponse.activities);
      setOrganizations(organizationResponse.organizations);
      setComplianceReviews(reviewResponse.reviews);
      setProviderStatuses(providerResponse.providers);
      setCorridors(corridorResponse.corridors);
      setProviderEvents(providerEventResponse.events);
      setSettlementCommands(settlementResponse.commands);
      setPilots(pilotResponse.pilots);
      setComplianceError(null);
      setDisputes(disputeResponse.disputes);
      if (currentOperator.role === "arbiter" || currentOperator.role === "operator") {
        const reviewResponses = await Promise.all(
          disputeResponse.disputes.map(async (dispute) => [dispute.id, (await getDisputeReviews(dispute.id)).reviews] as const)
        );
        setDisputeReviews(Object.fromEntries(reviewResponses));
        const decisionResponses = await Promise.all(
          disputeResponse.disputes.map(async (dispute) => [dispute.id, (await getDisputeDecisions(dispute.id)).decisions] as const)
        );
        setDisputeDecisions(Object.fromEntries(decisionResponses));
        const timelineResponses = await Promise.all(
          disputeResponse.disputes.map(async (dispute) => [dispute.id, (await getDisputeTimeline(dispute.id)).timeline] as const)
        );
        setDisputeTimelines(Object.fromEntries(timelineResponses));
      } else {
        setDisputeReviews({});
        setDisputeDecisions({});
        setDisputeTimelines({});
      }
      setDisputesError(null);
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
        setDisputes([]);
        setActivity([]);
        setAlertHistory([]);
        setOrganizations([]);
        setComplianceReviews([]);
        setProviderStatuses([]);
        setCorridors([]);
        setProviderEvents([]);
        setSettlementCommands([]);
        setPilots([]);
        setDisputeReviews({});
        setDisputeDecisions({});
        setDisputeTimelines({});
        setError(null);
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Unable to load operations data");
      setHealthy(false);
      setComplianceError(loadError instanceof Error ? loadError.message : "Unable to load compliance workflow");
      if (operator?.role === "arbiter") {
        setDisputesError(loadError instanceof Error ? loadError.message : "Unable to load disputes");
      }
    } finally {
      setDisputesLoading(false);
    }
  }, [activityAction, activityFrom, activityPage, activitySearch, activityTo, operator?.role]);

  async function handleReview(dispute: Dispute) {
    const note = (reviewNotes[dispute.id] ?? "").trim();
    if (!note) {
      setReviewError("Enter a review note before submitting.");
      return;
    }

    setReviewingDispute(dispute.id);
    setReviewError(null);
    try {
      await addDisputeReview(dispute.id, note);
      setReviewNotes((current) => ({ ...current, [dispute.id]: "" }));
      const response = await getDisputeReviews(dispute.id);
      setDisputeReviews((current) => ({ ...current, [dispute.id]: response.reviews }));
      const timeline = await getDisputeTimeline(dispute.id);
      setDisputeTimelines((current) => ({ ...current, [dispute.id]: timeline.timeline }));
    } catch (reviewLoadError) {
      setReviewError(reviewLoadError instanceof Error ? reviewLoadError.message : "Unable to save review.");
    } finally {
      setReviewingDispute(null);
    }

  }

  async function handleDecision(dispute: Dispute) {
    const decision = decisionChoice[dispute.id] ?? "RELEASE";
    const rationale = (decisionRationales[dispute.id] ?? "").trim();
    if (!rationale) {
      setReviewError("Enter a rationale before recording a decision.");
      return;
    }
    setDecidingDispute(dispute.id);
    setReviewError(null);
    try {
      await addDisputeDecision(dispute.id, decision, rationale);
      setDecisionRationales((current) => ({ ...current, [dispute.id]: "" }));
      const timeline = await getDisputeTimeline(dispute.id);
      setDisputeTimelines((current) => ({ ...current, [dispute.id]: timeline.timeline }));
    } catch (decisionError) {
      setReviewError(decisionError instanceof Error ? decisionError.message : "Unable to record decision.");
    } finally {
      setDecidingDispute(null);
    }
  }

  async function handleApprove(decision: DisputeDecision) {
    setApprovingDecision(decision.id);
    setReviewError(null);
    try {
      const approval = await approveDisputeDecision(decision.id);
      setDisputeDecisions((current) => ({
        ...current,
        [decision.dispute_id]: current[decision.dispute_id].map((item) =>
          item.id === decision.id ? { ...item, approvals: [...item.approvals, approval] } : item
        )
      }));
      const timeline = await getDisputeTimeline(decision.dispute_id);
      setDisputeTimelines((current) => ({ ...current, [decision.dispute_id]: timeline.timeline }));
    } catch (approvalError) {
      setReviewError(approvalError instanceof Error ? approvalError.message : "Unable to approve recommendation.");
    } finally {
      setApprovingDecision(null);
    }

  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      if (accessMode === "trader") {
        const currentTrader = await traderLogin(phone, password);
        setTrader(currentTrader);
        setAuthRequired(false);
        setPassword("");
        return;
      }

      await login(email, password);
      setPassword("");
      await load();
    } catch (loginLoadError) {
      setLoginError(loginLoadError instanceof Error ? loginLoadError.message : "Unable to sign in.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (accessMode !== "trader") return;
    if (password !== confirmPassword) {
      setLoginError("Passwords do not match.");
      return;
    }

    setLoggingIn(true);
    setLoginError(null);
    try {
      await registerTrader({
        full_name: fullName,
        phone_number: phone,
        business_reg_number: businessRegNumber || undefined,
        password,
        currency: signupCurrency
      });
      const currentTrader = await traderLogin(phone, password);
      setTrader(currentTrader);
      setAuthRequired(false);
      setPassword("");
      setConfirmPassword("");
    } catch (signupError) {
      setLoginError(signupError instanceof Error ? signupError.message : "Unable to create your account.");
    } finally {
      setLoggingIn(false);
    }
  }

  function continueSignup() {
    setLoginError(null);
    if (signupStep === 1 && (!fullName.trim() || !phone.trim())) {
      setLoginError("Enter your full name and phone number to continue.");
      return;
    }
    if (signupStep === 2) {
      setSignupStep(3);
      return;
    }
    setSignupStep(2);
  }

  async function handleComplianceDecision(review: ComplianceReview, status: ComplianceReview["status"]) {
    const rationale = window.prompt(`Rationale for ${status.replace("_", " ")} decision`)?.trim();
    if (!rationale) return;
    setComplianceAction(review.id);
    setComplianceError(null);
    try {
      await decideComplianceReview(review.id, status, rationale);
      const response = await getComplianceReviews("pending");
      setComplianceReviews(response.reviews);
    } catch (decisionError) {
      setComplianceError(decisionError instanceof Error ? decisionError.message : "Unable to record compliance decision");
    } finally {
      setComplianceAction(null);
    }
  }

  async function handlePilotAction(action: "approve" | "pause" | "resume" | "complete" | "cancel", item: Pilot) {
    try {
      if (action === "approve") await approvePilot(item.id);
      if (action === "pause") await pausePilot(item.id);
      if (action === "resume") await resumePilot(item.id);
      if (action === "complete") await completePilot(item.id);
      if (action === "cancel") await cancelPilot(item.id);
      await load();
    } catch (pilotError) {
      setError(pilotError instanceof Error ? pilotError.message : "Unable to update pilot");
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
      setTrader(null);
      setDisputes([]);
      setActivity([]);
      setDisputeReviews({});
      setDisputeDecisions({});
      setDisputeTimelines({});
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), refreshInterval);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const handleHashChange = () => setActivePage(controlRoomPageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
  const alertLevel = status?.alert_level ?? "ok";
  const isStale = alertLevel !== "ok";
  const alertMessage = hasWorkerErrors
    ? `The worker has reported ${status?.metrics.Errors} error${status?.metrics.Errors === 1 ? "" : "s"}.`
    : `Indexing is behind by ${lagBlocks?.toLocaleString()} finalized blocks.`;
  const activityActions = ["ALL", "SIGN_IN", "SIGN_OUT", "ACTIVITY_VIEWED", "ACTIVITY_EXPORTED", "RECONCILIATION_STATUS_EXPORTED", "ALERT_ACKNOWLEDGED", "REVIEW_NOTE_CREATED", "RECOMMENDATION_CREATED", "RECOMMENDATION_APPROVED", "DISPUTE_EXPORTED"];
  const filteredActivity = useMemo(() => {
    return activity;
  }, [activity]);
  const activityPageCount = Math.max(1, Math.ceil(activityTotal / 20));
  const isOverview = activePage === "overview";
  const showPage = (page: Exclude<ControlRoomPage, "overview">) => isOverview || activePage === page;

  useEffect(() => {
    setPage(1);
  }, [search, stateFilter]);

  useEffect(() => {
    setActivityPage(1);
  }, [activityAction, activityFrom, activitySearch, activityTo]);

  useEffect(() => {
    setAlertAcknowledged(false);
    setAlertAckError(null);
  }, [status?.alert_level, status?.lag_blocks, status?.metrics.Errors]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    trader ? <TraderApp trader={trader} onSignOut={() => { setTrader(null); setAuthRequired(true); }} /> :
    authRequired ? <main className="login-shell">
      <div className="login-layout">
        <form className="login-card" onSubmit={authView === "login" ? handleLogin : handleSignup}>
          <div className="login-brand">
            <span className="login-brand-mark">V</span>
            <div>
              <strong>VUKA</strong>
              <span>TRADE TRUST</span>
            </div>
          </div>
          <div className="login-heading">
            <div className="access-switcher" role="tablist" aria-label="Account access">
              <button type="button" className={accessMode === "trader" ? "active" : ""} onClick={() => setAccessMode("trader")}>Trader</button>
              <button type="button" className={accessMode === "operator" ? "active" : ""} onClick={() => { setAccessMode("operator"); setAuthView("login"); }}>Operations</button>
            </div>
            <p className="eyebrow">{authView === "login" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}</p>
            <h1>{authView === "login" ? "Move with confidence." : "Start trading with clarity."}</h1>
            <p className="login-note">{accessMode === "trader" ? "Clear balances, protected approvals, and traceable trade settlement." : "Monitor reconciled escrow activity and supervised trade operations."}</p>
          </div>
          <div className="login-security">
            <span className="security-indicator" aria-hidden="true" />
            <span>Protected {accessMode === "trader" ? "trader" : "operator"} access</span>
          </div>
          {authView === "signup" && <div className="signup-progress" aria-label={`Registration step ${signupStep} of 3`}><span className={signupStep >= 1 ? "active" : ""}>1. Profile</span><span className={signupStep >= 2 ? "active" : ""}>2. Account</span><span className={signupStep >= 3 ? "active" : ""}>3. Security</span></div>}
          {authView === "login" && <>{accessMode === "trader" ? <label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="username" placeholder="+250 700 000 000" /></label> : <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" placeholder="you@company.com" /></label>}<label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Enter your password" /></label></>}
          {authView === "signup" && signupStep === 1 && <><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Your full name" autoComplete="name" /></label><label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" placeholder="+250 700 000 000" /></label></>}
          {authView === "signup" && signupStep === 2 && <><label>Settlement currency<select value={signupCurrency} onChange={(event) => setSignupCurrency(event.target.value)}><option value="RWF">RWF — Rwanda</option><option value="KES">KES — Kenya</option></select></label><label>Business registration number <span className="optional-label">optional</span><input value={businessRegNumber} onChange={(event) => setBusinessRegNumber(event.target.value)} placeholder="Registration number" /></label></>}
          {authView === "signup" && signupStep === 3 && <><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" placeholder="Create a password" /></label><label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" placeholder="Repeat your password" /></label><p className="field-note">Transaction authorization is requested from the telecom provider when you send money. VUKA does not store telecom PINs.</p></>}
          {loginError && <p className="login-error" role="alert">{loginError}</p>}
          {authView === "signup" && signupStep < 3 ? <button type="button" className="login-submit" onClick={continueSignup}>Continue <span aria-hidden="true">→</span></button> : <button className="login-submit" disabled={loggingIn || (authView === "signup" && accessMode !== "trader")}>{loggingIn ? "Working…" : authView === "login" ? (accessMode === "trader" ? "Enter workspace" : "Continue to console") : "Create trader account"}<span aria-hidden="true">→</span></button>}
          {authView === "signup" && signupStep > 1 && <button type="button" className="auth-switch" onClick={() => { setSignupStep((currentStep) => currentStep - 1); setLoginError(null); }}>← Back</button>}
          <button type="button" className="auth-switch" onClick={() => { setAuthView(authView === "login" ? "signup" : "login"); setSignupStep(1); setLoginError(null); }}>{authView === "login" ? "New to VUKA? Create a trader account" : "Already registered? Sign in"}</button>
          <p className="login-footer">Authorized access only · Sessions expire automatically.</p>
        </form>
        <aside className="login-visual" aria-label="VUKA trade trust">
          <div className="visual-grid" aria-hidden="true">
            <span className="visual-line visual-line-one" />
            <span className="visual-line visual-line-two" />
            <span className="visual-node visual-node-one" />
            <span className="visual-node visual-node-two" />
            <span className="visual-node visual-node-three" />
          </div>
          <div className="visual-copy">
            <p className="eyebrow">VUKA / CONTROLLED MOVEMENT</p>
            <h2>Trade that leaves a clear record.</h2>
            <p>From first approval to final settlement, every important step stays visible.</p>
          </div>
          <div className="visual-footer"><span>RWANDA</span><span>KENYA</span><span>TRACEABLE BY DESIGN</span></div>
        </aside>
      </div>
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
          <a className={`nav-item ${activePage === "overview" ? "active" : ""}`} href="#overview" aria-current={activePage === "overview" ? "page" : undefined}>Overview</a>
          <a className={`nav-item ${activePage === "escrows" ? "active" : ""}`} href="#escrows" aria-current={activePage === "escrows" ? "page" : undefined}>Escrows</a>
          <a className={`nav-item ${activePage === "reconciliation" ? "active" : ""}`} href="#reconciliation" aria-current={activePage === "reconciliation" ? "page" : undefined}>Reconciliation</a>
          <a className={`nav-item ${activePage === "providers" ? "active" : ""}`} href="#providers" aria-current={activePage === "providers" ? "page" : undefined}>Providers &amp; corridors</a>
          <a className={`nav-item ${activePage === "settlements" ? "active" : ""}`} href="#settlements" aria-current={activePage === "settlements" ? "page" : undefined}>Settlements</a>
          <a className={`nav-item ${activePage === "pilots" ? "active" : ""}`} href="#pilots" aria-current={activePage === "pilots" ? "page" : undefined}>Supervised pilots</a>
          <a className={`nav-item ${activePage === "activity" ? "active" : ""}`} href="#activity" aria-current={activePage === "activity" ? "page" : undefined}>System audit</a>
          <a className={`nav-item ${activePage === "compliance" ? "active" : ""}`} href="#compliance" aria-current={activePage === "compliance" ? "page" : undefined}>Identity &amp; compliance</a>
          {operator?.role === "arbiter" && <a className={`nav-item ${activePage === "disputes" ? "active" : ""}`} href="#disputes" aria-current={activePage === "disputes" ? "page" : undefined}>Dispute review</a>}
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
        {status && (isStale || hasWorkerErrors) && <div className={`alert alert-${alertLevel}`} role="status">
          <div><strong>{alertLevel === "critical" ? "Critical reconciliation alert." : "Reconciliation warning."}</strong>{" "}{alertMessage}</div>
          <div className="alert-actions">
            {alertAcknowledged || (status?.acknowledged_level === alertLevel && status?.acknowledged_message === alertMessage) ? <span className="alert-acknowledged">Acknowledged{status?.acknowledged_by ? ` by ${status.acknowledged_by}` : ""}</span> :
              <button className="row-button" onClick={() => {
                setAlertAckError(null);
                void acknowledgeReconciliationAlert(alertLevel === "critical" ? "critical" : "warning", alertMessage)
                  .then(() => setAlertAcknowledged(true))
                  .catch((ackError) => setAlertAckError(ackError instanceof Error ? ackError.message : "Unable to acknowledge alert"));
              }}>Acknowledge alert</button>}
            {alertAckError && <span className="alert-error">{alertAckError}</span>}
          </div>
        </div>}

        {isOverview && <section id="overview" className="metric-grid" aria-label="Escrow overview">
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
        </section>}

        {showPage("escrows") && <section id="escrows" className="content-section">
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
        </section>}

        {showPage("reconciliation") && <section id="reconciliation" className="content-section bottom-grid">
          <article className="panel">
            <div className="section-heading compact">
              <div><p className="eyebrow">SYNC TELEMETRY</p><h2>Reconciliation health</h2></div>
              <a className="row-button export-link" href={getReconciliationStatusExportUrl()} download>Export status CSV</a>
            </div>
            {hasWorkerErrors && <div className="health-alert health-critical" role="status">Reconciliation has recorded {status?.metrics.Errors} worker error{status?.metrics.Errors === 1 ? "" : "s"}.</div>}
            {isStale && !hasWorkerErrors && <div className={`health-alert health-${alertLevel}`} role="status">Indexing is behind by {lagBlocks?.toLocaleString()} blocks. Warning at {status?.warning_lag_blocks.toLocaleString()} blocks; critical at {status?.critical_lag_blocks.toLocaleString()}.</div>}
            {!hasWorkerErrors && !isStale && status && <div className="health-ok" role="status">Reconciler is operating within the expected range.</div>}
            <div className="health-list">
              <div><span>Cursor</span><strong className="mono">{status?.cursor.toLocaleString() ?? "—"}</strong></div>
              <div><span>Latest finalized block</span><strong className="mono">{status?.finalized_block.toLocaleString() ?? "—"}</strong></div>
              <div><span>Indexing lag</span><strong>{status ? `${status.lag_blocks.toLocaleString()} blocks` : "—"}</strong></div>
              <div><span>Events applied</span><strong>{status?.metrics.EventsApplied ?? "—"}</strong></div>
              <div><span>Successful polls</span><strong>{status?.metrics.SuccessfulPolls ?? "—"}</strong></div>
              <div><span>Errors</span><strong>{status?.metrics.Errors ?? "—"}</strong></div>
              <div><span>Dashboard refreshed</span><strong>{lastUpdated?.toLocaleTimeString() ?? "—"}</strong></div>
            </div>
            <div className="alert-history">
              <div className="section-heading compact">
                <div><p className="eyebrow">AUDITABLE ALERTS</p><h3>Alert history</h3></div>
                <span className="refresh-note">{alertHistory.length} recent acknowledgement{alertHistory.length === 1 ? "" : "s"}</span>
              </div>
              {alertHistory.length === 0 && <div className="empty-state">No reconciliation alerts have been acknowledged.</div>}
              {alertHistory.map((item) => {
                const details = item.details ?? "";
                const separator = details.indexOf(":");
                const level = separator > 0 ? details.slice(0, separator) : "ALERT";
                const message = separator > 0 ? details.slice(separator + 1).trim() : details;
                return <div className="alert-history-entry" key={item.id}>
                  <div><strong>{level}</strong><span>{message}</span><small>{item.resource ?? "reconciliation"}</small></div>
                  <div><span>{item.actor}</span><time>{new Date(item.created_at).toLocaleString()}</time></div>
                </div>;
              })}
            </div>
          </article>
          <article className="panel network-panel">
            <p className="eyebrow">NETWORK</p>
            <h2>Polygon Amoy</h2>
            <span className="mono">{shorten(contract)}</span>
            <div className="network-meta"><span>Chain ID</span><strong>80002</strong></div>
            <div className="network-meta"><span>Mode</span><strong>Read-only</strong></div>
          </article>
        </section>}

        {showPage("providers") && <section id="providers" className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">PHASE 4 / SANDBOX ONLY</p><h2>Provider &amp; corridor controls</h2></div>
            <span className="refresh-note">Read-only · no settlement execution</span>
          </div>
          <div className="bottom-grid">
            <article className="panel">
              <div className="section-heading compact"><div><p className="eyebrow">ADAPTER HEALTH</p><h3>Providers</h3></div><span className="refresh-note">{providerStatuses.length} configured</span></div>
              {providerStatuses.length === 0 ? <div className="empty-state">No provider status is available.</div> : providerStatuses.map((provider) =>
                <div className="activity-entry" key={provider.config.id}>
                  <div><strong>{provider.config.display_name}</strong><span className="cell-sub">{provider.config.id} · contract {provider.config.contract_version} · {provider.config.environment}</span></div>
                  <span className={`status status-${provider.healthy ? "approved" : "suspended"}`}>{provider.config.kill_switch ? "kill switch" : provider.healthy ? "healthy" : "disabled"}</span>
                </div>)}
            </article>
            <article className="panel">
              <div className="section-heading compact"><div><p className="eyebrow">CORRIDOR POLICY</p><h3>Limits &amp; FX</h3></div><span className="refresh-note">{corridors.length} corridors</span></div>
              {corridors.length === 0 ? <div className="empty-state">No corridor configuration is available.</div> : corridors.map((corridor) =>
                <div className="activity-entry" key={corridor.id}>
                  <div><strong>{corridor.from_country}/{corridor.from_currency} → {corridor.to_country}/{corridor.to_currency}</strong><span className="cell-sub">{corridor.id} · {corridor.fees_bps} bps · FX {corridor.fx.rate} ({corridor.fx.source})</span></div>
                  <span className={`status status-${corridor.enabled && !corridor.kill_switch ? "approved" : "suspended"}`}>{corridor.kill_switch ? "kill switch" : corridor.enabled ? "enabled" : "disabled"}</span>
                </div>)}
            </article>
          </div>
          <article className="panel">
            <div className="section-heading compact"><div><p className="eyebrow">WEBHOOK EVIDENCE</p><h3>Observed provider events</h3></div><span className="refresh-note">Always NOT_SETTLED</span></div>
            {providerEvents.length === 0 ? <div className="empty-state">No provider webhook events have been observed.</div> : providerEvents.slice(-10).reverse().map((event) =>
              <div className="activity-entry" key={`${event.provider_id}-${event.replay_key}`}>
                <div><strong>{event.event_type || "unknown event"}</strong><span className="cell-sub">{event.provider_id} · replay key {event.replay_key}</span></div>
                <span className="status status-pending">{event.state} · {event.settlement_action}</span>
              </div>)}
          </article>
        </section>}

        {showPage("settlements") && <section id="settlements" className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">PHASE 5 / DRY-RUN ONLY</p><h2>Controlled settlement queue</h2></div>
            <span className="refresh-note">Global kill switch active · no funds move</span>
          </div>
          <div className="panel activity-list">
            {settlementCommands.length === 0 ? <div className="empty-state">No settlement commands have been submitted.</div> :
              settlementCommands.slice(0, 12).map((command) => <div className="activity-entry" key={command.id}>
                <div><strong>{command.action.toUpperCase()} · {command.amount_minor.toLocaleString()} {command.currency}</strong>
                  <span className="cell-sub">{command.target} · {command.provider_id} · {command.corridor_id}</span>
                  <span className="cell-sub">{command.reason}</span></div>
                <span className="status status-pending">{command.status} · {command.approval_state}</span>
              </div>)}
          </div>
        </section>}

        {showPage("pilots") && <section id="pilots" className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">PHASE 6 / SUPERVISED PILOT</p><h2>Pilot preparation</h2></div>
            <span className="refresh-note">Synthetic · observation-only · kill switch active</span>
          </div>
          <div className="panel activity-list">
            {pilots.length === 0 ? <div className="empty-state">No local synthetic pilots have been prepared.</div> :
              pilots.slice(0, 12).map((pilot) => <div className="activity-entry" key={pilot.id}>
                <div><strong>{pilot.pilot_id}</strong><span className="cell-sub">{pilot.corridor_id} · {pilot.provider_id} · {pilot.environment}</span><span className="cell-sub">{pilot.scope} · max {pilot.max_participants} participants</span></div>
                <div className="pagination-actions">
                  <span className={`status status-${pilot.status}`}>{pilot.status}{pilot.observation_only ? " · observe" : ""}</span>
                  {operator?.role === "arbiter" && ["draft", "planned"].includes(pilot.status) && <button className="row-button" onClick={() => void handlePilotAction("approve", pilot)}>Approve</button>}
                  {["approved", "paused"].includes(pilot.status) && <button className="row-button" onClick={() => void handlePilotAction("resume", pilot)}>Resume</button>}
                  {pilot.status === "active" && <button className="row-button" onClick={() => void handlePilotAction("pause", pilot)}>Pause</button>}
                  {["active", "paused"].includes(pilot.status) && <button className="row-button" onClick={() => void handlePilotAction("complete", pilot)}>Complete</button>}
                  {!["completed", "cancelled"].includes(pilot.status) && <button className="row-button" onClick={() => void handlePilotAction("cancel", pilot)}>Cancel</button>}
                </div>
              </div>)}
          </div>
        </section>}

        {showPage("activity") && <section id="activity" className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">SYSTEM AUDIT</p><h2>Operator activity</h2></div>
            <div className="activity-heading-actions">
              <span className="refresh-note">{activityTotal} matching actions</span>
              <a className="row-button export-link" href={getActivityExportUrl({ action: activityAction, search: activitySearch.trim(), from: activityFrom, to: activityTo })} download>Export activity CSV</a>
            </div>
          </div>
          <div className="activity-tools">
            <input
              aria-label="Search operator activity"
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              placeholder="Search actor or activity"
            />
            <select aria-label="Filter activity by action" value={activityAction} onChange={(event) => setActivityAction(event.target.value)}>
              {activityActions.map((action) => <option key={action} value={action}>{action === "ALL" ? "All actions" : action.replaceAll("_", " ")}</option>)}
            </select>
            <input aria-label="Activity start date" type="date" value={activityFrom} onChange={(event) => setActivityFrom(event.target.value)} />
            <input aria-label="Activity end date" type="date" value={activityTo} onChange={(event) => setActivityTo(event.target.value)} />
          </div>
          <div className="panel activity-list">
            {activity.length === 0 && <div className="empty-state">No operator activity has been recorded.</div>}
            {activity.length === 0 && activityTotal > 0 && <div className="empty-state">No activity matches the current filters.</div>}
            {filteredActivity.map((item) => (
              <div className="activity-entry" key={item.id}>
                <div>
                  <strong>{item.action.replaceAll("_", " ")}</strong>
                  <span className="cell-sub">{item.actor} · {item.role}</span>
                  {item.details && <span className="cell-sub">{item.details}</span>}
                </div>
                <span className="refresh-note">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            ))}
            {activityTotal > 0 && <div className="activity-pagination">
              <span className="refresh-note">Page {activityPage} of {activityPageCount}</span>
              <div className="pagination-actions">
                <button className="row-button" disabled={activityPage === 1} onClick={() => setActivityPage((page) => page - 1)}>Previous</button>
                <button className="row-button" disabled={activityPage === activityPageCount} onClick={() => setActivityPage((page) => page + 1)}>Next</button>
              </div>
            </div>}
          </div>
        </section>}

        {showPage("compliance") && <section id="compliance" className="content-section">
          <div className="section-heading">
            <div><p className="eyebrow">PHASE 3 / LOCAL-ONLY</p><h2>Identity &amp; compliance review</h2></div>
            <span className="refresh-note">{complianceReviews.length} pending reviews</span>
          </div>
          {complianceError && <div className="alert" role="alert">{complianceError}</div>}
          <div className="bottom-grid">
            <article className="panel">
              <div className="section-heading compact"><div><p className="eyebrow">TRADER PROFILES</p><h3>Organizations</h3></div><span className="refresh-note">{organizations.length} profiles</span></div>
              {organizations.length === 0 ? <div className="empty-state">No local organization profiles have been seeded.</div> :
                organizations.map((organization) => <div className="activity-entry" key={organization.id}>
                  <div><strong>{organization.trading_name || organization.legal_name}</strong><span className="cell-sub">{organization.country_code} · {organization.organization_type} · {organization.registration_number || "no registration number"}</span></div>
                  <span className={`status status-${organization.verification_status}`}>{organization.verification_status.replace("_", " ")}</span>
                </div>)}
            </article>
            <article className="panel">
              <div className="section-heading compact"><div><p className="eyebrow">MANUAL REVIEW QUEUE</p><h3>Pending decisions</h3></div><span className="refresh-note">No provider calls</span></div>
              {complianceReviews.length === 0 ? <div className="empty-state">No pending compliance reviews.</div> :
                complianceReviews.map((review) => <div className="dispute-card" key={review.id}>
                  <strong>{review.reason}</strong><span className="cell-sub">Opened by {review.opened_by} · {new Date(review.created_at).toLocaleString()}</span>
                  <div className="pagination-actions">
                    {(["approved", "needs_information", "rejected", "suspended"] as const).map((status) => <button className="row-button" key={status} disabled={complianceAction === review.id} onClick={() => void handleComplianceDecision(review, status)}>{status.replace("_", " ")}</button>)}
                  </div>
                </div>)}
            </article>
          </div>
        </section>}

        {(operator?.role === "arbiter" || operator?.role === "operator") && showPage("disputes") && <section id="disputes" className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{operator.role === "arbiter" ? "ARBITER WORKSPACE" : "OPERATOR APPROVAL QUEUE"}</p>
              <h2>{operator.role === "arbiter" ? "Open disputes" : "Pending recommendations"}</h2>
            </div>
            <span className="refresh-note">{disputes.length} awaiting review</span>
          </div>
          {reviewError && <div className="alert" role="alert">{reviewError}</div>}
          {disputesError && <div className="alert" role="alert">{disputesError}</div>}
          {disputesLoading && <p className="drawer-note">Loading disputes…</p>}
          {!disputesLoading && disputes.length === 0 && <div className="empty-state panel">No open disputes are awaiting review.</div>}
          {!disputesLoading && disputes.length > 0 && <div className="dispute-list">
            {disputes.map((dispute) => (
              <article className="panel dispute-card" key={dispute.id}>
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">ESCROW #{dispute.escrow_id}</p>
                    <h2>{dispute.reason || "Dispute raised on-chain"}</h2>
                  </div>
                  <span className="status status-disputed">{dispute.status}</span>
                </div>
                <div className="dispute-meta">
                  <span>Raised {new Date(dispute.created_at).toLocaleString()}</span>
                  <span className="mono">{shorten(dispute.raised_transaction_hash)}</span>
                </div>
                <a className="row-button export-link" href={getDisputeExportUrl(dispute.id)} download>
                  Export audit CSV
                </a>
                {(disputeTimelines[dispute.id] ?? []).length > 0 && <div className="dispute-timeline">
                  <p className="eyebrow">AUDIT TIMELINE</p>
                  <ol>
                    {(disputeTimelines[dispute.id] ?? []).map((entry) => (
                      <li key={entry.id}>
                        <span className="timeline-marker" aria-hidden="true" />
                        <div>
                          <strong>{entry.summary}</strong>
                          {entry.actor && <span className="cell-sub">{entry.actor}</span>}
                          {entry.details && <span className="cell-sub">{entry.kind === "CHAIN_EVENT" ? shorten(entry.details) : entry.details}</span>}
                          <small>{new Date(entry.created_at).toLocaleString()}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>}
                <label className="review-field">
                  <span className="eyebrow">REVIEW NOTE</span>
                  <textarea
                    value={reviewNotes[dispute.id] ?? ""}
                    onChange={(event) => setReviewNotes((current) => ({ ...current, [dispute.id]: event.target.value }))}
                    placeholder="Record evidence reviewed or follow-up required"
                    rows={3}
                  />
                </label>
                <button className="outline-button" onClick={() => void handleReview(dispute)} disabled={reviewingDispute === dispute.id}>
                  {reviewingDispute === dispute.id ? "Saving review…" : "Save review note"}
                </button>
                {(disputeReviews[dispute.id] ?? []).length > 0 && <div className="review-history">
                  <p className="eyebrow">REVIEW HISTORY</p>
                  {(disputeReviews[dispute.id] ?? []).map((review) => (
                    <div className="review-entry" key={review.id}>
                      <strong>{review.reviewer_email}</strong>
                      <span>{review.note}</span>
                      <small>{new Date(review.created_at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>}
                <p className="drawer-note">Review notes are recorded for audit. Escrow release and refund actions remain disabled.</p>
                {(disputeDecisions[dispute.id] ?? []).map((decision) => (
                  <div className="decision-history" key={decision.id}>
                    <div>
                      <strong>{decision.decision} recommendation</strong>
                      <span className="cell-sub">{decision.rationale}</span>
                      <span className="cell-sub">Arbiter: {decision.decided_by}</span>
                    </div>
                    {decision.approvals.length === 0 && operator.role === "operator" ? (
                      <button className="row-button" onClick={() => void handleApprove(decision)} disabled={approvingDecision === decision.id}>
                        {approvingDecision === decision.id ? "Approving…" : "Approve"}
                      </button>
                    ) : (
                      <span className="refresh-note">{decision.approvals.length > 0 ? "Operator approved" : "Awaiting operator approval"}</span>
                    )}
                  </div>
                ))}
                {operator.role === "arbiter" && <div className="decision-box">
                  <p className="eyebrow">NON-MONETARY RECOMMENDATION</p>
                  <div className="decision-controls">
                    <select
                      value={decisionChoice[dispute.id] ?? "RELEASE"}
                      onChange={(event) => setDecisionChoice((current) => ({ ...current, [dispute.id]: event.target.value as DisputeDecision["decision"] }))}
                    >
                      <option value="RELEASE">Recommend release</option>
                      <option value="REFUND">Recommend refund</option>
                    </select>
                    <button className="outline-button" onClick={() => void handleDecision(dispute)} disabled={decidingDispute === dispute.id}>
                      {decidingDispute === dispute.id ? "Recording…" : "Record recommendation"}
                    </button>
                  </div>
                  <textarea
                    value={decisionRationales[dispute.id] ?? ""}
                    onChange={(event) => setDecisionRationales((current) => ({ ...current, [dispute.id]: event.target.value }))}
                    placeholder="Explain the evidence supporting this recommendation"
                    rows={3}
                  />
                  <p className="drawer-note">This records an audit recommendation only. It does not release, refund, or change escrow state.</p>
                </div>}
              </article>
            ))}
          </div>}
        </section>}
      </main>

      {selected && (isOverview || activePage === "escrows") && <div className="drawer-backdrop" onClick={() => setSelectedId(null)}>
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
