import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as SiteFooter, r as SiteHeader, t as Photo } from "./site-header-BD7q6WjQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/public-page-Co-APz4P.js
var import_jsx_runtime = require_jsx_runtime();
var CONTACT_EMAIL = {
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
}["VITE_CONTACT_EMAIL"] || "";
var SECURITY_EMAIL = {
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
}["VITE_SECURITY_EMAIL"] || "";
/** Reads the contact address from configuration; shows an honest placeholder until one is set. */
function ContactLink({ address, label }) {
	return address ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		className: "underline underline-offset-4",
		href: `mailto:${address}`,
		children: address
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "border border-dashed border-border px-1.5 py-0.5 font-mono text-xs",
		children: [label, " — not yet configured"]
	});
}
/** Shared chrome for long-form public pages: header, an editorial title block, optional draft banner, footer. */
function PublicPage({ kicker, title, lead, draft, toc, photo, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				id: "main",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "border-b border-border bg-muted/30",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 ${photo ? "grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									className: "h-px w-10 bg-foreground"
								}), kicker]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-5 max-w-3xl font-display text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl",
								children: title
							}),
							lead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 max-w-2xl text-lg text-muted-foreground",
								children: lead
							}) : null,
							draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								role: "note",
								className: "mt-8 max-w-2xl border-2 border-foreground p-4 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
									className: "font-mono text-[10px] uppercase tracking-[0.2em]",
									children: ["Draft — pending legal review.", " "]
								}), "This document describes how the platform is designed to behave. It has not yet been reviewed by counsel and is not a binding agreement."]
							}) : null
						] }), photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
							src: photo.src,
							alt: photo.alt,
							width: 1200,
							height: 900,
							credit: photo.credit,
							imgClassName: "aspect-[4/3]"
						}) : null]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[200px_1fr]",
					children: [toc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "On this page",
						className: "hidden lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "sticky top-24 space-y-2 border-l border-border pl-4 text-sm",
							children: toc.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `#${t.id}`,
								className: "text-muted-foreground hover:text-foreground",
								children: t.label
							}) }, t.id))
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 space-y-14",
						children
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
function Section({ id, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id,
		className: "scroll-mt-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-3xl leading-tight",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-4 leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground",
			children
		})]
	});
}
//#endregion
export { Section as a, SECURITY_EMAIL as i, ContactLink as n, PublicPage as r, CONTACT_EMAIL as t };
