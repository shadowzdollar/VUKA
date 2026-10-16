import { i as __toESM } from "../_runtime.mjs";
import { l as isApiError } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as themeInitScript, t as ThemeProvider } from "./theme-CRMezlZq.mjs";
import { t as I18nProvider } from "./i18n-CuQ20qdj.mjs";
import { S as useRouter, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, v as createFileRoute, y as createRootRouteWithContext } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as SessionProvider } from "./session-DisxoMRQ.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$23 } from "./escrow._id-DK8Xqm9z.mjs";
import { t as Route$24 } from "./send-Bdf77dgo.mjs";
import { t as Route$25 } from "./wallets._id-D3GSxaF0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DMK3rjym.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BULudp-2.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
/**
* Single choke point for errors caught by React error boundaries. Today it logs to the console and
* emits a `vuka:error` DOM event; wire a monitoring client (Sentry, OpenTelemetry, ...) by listening
* for that event, so no vendor is baked into the app. Remember that `connect-src` in the CSP
* (src/lib/security-headers.ts) must allow the monitoring endpoint.
*/
function reportError(error, context = {}) {
	if (typeof window === "undefined") return;
	const detail = {
		message: error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : void 0,
		route: window.location.pathname,
		...context
	};
	console.error("[vuka] unhandled UI error:", detail);
	window.dispatchEvent(new CustomEvent("vuka:error", { detail }));
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var PUBLIC_URL = {
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
}["VITE_PUBLIC_URL"]?.replace(/\/$/, "");
var Route$22 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "VUKA — Cross-border trade settlement" },
			{
				name: "description",
				content: "VUKA: invoice-linked, escrow-backed cross-border payments for African SME traders."
			},
			{
				property: "og:title",
				content: "VUKA — Rise & Cross Over"
			},
			{
				property: "og:description",
				content: "Invoice-linked, escrow-backed cross-border payments for African traders."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			...PUBLIC_URL ? [
				{
					property: "og:image",
					content: `${PUBLIC_URL}/og-image.png`
				},
				{
					property: "og:image:width",
					content: "1200"
				},
				{
					property: "og:image:height",
					content: "630"
				},
				{
					name: "twitter:image",
					content: `${PUBLIC_URL}/og-image.png`
				}
			] : [],
			{
				name: "theme-color",
				content: "#fafafa",
				media: "(prefers-color-scheme: light)"
			},
			{
				name: "theme-color",
				content: "#0a0a0a",
				media: "(prefers-color-scheme: dark)"
			}
		],
		scripts: [{ children: themeInitScript }],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/icon.svg",
				type: "image/svg+xml"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48"
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$22.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(I18nProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SessionProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "bottom-right" })] }) }) })
	});
}
var $$splitComponentImporter$21 = () => import("./routes-BTYU41ft.mjs");
var Route$21 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "VUKA — Overview" }, {
		name: "description",
		content: "Wallets, invoices and cross-border settlements for traders; reconciliation and risk controls for operators."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
/** Signed-out visitors get the public landing page; signed-in users get their workspace. */
var $$splitComponentImporter$20 = () => import("./about-DaqmLkiV.mjs");
var Route$20 = createFileRoute("/about")({
	head: () => ({ meta: [{ title: "About — VUKA" }, {
		name: "description",
		content: "Why VUKA exists, the principles it is built on, and where it is going."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./activity-CBpDV-WG.mjs");
var Route$19 = createFileRoute("/activity")({
	head: () => ({ meta: [{ title: "Activity Log — VUKA" }] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./analytics-h7G9af5b.mjs");
var Route$18 = createFileRoute("/analytics")({
	head: () => ({ meta: [{ title: "Analytics — VUKA" }, {
		name: "description",
		content: "Volume trends, corridor flows, payment-size distribution, reliability and activity patterns."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./compliance-Blt5W777.mjs");
var Route$17 = createFileRoute("/compliance")({
	head: () => ({ meta: [{ title: "Compliance & KYC — VUKA" }, {
		name: "description",
		content: "Organizations, verification evidence, compliance reviews and risk flags with an explainable decision trail."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./corridors-Cl7R3k-0.mjs");
var Route$16 = createFileRoute("/corridors")({
	head: () => ({ meta: [{ title: "Corridors — VUKA" }, {
		name: "description",
		content: "Corridor pricing, limits, provider health and ISO 20022 message rendering."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./disputes-ChTFd5ah.mjs");
var Route$15 = createFileRoute("/disputes")({
	head: () => ({ meta: [{ title: "Dispute Tribunal — VUKA" }, {
		name: "description",
		content: "Arbitration queue for disputed escrows with review notes, arbiter recommendations and operator approval."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./escrow-D8Sm23PP.mjs");
/**
* Layout for /escrow and /escrow/$id: shared Shell chrome, with the role-aware list
* (escrow.index.tsx) or an invoice's detail (escrow.$id.tsx) rendered through the outlet.
*/
var Route$14 = createFileRoute("/escrow")({
	head: () => ({ meta: [{ title: "Invoices & Escrow — VUKA" }, {
		name: "description",
		content: "Invoice-linked payments for traders, and the reconciled on-chain escrow register for operators."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./login-BDCPt3p5.mjs");
var Route$13 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign in — VUKA" }] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./notifications-CrRQHzy9.mjs");
var Route$12 = createFileRoute("/notifications")({
	head: () => ({ meta: [{ title: "Notifications — VUKA" }, {
		name: "description",
		content: "Account and payment notifications for your trader account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./privacy-C5XSXkJq.mjs");
var Route$11 = createFileRoute("/privacy")({
	head: () => ({ meta: [{ title: "Privacy — VUKA" }, {
		name: "description",
		content: "What VUKA stores, where, and why."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./register-BOiFJUEB.mjs");
var Route$10 = createFileRoute("/register")({
	head: () => ({ meta: [{ title: "Create account — VUKA" }] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./security-Ce4WEvaZ.mjs");
var Route$9 = createFileRoute("/security")({
	head: () => ({ meta: [{ title: "Security — VUKA" }, {
		name: "description",
		content: "How VUKA protects traders and funds, what is not yet done, and how to report a vulnerability."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./settlements-Dz0g2b2a.mjs");
var Route$8 = createFileRoute("/settlements")({
	head: () => ({ meta: [{ title: "Settlements & Pilots — VUKA" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./status-Ck7LAWT_.mjs");
var Route$7 = createFileRoute("/status")({
	head: () => ({ meta: [{ title: "System status — VUKA" }, {
		name: "description",
		content: "Live health of the VUKA engine and its dependencies."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./support-C3M2TU7p.mjs");
var Route$6 = createFileRoute("/support")({
	head: () => ({ meta: [{ title: "Support — VUKA" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./terms-DJNyOd8T.mjs");
var Route$5 = createFileRoute("/terms")({
	head: () => ({ meta: [{ title: "Terms of use — VUKA" }, {
		name: "description",
		content: "Draft terms of use for the VUKA platform."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./trust-score-DEiL4391.mjs");
var Route$4 = createFileRoute("/trust-score")({
	head: () => ({ meta: [{ title: "Trust & Credit Score — VUKA" }, {
		name: "description",
		content: "A transparent score computed from your real settlement history in the ledger."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
/** score = 300 + 550 × Σ(weight × value × confidence) / 10 000, so each lever has an exact point value. */
var $$splitComponentImporter$3 = () => import("./verification-DJF1Z7J6.mjs");
var Route$3 = createFileRoute("/verification")({
	head: () => ({ meta: [{ title: "Verification & Limits — VUKA" }, {
		name: "description",
		content: "Your verification level, transaction limits and evidence submissions."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./wallets-ZK2Rbwu7.mjs");
/**
* Layout for /wallets and /wallets/$id: shared trader Shell chrome, with the list
* (wallets.index.tsx) or a single account's detail (wallets.$id.tsx) rendered through the outlet.
*/
var Route$2 = createFileRoute("/wallets")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./escrow.index-CPwvrzWJ.mjs");
var Route$1 = createFileRoute("/escrow/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
/** Traders manage invoices; operators observe the on-chain escrow read model. */
var $$splitComponentImporter = () => import("./wallets.index-CPGdvdPu.mjs");
var Route = createFileRoute("/wallets/")({
	head: () => ({ meta: [{ title: "Wallets & Ledger — VUKA" }, {
		name: "description",
		content: "Separate personal and business wallets with balances derived from an immutable double-entry ledger."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$21.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$22
});
var AboutRoute = Route$20.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$22
});
var ActivityRoute = Route$19.update({
	id: "/activity",
	path: "/activity",
	getParentRoute: () => Route$22
});
var AnalyticsRoute = Route$18.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => Route$22
});
var ComplianceRoute = Route$17.update({
	id: "/compliance",
	path: "/compliance",
	getParentRoute: () => Route$22
});
var CorridorsRoute = Route$16.update({
	id: "/corridors",
	path: "/corridors",
	getParentRoute: () => Route$22
});
var DisputesRoute = Route$15.update({
	id: "/disputes",
	path: "/disputes",
	getParentRoute: () => Route$22
});
var EscrowRoute = Route$14.update({
	id: "/escrow",
	path: "/escrow",
	getParentRoute: () => Route$22
});
var LoginRoute = Route$13.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$22
});
var NotificationsRoute = Route$12.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$22
});
var PrivacyRoute = Route$11.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$22
});
var RegisterRoute = Route$10.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$22
});
var SecurityRoute = Route$9.update({
	id: "/security",
	path: "/security",
	getParentRoute: () => Route$22
});
var SendRoute = Route$24.update({
	id: "/send",
	path: "/send",
	getParentRoute: () => Route$22
});
var SettlementsRoute = Route$8.update({
	id: "/settlements",
	path: "/settlements",
	getParentRoute: () => Route$22
});
var StatusRoute = Route$7.update({
	id: "/status",
	path: "/status",
	getParentRoute: () => Route$22
});
var SupportRoute = Route$6.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => Route$22
});
var TermsRoute = Route$5.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$22
});
var TrustScoreRoute = Route$4.update({
	id: "/trust-score",
	path: "/trust-score",
	getParentRoute: () => Route$22
});
var VerificationRoute = Route$3.update({
	id: "/verification",
	path: "/verification",
	getParentRoute: () => Route$22
});
var WalletsRoute = Route$2.update({
	id: "/wallets",
	path: "/wallets",
	getParentRoute: () => Route$22
});
var EscrowIndexRoute = Route$1.update({
	id: "/",
	path: "/",
	getParentRoute: () => EscrowRoute
});
var EscrowIdRoute = Route$23.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => EscrowRoute
});
var WalletsIndexRoute = Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => WalletsRoute
});
var WalletsIdRoute = Route$25.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => WalletsRoute
});
var EscrowRouteChildren = {
	EscrowIdRoute,
	EscrowIndexRoute
};
var EscrowRouteWithChildren = EscrowRoute._addFileChildren(EscrowRouteChildren);
var WalletsRouteChildren = {
	WalletsIdRoute,
	WalletsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AboutRoute,
	ActivityRoute,
	AnalyticsRoute,
	ComplianceRoute,
	CorridorsRoute,
	DisputesRoute,
	EscrowRoute: EscrowRouteWithChildren,
	LoginRoute,
	NotificationsRoute,
	PrivacyRoute,
	RegisterRoute,
	SecurityRoute,
	SendRoute,
	SettlementsRoute,
	StatusRoute,
	SupportRoute,
	TermsRoute,
	TrustScoreRoute,
	VerificationRoute,
	WalletsRoute: WalletsRoute._addFileChildren(WalletsRouteChildren)
};
var routeTree = Route$22._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 15e3,
		refetchOnWindowFocus: false,
		retry: (count, error) => count < 2 && !(isApiError(error) && error.status >= 400 && error.status < 500)
	} } });
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 3e4
	});
};
//#endregion
export { getRouter };
