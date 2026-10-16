//#region node_modules/.nitro/vite/services/ssr/assets/endpoints-Dhw-Uhtx.js
/**
* Thin fetch wrapper for the VUKA Go engine (ENGINE/go-bridge-core).
*
* Contract (see ENGINE/go-bridge-core/API.md):
*  - JSON in/out; errors are always `{ "error": { "code", "message" } }`.
*  - Sessions are HttpOnly cookies (`vuka_trader_session`, `vuka_operator_session`), so every
*    request is sent with `credentials: "include"`.
*  - Money-moving writes require an `Idempotency-Key` header.
*  - `X-Request-ID` is echoed back and should be quoted when reporting a problem.
*/
var BASE = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_API_BASE_URL"]?.replace(/\/$/, "") ?? "";
var ApiError = class extends Error {
	status;
	code;
	requestId;
	body;
	constructor(status, code, message, requestId, body) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.requestId = requestId;
		this.body = body;
	}
};
function isApiError(e) {
	return e instanceof ApiError;
}
function newIdempotencyKey() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
function buildUrl(path, query) {
	const url = `${BASE}${path}`;
	if (!query) return url;
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(query)) if (v !== void 0 && v !== null && v !== "") params.set(k, String(v));
	const qs = params.toString();
	return qs ? `${url}?${qs}` : url;
}
async function parse(res) {
	if (res.status === 204) return void 0;
	const text = await res.text();
	if (!text) return void 0;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
async function request(method, path, opts = {}) {
	const headers = { Accept: "application/json" };
	if (opts.body !== void 0) headers["Content-Type"] = "application/json";
	if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
	let res;
	try {
		const init = {
			method,
			headers,
			credentials: "include"
		};
		if (opts.body !== void 0) init.body = JSON.stringify(opts.body);
		if (opts.signal) init.signal = opts.signal;
		res = await fetch(buildUrl(path, opts.query), init);
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") throw e;
		throw new ApiError(0, "network_error", "Cannot reach the VUKA engine. Check that it is running.");
	}
	const requestId = res.headers.get("X-Request-ID") ?? void 0;
	const data = await parse(res);
	if (res.ok) return data;
	const env = data?.error;
	if (env && typeof env === "object") throw new ApiError(res.status, env.code ?? "error", env.message ?? res.statusText, requestId, data);
	throw new ApiError(res.status, typeof env === "string" ? "error" : "http_error", typeof env === "string" ? env : `${res.status} ${res.statusText}`, requestId, data);
}
var api = {
	get: (path, query, signal) => {
		const opts = {};
		if (query) opts.query = query;
		if (signal) opts.signal = signal;
		return request("GET", path, opts);
	},
	post: (path, body, opts = {}) => request("POST", path, body === void 0 ? opts : {
		...opts,
		body
	}),
	patch: (path, body, opts = {}) => request("PATCH", path, body === void 0 ? opts : {
		...opts,
		body
	})
};
/** Download an authenticated CSV/text endpoint (activity export, dispute audit, ...). */
async function download(path, filename, query) {
	const res = await fetch(buildUrl(path, query), { credentials: "include" });
	if (!res.ok) {
		const env = (await parse(res))?.error;
		throw new ApiError(res.status, env?.code ?? "http_error", env?.message ?? res.statusText);
	}
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
/** Human-readable message that always carries the request id when the engine supplied one. */
function describeError(e) {
	if (isApiError(e)) return e.requestId ? `${e.message} (ref ${e.requestId})` : e.message;
	return e instanceof Error ? e.message : "Unexpected error";
}
var auth = {
	traderLogin: (phone, password) => api.post("/api/trader/auth/login", {
		phone,
		password
	}),
	traderLogout: () => api.post("/api/trader/auth/logout"),
	traderMe: () => api.get("/api/trader/me"),
	operatorLogin: (email, password) => api.post("/api/auth/login", {
		email,
		password
	}),
	operatorLogout: () => api.post("/api/auth/logout"),
	operatorMe: () => api.get("/api/auth/me"),
	/** Public: creates the trader, their PERSONAL + BUSINESS accounts and a login password. */
	register: (input, currency) => api.post("/api/users", input, { query: { currency } })
};
var ledger = {
	accounts: (userId) => api.get(`/api/users/${userId}/accounts`).then((r) => r.accounts ?? []),
	balance: (accountId) => api.get(`/api/accounts/${accountId}/balance`),
	account: (accountId) => api.get(`/api/accounts/${accountId}`),
	/** JSON view of the same data the camt.053 download (`GET .../statement`, no `format` param)
	* carries — used for on-page rendering; the XML is for a trader to hand to their bank/auditor. */
	statement: (accountId, range) => api.get(`/api/accounts/${accountId}/statement`, {
		...range,
		format: "json"
	}),
	transfers: (userId, filter) => api.get(`/api/users/${userId}/transfers`, filter).then((r) => r.transfers ?? []),
	transfer: (id) => api.get(`/api/transfers/${id}`),
	entries: (transferId) => api.get(`/api/transfers/${transferId}/entries`).then((r) => r.entries ?? []),
	fund: (accountId, input, key = newIdempotencyKey()) => api.post(`/api/accounts/${accountId}/fund`, input, { idempotencyKey: key }),
	createTransfer: (input, key = newIdempotencyKey()) => api.post("/api/transfers", input, { idempotencyKey: key }),
	/**
	* Book transfer across currencies through the FX settlement accounts. Unlike the provider
	* workflow this can carry an invoice number; the engine applies its own FX default when
	* `fx_rate` is omitted.
	*/
	crossBorder: (input, key = newIdempotencyKey()) => api.post("/api/transfers/cross-border", input, { idempotencyKey: key }),
	reverse: (transferId, reason) => api.post(`/api/transfers/${transferId}/reverse`, { reason }),
	recipient: (phone) => api.get("/api/trader/recipients", { phone })
};
var invoices = {
	list: (userId, direction) => api.get(`/api/users/${userId}/invoices`, { direction }).then((r) => r.invoices ?? []),
	get: (id) => api.get(`/api/invoices/${id}`),
	create: (userId, input) => api.post(`/api/users/${userId}/invoices`, input)
};
var corridors = {
	list: () => api.get("/api/corridors").then((r) => r.corridors ?? []),
	quote: (corridorId, amountMinor) => api.get("/api/quotes", {
		corridor_id: corridorId,
		amount_minor: amountMinor
	}),
	fx: () => api.get("/api/fx"),
	providers: () => api.get("/api/providers/status").then((r) => r.providers ?? []),
	webhookEvents: () => api.get("/api/providers/webhooks/events").then((r) => r.events ?? []),
	reconciliation: () => api.get("/api/providers/reconciliation").then((r) => r.reconciliation ?? [])
};
var workflows = {
	/**
	* Starts a quote-bound collect → ledger → payout workflow. The engine answers 202 while the
	* workflow is in flight or needs review, and may embed `error` next to `workflow`.
	*/
	start: (input, key) => api.post("/api/transaction-workflows", input, { idempotencyKey: key }),
	get: (id) => api.get(`/api/transaction-workflows/${id}`),
	events: (id) => api.get(`/api/transaction-workflows/${id}/events`).then((r) => r.events ?? []),
	retry: (id, phone) => api.post(`/api/transaction-workflows/${id}/retry`, { phone })
};
var support = {
	tickets: (status) => api.get("/api/support/tickets", { status }).then((r) => r.tickets ?? []),
	createTicket: (input, key = newIdempotencyKey()) => api.post("/api/support/tickets", input, { idempotencyKey: key }),
	setStatus: (id, status) => api.patch(`/api/support/tickets/${id}`, { status }),
	notifications: () => api.get("/api/notifications").then((r) => r.notifications ?? []),
	markRead: (id, traderId) => api.post(`/api/notifications/${id}/read`, void 0, { query: { trader_id: traderId } })
};
var operator = {
	analytics: (days) => api.get("/api/operator/analytics", { days }),
	activity: (q) => api.get("/api/activity", q),
	reconciliationStatus: (scope) => api.get("/api/reconciliation/status", scope),
	/** `level` and `message` must match the engine's current alert text exactly or it answers 409 stale_alert. */
	ackAlert: (scope, level, message) => api.post("/api/reconciliation/alerts/ack", {
		...scope,
		level,
		message
	}),
	escrows: (scope) => api.get("/api/escrows", scope).then((r) => r.escrows ?? []),
	escrowEvents: (id, scope) => api.get(`/api/escrows/${id}/events`, scope).then((r) => r.events ?? []),
	disputes: (scope, status) => api.get("/api/disputes", {
		...scope,
		status
	}).then((r) => r.disputes ?? []),
	disputeTimeline: (id) => api.get(`/api/disputes/${id}/timeline`).then((r) => r.timeline ?? []),
	disputeReviews: (id) => api.get(`/api/disputes/${id}/reviews`).then((r) => r.reviews ?? []),
	addReview: (id, note) => api.post(`/api/disputes/${id}/reviews`, { note }),
	disputeDecisions: (id) => api.get(`/api/disputes/${id}/decisions`).then((r) => r.decisions ?? []),
	recommend: (id, decision, rationale) => api.post(`/api/disputes/${id}/decision`, {
		decision,
		rationale
	}),
	approveDecision: (decisionId) => api.post(`/api/dispute-decisions/${decisionId}/approve`)
};
var compliance = {
	organizations: () => api.get("/api/organizations").then((r) => r.organizations ?? []),
	createOrganization: (input) => api.post("/api/organizations", input),
	verifications: () => api.get("/api/verifications").then((r) => r.verifications ?? []),
	createVerification: (input) => api.post("/api/verifications", input),
	decideVerification: (id, status, rationale) => api.post(`/api/verifications/${id}/decision`, {
		status,
		rationale
	}),
	reviews: () => api.get("/api/compliance/reviews").then((r) => r.reviews ?? []),
	createReview: (organization_id, reason) => api.post("/api/compliance/reviews", {
		organization_id,
		reason
	}),
	decideReview: (id, status, rationale) => api.post(`/api/compliance/reviews/${id}/decision`, {
		status,
		rationale
	}),
	riskFlags: (orgId) => api.get(`/api/organizations/${orgId}/risk-flags`).then((r) => r.risk_flags ?? []),
	addRiskFlag: (orgId, input) => api.post(`/api/organizations/${orgId}/risk-flags`, input),
	resolveRiskFlag: (orgId, flagId, resolution) => api.post(`/api/organizations/${orgId}/risk-flags/${flagId}/resolve`, { resolution })
};
var settlements = {
	list: (status) => api.get("/api/settlements", { status }).then((r) => ({
		commands: r.commands ?? [],
		policy: r.policy
	})),
	submit: (input, key = newIdempotencyKey()) => api.post("/api/settlements", {
		...input,
		idempotency_key: key
	}, { idempotencyKey: key }),
	approvals: (id) => api.get(`/api/settlements/${id}/approvals`).then((r) => r.approvals ?? []),
	preflight: (id, identityApproved) => api.post(`/api/settlements/${id}/preflight`, { identity_approved: identityApproved }),
	approve: (id, decision, reason) => api.post(`/api/settlements/${id}/approve`, {
		decision,
		reason
	}),
	execute: (id) => api.post(`/api/settlements/${id}/execute`),
	cancel: (id) => api.post(`/api/settlements/${id}/cancel`)
};
var pilots = {
	list: () => api.get("/api/pilots").then((r) => ({
		pilots: r.pilots ?? [],
		killSwitch: r.settlement_kill_switch_active,
		observationOnly: r.observation_only
	})),
	action: (id, action) => api.post(`/api/pilots/${id}/${action}`)
};
var platform = {
	/** Unauthenticated: countries, currencies, corridor count, limits, chain, feature flags. */
	config: () => api.get("/api/config/public"),
	standing: () => api.get("/api/trader/limits"),
	kyc: () => api.get("/api/trader/kyc").then((r) => ({
		verifications: r.verifications ?? [],
		standing: r.standing
	})),
	submitKyc: (input) => api.post("/api/trader/kyc", input),
	trust: () => api.get("/api/trader/trust-score"),
	analytics: (days) => api.get("/api/trader/analytics", { days })
};
//#endregion
export { workflows as _, corridors as a, invoices as c, newIdempotencyKey as d, operator as f, support as g, settlements as h, compliance as i, isApiError as l, platform as m, api as n, describeError as o, pilots as p, auth as r, download as s, ApiError as t, ledger as u };
