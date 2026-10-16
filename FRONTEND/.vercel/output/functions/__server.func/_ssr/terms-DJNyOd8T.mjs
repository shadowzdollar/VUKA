import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Section, r as PublicPage } from "./public-page-Co-APz4P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms-DJNyOd8T.js
var import_jsx_runtime = require_jsx_runtime();
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PublicPage, {
		kicker: "Terms of use",
		title: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"The ground rules, ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "in plain words" }),
			"."
		] }),
		lead: "Draft terms describing how the sandbox platform is intended to be used.",
		draft: true,
		toc: [
			{
				id: "sandbox",
				label: "Sandbox status"
			},
			{
				id: "accounts",
				label: "Accounts"
			},
			{
				id: "payments",
				label: "Payments and escrow"
			},
			{
				id: "acceptable",
				label: "Acceptable use"
			},
			{
				id: "liability",
				label: "Liability"
			}
		],
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "sandbox",
				title: "1. Sandbox status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"The platform is currently a ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "sandbox" }),
					". Balances are simulated, payout rails do not move real money, and nothing here is a financial service until the operator states in writing that a specific corridor is live and licensed."
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "accounts",
				title: "2. Accounts",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You must provide accurate information and keep your password secret." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You are responsible for activity under your account." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Limits depend on your verification tier and may change as you verify." })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "payments",
				title: "3. Payments and escrow",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A firm quote is valid for its stated period; after that a new quote is required." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Escrow follows the contract's published rules: confirmation releases to the supplier, silence refunds the buyer, disputes go to an arbiter, and an unanswered dispute falls back to an even split." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Payments that fail screening or exceed limits are refused; no payment is completed without a balanced ledger entry." })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "acceptable",
				title: "4. Acceptable use",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You must not use the platform for unlawful activity, sanctions evasion, fraud, or to interfere with its operation or other users' access." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "liability",
				title: "5. Liability",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "To be settled with counsel before launch, including governing law, dispute forum and limits of liability appropriate to each jurisdiction. Until then, do not rely on the sandbox for real financial decisions." })
			})
		]
	});
}
var SplitComponent = TermsPage;
//#endregion
export { SplitComponent as component };
