import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Section, i as SECURITY_EMAIL, n as ContactLink, r as PublicPage } from "./public-page-Co-APz4P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/security-Ce4WEvaZ.js
var import_jsx_runtime = require_jsx_runtime();
var CONTROLS = [
	["Money movement", [
		"Double-entry ledger: an entry that does not balance is rejected",
		"Idempotency keys on every payment so a retry never pays twice",
		"HMAC-signed firm quotes bound to amount, corridor and expiry",
		"Sanctions screening and KYC-tier limits enforced before any funds move; fail-closed if a check errors"
	]],
	["Escrow contract", [
		"Reentrancy guard, pull-payment fallback, fee-on-transfer tokens rejected",
		"Pausing can never block settlement of funds already held",
		"Permissionless 50/50 fallback so an absent arbiter cannot lock funds",
		"Protocol fee capped at 1% in code"
	]],
	["Accounts and sessions", [
		"HttpOnly session cookies; the browser never holds a bearer token",
		"Login throttling per account and address",
		"Idle-timeout sign-out; separate trader and operator sessions",
		"Operators approve sensitive changes under a four-eyes rule"
	]],
	["Web application", [
		"Strict Content-Security-Policy and modern security headers on every response",
		"No secrets in the client bundle; provider credentials are environment-injected and never logged",
		"Provider webhooks are HMAC-verified and fail-closed until a secret is configured; they record evidence and never post to the ledger"
	]]
];
function SecurityPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PublicPage, {
		kicker: "Security",
		title: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"Designed so that ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "no one person" }),
			" can move your money."
		] }),
		lead: "This page lists the controls that exist in the code today, and — just as importantly — what has not yet been done.",
		toc: [
			{
				id: "controls",
				label: "Controls"
			},
			{
				id: "limits",
				label: "Honest limits"
			},
			{
				id: "report",
				label: "Report a vulnerability"
			}
		],
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "controls",
				title: "Controls in place",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: CONTROLS.map(([h, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-xl text-foreground",
							children: h
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-2 text-sm",
							children: items.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: x }, x))
						})]
					}, h))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "limits",
				title: "What is not done yet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "No independent smart-contract audit yet." }), " The contracts are covered by extensive tests, but a third-party audit is a prerequisite for holding real funds."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Payout rails are sandboxes." }), " No real telecom or bank credentials are in use, and no funds are moved."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "FX rates are reference values," }), " not market data, until a licensed rate provider is connected."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "No regulatory licence is claimed." }), " Operating in each country needs authorisation we have not yet sought."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "No penetration test yet." }), " Automated dependency and accessibility checks run, but that is not a substitute."] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				id: "report",
				title: "Report a vulnerability",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"If you believe you have found a security issue, please report it privately to",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactLink, {
						address: SECURITY_EMAIL,
						label: "Security address"
					}),
					" and give us reasonable time to respond before disclosing it. Include steps to reproduce; do not access other people's data or degrade the service."
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Because the platform is pre-launch there is no bug bounty, but we will credit researchers who wish to be named." })]
			})
		]
	});
}
var SplitComponent = SecurityPage;
//#endregion
export { SplitComponent as component };
