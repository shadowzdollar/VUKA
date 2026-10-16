import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Section, n as ContactLink, r as PublicPage, t as CONTACT_EMAIL } from "./public-page-Co-APz4P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-C5XSXkJq.js
var import_jsx_runtime = require_jsx_runtime();
var STORAGE = [
	[
		"vuka.theme",
		"Your light / dark / system choice",
		"Until you clear site data"
	],
	[
		"vuka.lang",
		"Your language choice",
		"Until you clear site data"
	],
	[
		"vuka.workflows.<id>",
		"Ids of your recent payments, so the Send page can resume tracking them",
		"Until you clear site data"
	],
	[
		"vuka.chainScope",
		"Operators only: the escrow contract and chain id being viewed",
		"Until you clear site data"
	],
	[
		"Session cookie",
		"Keeps you signed in. HttpOnly, so scripts cannot read it",
		"Until you sign out or go idle"
	]
];
function PrivacyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PublicPage, {
		kicker: "Privacy",
		title: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"What we keep, ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "where" }),
			", and why."
		] }),
		lead: "A plain-language description of the data the platform handles as designed today.",
		draft: true,
		toc: [
			{
				id: "collect",
				label: "What we collect"
			},
			{
				id: "never",
				label: "What we don't"
			},
			{
				id: "storage",
				label: "Cookies and storage"
			},
			{
				id: "third",
				label: "Third parties"
			},
			{
				id: "rights",
				label: "Your choices"
			}
		],
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "collect",
				title: "What we collect",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Account:" }), " your name, phone number, business name and country, and a salted hash of your password (never the password itself)."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Transactions:" }), " invoices, quotes, payments and their ledger entries, which we must retain to keep an auditable record."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Verification:" }), " the reference you file (a provider job id, registry reference or document hash) and its review status."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Operations:" }), " request ids, timestamps and error codes in server logs; no credential values are logged."] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "never",
				title: "What we don't",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Identity documents are ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "not uploaded" }),
					" to VUKA; only references are stored."
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "No advertising trackers, no third-party analytics scripts, no selling of data." })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				id: "storage",
				title: "Cookies and browser storage",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The site uses one session cookie and a few items in your browser's local storage. All are strictly functional; none tracks you across sites." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto border border-border bg-card text-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[520px] text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
								className: "sr-only",
								children: "Browser storage used by VUKA"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-3 font-normal",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-3 font-normal",
										children: "Purpose"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-3 font-normal",
										children: "Lifetime"
									})
								]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: STORAGE.map(([n, p, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "row",
										className: "p-3 text-left font-mono text-xs font-normal",
										children: n
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: p
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-muted-foreground",
										children: l
									})
								]
							}, n)) })
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "third",
				title: "Third parties",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Google Fonts" }), " serves the Newsreader, Inter and JetBrains Mono typefaces; your browser contacts Google to fetch them and Google sees your IP address. Self-hosting the fonts is planned."] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Payout providers" }), " (mobile-money operators and banks) will receive the details needed to pay out once rails go live. Today all rails are sandboxes and receive nothing."] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				id: "rights",
				title: "Your choices",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"You can clear browser storage at any time, export your activity from the app, and ask for correction or deletion (subject to ledger records we are required to retain) at",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactLink, {
						address: CONTACT_EMAIL,
						label: "Privacy contact"
					}),
					". The controller identity and applicable data-protection registrations will be added before launch."
				] })
			})
		]
	});
}
var SplitComponent = PrivacyPage;
//#endregion
export { SplitComponent as component };
