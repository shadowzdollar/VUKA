import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { acknowledgeReconciliationAlert, addDisputeDecision, addDisputeReview, approveDisputeDecision, approvePilot, cancelPilot, completePilot, decideComplianceReview, getActivity, getActivityExportUrl, getAlertHistory, getComplianceReviews, getCorridors, getCurrentOperator, getCurrentTrader, getDisputeDecisions, getDisputeReviews, getDisputeTimeline, getDisputeExportUrl, getDisputes, getEscrowEvents, getEscrows, getHealth, getOrganizations, getPilots, getProviderStatus, getProviderWebhookEvents, getSettlementCommands, getReconciliationStatus, getReconciliationStatusExportUrl, login, logout, pausePilot, registerTrader, resumePilot, traderLogin, contract } from "./api";
import type { ComplianceReview, CorridorConfig, Dispute, DisputeDecision, DisputeReview, DisputeTimelineEntry, Escrow, EscrowEvent, EscrowState, Operator, OperatorActivity, Organization, Pilot, ProviderStatus, ProviderWebhookEvent, ReconciliationStatus, SettlementCommand, Trader } from "./types";
import { TraderApp } from "./TraderApp";

const refreshInterval = 15000;
const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL ?? "";
const controlRoomPages = ["overview", "escrows", "reconciliation", "providers", "settlements", "pilots", "activity", "compliance", "disputes"] as const;
type ControlRoomPage = typeof controlRoomPages[number];
const landingPages = ["home", "platform", "controls", "corridors", "about", "company", "security", "careers", "contact"] as const;
type LandingPage = typeof landingPages[number];

function controlRoomPageFromHash(): ControlRoomPage {
  const page = window.location.hash.replace(/^#/, "");
  return controlRoomPages.includes(page as ControlRoomPage) ? page as ControlRoomPage : "overview";
}

function landingPageFromHash(): LandingPage {
  const page = window.location.hash.replace(/^#landing-/, "");
  return landingPages.includes(page as LandingPage) ? page as LandingPage : "home";
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
  const [showLanding, setShowLanding] = useState(true);
  const [landingPage, setLandingPage] = useState<LandingPage>(landingPageFromHash);
  const [landingActivityIndex, setLandingActivityIndex] = useState(0);
  const [landingMarketIndex, setLandingMarketIndex] = useState(0);
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
        setShowLanding(true);
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
        setShowLanding(false);
        setPassword("");
        return;
      }

      await login(email, password);
      setPassword("");
      setShowLanding(false);
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
      setShowLanding(false);
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

  function continueWithGoogle() {
    if (accessMode !== "trader") {
      setLoginError("Google access is available for trader accounts. Operations access uses the managed operator credentials.");
      return;
    }
    if (!googleAuthUrl) {
      setLoginError("Google sign-in is not configured for this environment. Set VITE_GOOGLE_AUTH_URL to the VUKA OAuth start endpoint.");
      return;
    }
    window.location.assign(`${googleAuthUrl}${googleAuthUrl.includes("?") ? "&" : "?"}intent=${authView}`);
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
      setShowLanding(true);
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

  useEffect(() => {
    const handleLandingHashChange = () => setLandingPage(landingPageFromHash());
    window.addEventListener("hashchange", handleLandingHashChange);
    return () => window.removeEventListener("hashchange", handleLandingHashChange);
  }, []);

  useEffect(() => {
    if (!showLanding || landingPage !== "home") return;
    const timer = window.setInterval(() => setLandingActivityIndex((current) => (current + 1) % 4), 3200);
    return () => window.clearInterval(timer);
  }, [landingPage, showLanding]);

  useEffect(() => {
    if (!showLanding || landingPage !== "home") return;
    const timer = window.setInterval(() => setLandingMarketIndex((current) => (current + 1) % 4), 4200);
    return () => window.clearInterval(timer);
  }, [landingPage, showLanding]);

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
    trader ? <TraderApp trader={trader} onSignOut={() => { setTrader(null); setAuthRequired(true); setShowLanding(true); }} /> :
    showLanding && !operator ? <main className="landing-shell" data-landing-page={landingPage}>
      <header className="landing-nav"><a className="landing-brand" href="#landing-home"><span className="brand-mark">V</span><span><strong>VUKA</strong><small>TRADE TRUST</small></span></a><nav className="landing-links" aria-label="Landing page navigation"><a href="#landing-platform">Platform</a><a href="#landing-controls">Controls</a><a href="#landing-corridors">Corridors</a><a href="#landing-company">Company</a><a href="#landing-security">Security</a></nav><div className="landing-nav-actions"><button className="landing-login-link" onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("login"); setAccessMode("trader"); }}>Sign in <span>→</span></button><button className="landing-nav-cta" onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("signup"); setAccessMode("trader"); setSignupStep(1); }}>Open an account</button></div></header>
      {landingPage !== "home" && <section className={`landing-brand-page landing-brand-${landingPage}`}>
        {landingPage === "platform" && <><p className="eyebrow">VUKA PLATFORM / THE OPERATING LAYER</p><h1>One system for the work before, during, and after money moves.</h1><p className="brand-page-lede">VUKA connects business identity, balances, trade context, quotes, provider authorization, ledger records, and operational response into a single accountable flow.</p><div className="brand-page-stat-row"><span><strong>01</strong>Trader workspace</span><span><strong>02</strong>Operations control</span><span><strong>03</strong>Provider boundary</span><span><strong>04</strong>Evidence record</span></div><div className="brand-page-grid"><article><span>TRADER EXPERIENCE</span><h2>Prepare with context.</h2><p>Accounts, currencies, recipients, invoices, quotes, limits, and transfer history stay together so a trader can understand what is being prepared before authorizing it.</p></article><article><span>OPERATIONS EXPERIENCE</span><h2>Supervise the exceptions.</h2><p>Authorized teams see workflow states, provider callbacks, reconciliation signals, reviews, alerts, and the evidence needed to make an accountable decision.</p></article><article><span>INTEGRATION EXPERIENCE</span><h2>Connect without hiding risk.</h2><p>Provider adapters, credential references, idempotency, retry rules, and terminal-state protection keep external execution behind an explicit boundary.</p></article></div><div className="brand-page-split"><div><p className="eyebrow">HOW IT CONNECTS</p><h2>From commercial intent to explainable outcome.</h2></div><div><p>Every movement carries the commercial reason, corridor rules, quoted value, authorization evidence, execution state, and reconciliation result. That gives the trader a usable product and gives the business a record it can defend.</p><p>VUKA is not another isolated transfer screen. It is the operating context around the transfer.</p></div></div></>}
        {landingPage === "controls" && <><p className="eyebrow">VUKA CONTROLS / DECISION ARCHITECTURE</p><h1>Make every important decision visible before money is released.</h1><p className="brand-page-lede">Confidence is not created by a badge. It is created by separating preparation, authorization, execution, review, and reconciliation into observable stages.</p><div className="brand-page-timeline"><div><strong>01</strong><span>Identity and ownership</span><p>Establish who is acting, which account is theirs, and whether the requested movement is permitted.</p></div><div><strong>02</strong><span>Quote and corridor</span><p>Bind amount, currencies, fees, rate, limits, expiry, and the configured route before commitment.</p></div><div><strong>03</strong><span>Provider authorization</span><p>Keep telecom PINs, USSD, app challenges, and provider credentials with the responsible provider.</p></div><div><strong>04</strong><span>Ledger and outcome</span><p>Persist state transitions, references, callbacks, failures, review decisions, and the final explainable record.</p></div></div><div className="brand-page-grid"><article><span>FAIL CLOSED</span><h2>Unknown is not success.</h2><p>Unverifiable provider evidence, expired quotes, insufficient funds, ownership failures, and ambiguous callbacks stop the workflow or send it to review.</p></article><article><span>REPEATABLE</span><h2>Safe to retry.</h2><p>Idempotency keys and durable workflow states prevent duplicate collection, payout, or ledger posting when systems are retried.</p></article><article><span>ACCOUNTABLE</span><h2>Every action has a record.</h2><p>Operator decisions, reconciliation events, notifications, and provider responses remain connected to the movement they describe.</p></article></div><div className="brand-page-note"><strong>Local demonstrations stay honest</strong><p>Where a real provider is not connected, VUKA labels synthetic execution clearly. A demo reference is never presented as live telecom movement.</p></div></>}
        {landingPage === "corridors" && <><p className="eyebrow">VUKA CORRIDORS / AFRICAN NETWORK</p><h1>Focused routes, designed to expand responsibly.</h1><p className="brand-page-lede">A corridor is more than two countries. It is a governed operating environment with local currency, provider rails, compliance expectations, limits, callbacks, settlement behavior, and people responsible for exceptions.</p><div className="brand-page-route"><div><span>ORIGIN</span><strong>RWANDA</strong><small>RWF / MTN MoMo</small></div><b>→</b><div><span>DESTINATION</span><strong>KENYA</strong><small>KES / M-Pesa</small></div></div><div className="brand-page-corridor-table"><div><span>ROUTE PROGRAM</span><strong>Rwanda ↔ Kenya</strong><b>CONTROLLED</b><small>Initial operating model for quote, authorization, collection, payout, and reconciliation.</small></div><div><span>EXPANSION MODEL</span><strong>East · West · Central · North · Southern Africa</strong><b>PLANNED</b><small>New routes activate only after provider, policy, credential, and operational readiness checks.</small></div><div><span>PARTNER MODEL</span><strong>Telecoms, banks, commerce platforms</strong><b>GATED</b><small>Each connection is isolated behind contracts, adapter boundaries, managed references, and callback evidence.</small></div></div><div className="brand-page-note"><strong>Activation principle</strong><p>A route is not live because a button exists. It becomes live only after credentials, contracts, testing, compliance review, reconciliation controls, and operational approval are ready.</p></div></>}
        {landingPage === "about" && <><p className="eyebrow">ABOUT VUKA / WHY WE EXIST</p><h1>Trust should be part of the system, not a promise after the receipt.</h1><p className="brand-page-lede">African businesses are already trading across borders. The missing layer is not ambition—it is a clearer way to prepare, move, supervise, and explain the money connected to that trade.</p><div className="brand-page-statement"><strong>We do not hide the hard parts.</strong><p>Provider dependencies, compliance states, authorization challenges, failures, reviews, and reconciliation are first-class product surfaces—not footnotes.</p></div><div className="brand-page-grid"><article><span>FOR TRADERS</span><h2>Clarity before commitment.</h2><p>A workspace that makes the amount, route, recipient, quote, authorization step, and current state understandable.</p></article><article><span>FOR OPERATORS</span><h2>Evidence when it matters.</h2><p>A control room for exceptions, provider state, settlement, reconciliation, disputes, and accountable intervention.</p></article><article><span>FOR PROVIDERS</span><h2>A disciplined integration layer.</h2><p>Clear contracts and managed boundaries that respect provider-owned authorization and operational responsibility.</p></article></div><div className="brand-page-split"><div><p className="eyebrow">OUR PRINCIPLES</p><h2>Build for the real operating environment.</h2></div><div><p><strong>Regional by design.</strong> African currencies, providers, regulations, businesses, and relationships shape the product from the start.</p><p><strong>Honest by default.</strong> We distinguish preparation from execution and synthetic records from live provider movement.</p><p><strong>Useful under pressure.</strong> The product must help people understand what happened and what to do next.</p></div></div></>}
        {landingPage === "company" && <><p className="eyebrow">THE COMPANY / VUKA</p><h1>Building the trust layer for African trade.</h1><p className="brand-page-lede">VUKA brings the people, records, and decisions around cross-border money into one understandable operating system for businesses across Africa.</p><div className="brand-page-stat-row"><span><strong>MISSION</strong>Make commerce easier to trust</span><span><strong>REGION</strong>Africa first</span><span><strong>METHOD</strong>Evidence-led infrastructure</span><span><strong>STANDARD</strong>Responsible activation</span></div><div className="brand-page-grid"><article><span>OUR MISSION</span><h2>Move African commerce forward.</h2><p>Give businesses a more dependable way to prepare and coordinate cross-border value as they buy, sell, hire, supply, and grow.</p></article><article><span>OUR STANDARD</span><h2>Never overstate the state.</h2><p>We prefer an honest pending, blocked, or review state with a reason over a polished interface that implies money moved when it did not.</p></article><article><span>OUR FOOTPRINT</span><h2>Grow through local trust.</h2><p>We expand corridor by corridor with providers, operators, and businesses who understand the context on the ground.</p></article></div><div className="brand-page-split"><div><p className="eyebrow">WHAT WE ARE BUILDING</p><h2>A company for the infrastructure between intent and outcome.</h2></div><div><p>That means product, engineering, compliance, partnerships, and operations working from the same record—not separate teams passing screenshots across a process.</p><p>VUKA is being built deliberately: ambitious about the opportunity, precise about what is ready, and accountable for what is not.</p></div></div></>}
        {landingPage === "security" && <><p className="eyebrow">SECURITY & TRUST / PROTECTION BY DESIGN</p><h1>Protection is designed into every handoff.</h1><p className="brand-page-lede">VUKA treats access, authorization, ledger integrity, provider boundaries, and operational review as connected parts of one security posture.</p><div className="brand-page-timeline"><div><strong>01</strong><span>Identity</span><p>Sessions and account ownership establish who is allowed to act and which resources they control.</p></div><div><strong>02</strong><span>Authorization</span><p>Telecom PINs stay with the provider; VUKA records only the verifiable authorization reference.</p></div><div><strong>03</strong><span>Ledger</span><p>Double-entry records, ownership checks, and idempotent workflows keep movement explainable.</p></div><div><strong>04</strong><span>Review</span><p>Exceptions, reconciliation, audit trails, and operator decisions keep people in control.</p></div></div><div className="brand-page-grid"><article><span>DATA BOUNDARIES</span><h2>Collect what the workflow needs.</h2><p>Account, quote, and workflow records are connected for traceability. Sensitive provider secrets and telecom PINs remain outside VUKA's custody.</p></article><article><span>OPERATIONAL RESILIENCE</span><h2>Expect failure honestly.</h2><p>Timeouts, retries, callbacks, duplicate requests, and provider outages are modeled as states to handle—not hidden behind a green screen.</p></article><article><span>GOVERNANCE</span><h2>Keep activation deliberate.</h2><p>Production corridors remain gated by credentials, contracts, testing, compliance review, and reconciliation readiness.</p></article></div><div className="brand-page-note"><strong>Security status</strong><p>VUKA is provider-ready. Production activation remains gated by the controls required for the specific corridor and provider relationship.</p></div></>}
        {landingPage === "careers" && <><p className="eyebrow">CAREERS AT VUKA / BUILD WITH PURPOSE</p><h1>Work on infrastructure people can believe in.</h1><p className="brand-page-lede">We are building a deeply African, globally minded company at the intersection of commerce, financial infrastructure, operations, and trust.</p><div className="brand-page-grid"><article><span>PRODUCT & DESIGN</span><h2>Make complexity legible.</h2><p>Design calm experiences for traders and operators who need to make consequential decisions with confidence.</p></article><article><span>ENGINEERING</span><h2>Build systems that tell the truth.</h2><p>Work on ledgers, APIs, provider boundaries, workflow state, observability, and durable infrastructure.</p></article><article><span>OPERATIONS & PARTNERSHIPS</span><h2>Make activation responsible.</h2><p>Shape corridor programs, provider relationships, compliance practices, and the response to exceptions.</p></article></div><div className="brand-page-split"><div><p className="eyebrow">HOW WE WORK</p><h2>Ambitious about impact. Careful with claims.</h2></div><div><p>We write things down, show our work, and make the state of a system visible. We value regional context, respectful disagreement, strong ownership, and the patience to solve the underlying problem.</p><p>Open roles will be published here as teams and corridor programs are ready. If this mission fits your craft, introduce yourself through our contact page.</p></div></div></>}
        {landingPage === "contact" && <><p className="eyebrow">CONTACT VUKA / START A CONVERSATION</p><h1>Tell us what you need to move.</h1><p className="brand-page-lede">Whether you are a trader, provider, corridor partner, or future teammate, tell us what you are building and where the operating friction lives.</p><div className="brand-page-contact-grid"><a href="mailto:hello@vuka.africa"><span>GENERAL ENQUIRIES</span><strong>hello@vuka.africa</strong><small>Company, product, platform, and media questions.</small></a><a href="mailto:partnerships@vuka.africa"><span>PARTNERSHIPS</span><strong>partnerships@vuka.africa</strong><small>Provider, bank, commerce, and corridor conversations.</small></a><a href="mailto:careers@vuka.africa"><span>CAREERS</span><strong>careers@vuka.africa</strong><small>Introduce your craft and the problems you want to solve.</small></a></div><div className="brand-page-split"><div><p className="eyebrow">WHAT TO INCLUDE</p><h2>Give us enough context to respond well.</h2></div><div><p>Tell us who you are, which countries or provider rails are involved, what movement you are trying to coordinate, and where the current process breaks down.</p><p>For account support, use the signed-in workspace so your request stays connected to the relevant account and transaction record.</p></div></div><div className="brand-page-note"><strong>We are building responsibly</strong><p>We will not represent a corridor, provider integration, or production capability as available until the required operational controls are ready.</p></div></>}
      </section>}
      {landingPage === "home" && <><section className="landing-hero">
        <div className="landing-copy"><p className="eyebrow">VUKA / TRADE OPERATING SYSTEM</p><h1>The infrastructure for trade you can trust.</h1><p className="landing-lede">A controlled workspace for African businesses to prepare cross-border payments, connect them to trade context, and keep every approval and outcome visible.</p><div className="landing-actions"><button className="login-submit landing-primary" onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("signup"); setAccessMode("trader"); setSignupStep(1); }}>Create trader account <span>→</span></button><button className="landing-secondary" onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("login"); setAccessMode("trader"); }}>Sign in to VUKA</button></div><div className="landing-proof"><span><strong>01</strong> Ledger-linked records</span><span><strong>02</strong> Explicit authorization</span><span><strong>03</strong> Provider-ready execution</span></div></div>
        <div className="landing-visual" aria-label="VUKA transaction signal table">
          <div className="signal-header"><span>VUKA / AFRICAN TRADE GRID</span><b>SIMULATION MODE</b></div>
          <div className="signal-summary"><strong>54</strong><span>markets connected through<br />one accountable movement layer</span></div>
          <div className="global-map" aria-hidden="true">
            <svg viewBox="0 0 800 330" role="presentation">
              <path d="m242 45 49-18 53 17 18 43-18 32 12 44-27 62-23 77-40 37-38-45-8-61-25-48 20-52-8-36Z" />
              <path d="m366 71 21-20 31 8 13 25-24 14-29-7Z" />
              <path d="m215 46-32-15-29 14 8 20 31 7Z" />
            </svg>
            <span className="global-node global-node-africa">🇷🇼</span><span className="global-node global-node-west">🇳🇬</span><span className="global-node global-node-north">🇪🇬</span><span className="global-node global-node-south">🇿🇦</span><span className="global-node global-node-central">🇨🇩</span>
            <i className="global-arc global-arc-one" /><i className="global-arc global-arc-two" /><i className="global-arc global-arc-three" />
          </div>
          <div className="signal-table">
            <div className="signal-table-head"><span>ROUTE</span><span>STAGE</span><span>CONFIDENCE</span></div>
            <div className="signal-row signal-row-active"><span>🇷🇼 <b>RWA</b> → 🇰🇪 <b>KEN</b></span><strong>TRADE QUOTE</strong><i>98%</i></div>
            <div className="signal-row"><span>🇳🇬 <b>NGA</b> → 🇬🇭 <b>GHA</b></span><strong>POLICY CHECK</strong><i>84%</i></div>
            <div className="signal-row"><span>🇪🇬 <b>EGY</b> → 🇿🇦 <b>ZAF</b></span><strong>LEDGER POSTED</strong><i>100%</i></div>
            <div className="signal-row"><span>🇨🇩 <b>COD</b> → 🇹🇿 <b>TZA</b></span><strong>RECONCILED</strong><i>100%</i></div>
          </div>
          <div className="signal-rail"><span>TRADE INTENT</span><i /><span>POLICY</span><i /><span>COMMERCE</span><i /><span>SETTLEMENT</span><i /><span>OUTCOME</span></div>
          <div className="signal-orbit signal-orbit-one" /><div className="signal-orbit signal-orbit-two" /><span className="signal-cursor" />
          <div className="signal-caption"><span>AFRICA · POLICY + COMMERCE + EVIDENCE</span><strong>Trade<br />in motion.</strong></div>
        </div>
      </section>
      <section className="landing-markets">
        <div className="landing-markets-heading"><p className="eyebrow">AFRICAN MARKET PULSE</p><span>SELECT A REGION TO INSPECT THE OPERATING SIGNAL</span></div>
        <div className="landing-market-grid">
          {[
            ["🌍", "East Africa", "RWF · KES · UGX", "12", "Trade corridors"],
            ["🌍", "West Africa", "NGN · GHS · XOF", "18", "Commerce routes"],
            ["🌍", "Central Africa", "CDF · XAF · STN", "09", "Policy routes"],
            ["🌍", "North & Southern Africa", "EGP · ZAR · MAD", "15", "Settlement routes"]
          ].map(([flag, region, currencies, count, label], index) => <button type="button" className={`landing-market-card ${landingMarketIndex === index ? "is-selected" : ""}`} onClick={() => setLandingMarketIndex(index)} key={region}><span className="market-card-top"><b>{flag}</b><i>{index === landingMarketIndex ? "INSPECTING" : "AVAILABLE"}</i></span><strong>{region}</strong><small>{currencies}</small><span className="market-card-value"><b>{count}</b><em>{label}</em></span><span className="market-card-line"><i /></span></button>)}
        </div>
        <div className="landing-market-detail"><span><b>SELECTED REGION</b> {["East Africa", "West Africa", "Central Africa", "North & Southern Africa"][landingMarketIndex]}</span><strong>{["Identity → quote → settlement", "Commerce → collection → payout", "Policy → authorization → outcome", "FX → provider rail → reconciliation"][landingMarketIndex]}</strong><small>Synthetic African operating view · controls remain provider and policy gated</small></div>
      </section>
      <section className="landing-live">
        <div className="landing-live-intro"><p className="eyebrow">THE TRADE LEDGER SCANNER</p><h2>Follow the decision, not just the destination.</h2><p>A payment becomes trustworthy when its intent, policy, commerce context, and settlement evidence can be read as one continuous record.</p><span className="landing-live-disclaimer">DEMO ACTIVITY · SYNTHETIC RECORDS · NO LIVE MONEY MOVEMENT</span><div className="ledger-counter"><strong>04</strong><span>evidence layers<br />attached to this view</span></div></div>
        <div className="ledger-scanner">
          <div className="ledger-scanner-top"><span>RECORD THREAD / 000184</span><b><i /> SCANNING</b></div>
          <div className="ledger-thread">
            {[
              ["01", "INTENT", "Business invoice", "Kigali · Rwanda", "08:41:02"],
              ["02", "POLICY", "Corridor permitted", "Rwanda → Kenya", "08:41:18"],
              ["03", "COMMERCE", "Quote and recipient bound", "KES · M-Pesa rail", "08:42:04"],
              ["04", "SETTLEMENT", "Ledger handoff ready", "Evidence attached", "08:42:16"]
            ].map(([number, stage, event, context, time], index) => <div className={`ledger-thread-row ${landingActivityIndex === index ? "is-current" : ""}`} key={stage}><span className="ledger-thread-marker">{number}<i /></span><div><strong>{stage}</strong><b>{event}</b><small>{context}</small></div><time>{time}</time><span className="ledger-thread-action">OPEN <b>↗</b></span></div>)}
          </div>
          <div className="ledger-scanner-foot"><span>CHAIN OF RESPONSIBILITY</span><i /><b>INTENT</b><i /><b>POLICY</b><i /><b>OUTCOME</b></div>
        </div>
      </section>
      <section className="landing-passport">
        <div className="passport-heading"><p className="eyebrow">THE PAYMENT PASSPORT</p><h2>Every movement carries its own evidence.</h2><p>VUKA does not reduce a cross-border payment to a green checkmark. It builds a readable record from the first intention to the final outcome.</p><span className="passport-index">RECORD / 000184 · SYNTHETIC EXAMPLE</span></div>
        <div className="passport-workbench" aria-label="Illustration of a VUKA transaction passport">
          <div className="passport-paper passport-paper-back"><span>VUKA / EVIDENCE</span><strong>RWF → KES</strong><small>Corridor brief</small><i>01 / 04</i></div>
          <div className="passport-paper passport-paper-main"><div className="passport-paper-head"><span>TRANSACTION PASSPORT</span><b>VUKA</b></div><div className="passport-route"><span>KIGALI</span><strong>→</strong><span>NAIROBI</span></div><div className="passport-amount"><small>COMMITTED VALUE</small><strong>184,000 <em>RWF</em></strong><span>Recipient receives 31,500 KES</span></div><div className="passport-lines"><span><b>IDENTITY</b><i>VERIFIED</i></span><span><b>QUOTE</b><i>BOUND</i></span><span><b>AUTHORIZATION</b><i>PROVIDER-OWNED</i></span><span><b>LEDGER</b><i>TRACEABLE</i></span></div><div className="passport-signature"><span>RECORD INTEGRITY</span><strong>99.98%</strong><i /></div></div>
          <div className="passport-stamp">CONTROLLED<br />MOVEMENT</div>
          <div className="passport-pin passport-pin-one"><i />IDENTITY</div>
          <div className="passport-pin passport-pin-two"><i />QUOTE</div>
          <div className="passport-pin passport-pin-three"><i />LEDGER</div>
          <div className="passport-ruler"><span>01</span><i /><span>02</span><i /><span>03</span><i /><span>04</span></div>
        </div>
      </section>
      <section className="landing-devices">
        <div className="landing-device-copy"><p className="eyebrow">ONE SYSTEM, EVERY SCREEN</p><h2>Built for the person sending money and the team protecting it.</h2><p>The trader sees a calm, focused workflow. The operations team sees the evidence behind it. Both views are connected to the same controlled record.</p><div className="device-notes"><span><strong>01</strong><b>Trader mobile</b><small>Prepare, review, authorize.</small></span><span><strong>02</strong><b>Operations console</b><small>Observe, reconcile, respond.</small></span></div></div>
        <div className="device-stage">
          <div className="device-console"><div className="device-console-bar"><span>VUKA / OPERATIONS</span><b>LIVE VIEW</b></div><img src="/vuka-operations-console.png" alt="VUKA operations console showing escrow and reconciliation records" /></div>
          <div className="device-phone" aria-label="VUKA trader mobile preview"><div className="device-phone-speaker" /><div className="device-phone-screen"><div className="phone-status"><span>9:41</span><span>VUKA</span></div><div className="phone-header"><span>Good morning</span><b>•••</b></div><div className="phone-balance"><small>AVAILABLE BALANCE</small><strong>RWF 184,000</strong><span>Business account · Kigali</span></div><div className="phone-route"><span>RWANDA</span><b>→</b><span>KENYA</span></div><div className="phone-quote"><small>TRANSFER QUOTE</small><strong>KES 31,500</strong><span>Rate locked · 14:32 remaining</span><i /></div><button className="phone-button">Review transfer <span>→</span></button><div className="phone-nav"><span>Overview</span><span className="active">Send</span><span>Activity</span></div></div></div>
        </div>
      </section>
      <section id="platform" className="landing-section landing-platform"><div className="landing-section-heading"><p className="eyebrow">ONE CONTROLLED SYSTEM</p><h2>Everything important about a payment, in one place.</h2><p>VUKA connects the trader experience to the operational record behind it—without hiding the steps that make movement safe.</p></div><div className="platform-grid"><article className="platform-feature platform-feature-large"><span className="feature-index">01 / WORKSPACE</span><h3>See the whole position.</h3><p>Balances, invoices, quotes, transfer history, notifications, and support records are organized around the business—not scattered across channels.</p><div className="feature-lines"><span>BUSINESS BALANCE <strong>AVAILABLE</strong></span><span>QUOTE STATUS <strong>BOUND</strong></span><span>TRANSFER STATE <strong>TRACEABLE</strong></span></div></article><article className="platform-feature"><span className="feature-index">02 / LEDGER</span><h3>Records that reconcile.</h3><p>Double-entry accounting, idempotency, ownership checks, and durable workflow events keep the financial record explainable.</p></article><article className="platform-feature"><span className="feature-index">03 / CONTEXT</span><h3>Payments with a reason.</h3><p>Quotes, corridors, recipients, invoices, currencies, and settlement states travel together through the payment lifecycle.</p></article></div></section>
      <section id="controls" className="landing-section landing-controls"><div className="landing-control-art"><div className="control-card control-card-main"><span>TRANSACTION CONTROL</span><strong>Review before release.</strong><i>Details</i><i>Quote</i><i>Provider authorization</i><i>Final confirmation</i></div><div className="control-card control-card-small"><span>STATUS</span><strong>VISIBLE</strong><em>Every transition recorded</em></div></div><div className="landing-section-heading"><p className="eyebrow">DESIGNED FOR CONFIDENCE</p><h2>Security is a sequence, not a checkbox.</h2><p>Every transaction moves through deliberate checkpoints. Telecom PINs remain with the provider. VUKA does not pretend a local screen is a real authorization rail.</p><div className="landing-control-list"><div><strong>01</strong><span>Authenticate the trader</span></div><div><strong>02</strong><span>Validate ownership and limits</span></div><div><strong>03</strong><span>Bind a live quote</span></div><div><strong>04</strong><span>Record provider evidence</span></div></div></div></section>
      <section id="corridors" className="landing-section landing-corridors"><div className="landing-section-heading"><p className="eyebrow">BUILT TO CONNECT</p><h2>Start with focused corridors. Expand with control.</h2><p>VUKA is designed around provider adapters, managed credential references, reconciliation, and operational approval—not hardcoded demos.</p></div><div className="corridor-board"><div className="corridor-row corridor-header"><span>ROUTE</span><span>RAIL MODEL</span><span>EXECUTION</span><span>STATE</span></div><div className="corridor-row"><strong>Rwanda → Kenya</strong><span>MTN MoMo / M-Pesa</span><span>Provider adapter</span><b>READY FOR ACTIVATION</b></div><div className="corridor-row"><strong>Kenya → Rwanda</strong><span>M-Pesa / MTN MoMo</span><span>Provider adapter</span><b>CONTROLLED</b></div><div className="corridor-row"><strong>Future corridors</strong><span>Managed integrations</span><span>Credential-gated</span><b>PLANNED</b></div></div></section>
      <section id="about" className="landing-final"><p className="eyebrow">A BETTER STANDARD FOR MOVEMENT</p><h2>Make every payment easier to understand.</h2><p>VUKA is for businesses that need more than a transfer receipt. It is a trust layer for the work before, during, and after money moves.</p><button className="login-submit landing-final-cta" onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("signup"); setAccessMode("trader"); setSignupStep(1); }}>Build your record with VUKA <span>→</span></button></section></>}
      <footer className="landing-footer"><div className="landing-footer-brand"><span className="brand-mark">V</span><span><strong>VUKA</strong><small>TRADE TRUST</small></span></div><div className="landing-footer-column"><strong>PLATFORM</strong><a href="#landing-platform">Workspace</a><a href="#landing-controls">Transaction controls</a><a href="#landing-corridors">Provider corridors</a></div><div className="landing-footer-column"><strong>COMPANY</strong><a href="#landing-about">About VUKA</a><a href="#landing-company">Our company</a><a href="#landing-careers">Careers</a></div><div className="landing-footer-column"><strong>TRUST</strong><a href="#landing-security">Security & trust</a><a href="#landing-controls">Operational controls</a><a href="#landing-contact">Contact us</a></div><div className="landing-footer-column"><strong>ACCESS</strong><button onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("login"); setAccessMode("trader"); }}>Trader sign in</button><button onClick={() => { setShowLanding(false); setAuthRequired(true); setAuthView("signup"); setAccessMode("trader"); setSignupStep(1); }}>Create account</button></div><div className="landing-footer-bottom"><span>CONTROLLED MOVEMENT FOR AFRICAN BUSINESS</span><span>© 2026 VUKA</span></div></footer>
    </main> :
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
            <b>SESSION GATED</b>
          </div>
          <div className="auth-context">
            <div><span className="auth-context-index">01</span><strong>{authView === "login" ? "Return to your workspace" : "Establish your business identity"}</strong><small>{authView === "login" ? "Resume from a protected session." : "Create the record behind your future movement."}</small></div>
            <span className="auth-context-state">{accessMode === "trader" ? "TRADER" : "OPERATIONS"}</span>
          </div>
          {authView === "signup" && <div className="signup-progress" aria-label={`Registration step ${signupStep} of 3`}><span className={signupStep >= 1 ? "active" : ""}>1. Profile</span><span className={signupStep >= 2 ? "active" : ""}>2. Account</span><span className={signupStep >= 3 ? "active" : ""}>3. Security</span></div>}
          {accessMode === "trader" && <><button type="button" className="google-auth-button" onClick={continueWithGoogle}><span className="google-glyph" aria-hidden="true">G</span><span>{authView === "login" ? "Continue with Google" : "Sign up with Google"}</span><span aria-hidden="true">↗</span></button><div className="auth-divider"><span>OR USE YOUR VUKA ACCOUNT</span></div></>}
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
            <p className="eyebrow">VUKA / AFRICAN TRADE NETWORK</p>
            <h2>Enter the system behind trusted movement.</h2>
            <p>One workspace for business identity, trade context, provider authorization, and the records that explain what happened.</p>
            <div className="visual-proof"><span><b>01</b><strong>IDENTITY</strong><small>Known actor</small></span><span><b>02</b><strong>AUTHORIZATION</strong><small>Provider-owned</small></span><span><b>03</b><strong>OUTCOME</strong><small>Traceable record</small></span></div>
          </div>
          <div className="visual-activity" aria-hidden="true"><div><span>TRANSACTION PASSPORT</span><b>RWF → KES</b><i>READY FOR REVIEW</i></div><div><span>LEDGER EVIDENCE</span><b>CHAIN INTACT</b><i>04 LAYERS ATTACHED</i></div><div><span>PROVIDER RAIL</span><b>CONTROLLED</b><i>AUTHORIZATION GATED</i></div></div>
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
