import { m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { v as RefreshCw } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as Section, r as PublicPage } from "./public-page-Co-APz4P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-Ck7LAWT_.js
var import_jsx_runtime = require_jsx_runtime();
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
async function probe(path) {
	const t0 = performance.now();
	try {
		const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
		const body = await res.json().catch(() => null);
		return {
			ok: res.ok,
			status: res.status,
			ms: Math.round(performance.now() - t0),
			body
		};
	} catch {
		return {
			ok: false,
			status: 0,
			ms: Math.round(performance.now() - t0),
			body: null
		};
	}
}
function StatusPage() {
	const live = useQuery({
		queryKey: ["probe", "healthz"],
		queryFn: () => probe("/healthz"),
		refetchInterval: 3e4,
		retry: false
	});
	const ready = useQuery({
		queryKey: ["probe", "readyz"],
		queryFn: () => probe("/readyz"),
		refetchInterval: 3e4,
		retry: false
	});
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		refetchInterval: 6e4,
		retry: false
	});
	const checks = (ready.data?.body)?.checks ?? {};
	const all = live.data?.ok && ready.data?.ok;
	const loading = live.isPending || ready.isPending;
	const rows = [
		[
			"Engine (liveness)",
			live.data?.ok,
			live.data ? `HTTP ${live.data.status || "no response"} · ${live.data.ms} ms` : "checking…"
		],
		[
			"Engine (readiness)",
			ready.data?.ok,
			ready.data ? `HTTP ${ready.data.status || "no response"} · ${ready.data.ms} ms` : "checking…"
		],
		...Object.entries(checks).map(([k, v]) => [
			k === "database" ? "Database" : k === "providers" ? "Payout provider catalogue" : k,
			v === "ok",
			v
		])
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PublicPage, {
		kicker: "System status",
		title: loading ? "Checking…" : all ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"All systems ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "operational" }),
			"."
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"Something is ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "not right" }),
			"."
		] }),
		lead: "These checks run from your browser against the live engine and refresh every 30 seconds. They report only what this deployment can see about itself.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			id: "checks",
			title: "Current checks",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-live": "polite",
				className: "divide-y divide-border border border-border bg-card text-foreground",
				children: rows.map(([name, ok, detail]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: `size-3 border-2 border-foreground ${ok ? "bg-foreground" : ok === void 0 ? "border-dashed" : "bg-[repeating-linear-gradient(135deg,var(--color-foreground)_0_2px,transparent_2px_5px)]"}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: ok ? "OK. " : ok === void 0 ? "Checking. " : "Failing. "
						}), detail]
					})]
				}, name))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				className: "rounded-none font-mono text-xs uppercase",
				onClick: () => {
					live.refetch();
					ready.refetch();
					config.refetch();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
					className: "mr-2 size-3.5",
					"aria-hidden": "true"
				}), "Re-check now"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			id: "deployment",
			title: "This deployment",
			children: [config.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "grid gap-x-8 gap-y-2 sm:grid-cols-2",
				children: [
					["Environment", config.data.environment],
					["API version", config.data.api_version],
					["Markets", String(config.data.countries.length)],
					["Corridors", String(config.data.corridor_count)],
					["On-chain escrow", config.data.chain.enabled ? `enabled · chain ${config.data.chain.chain_id}` : "disabled"],
					["Rates", config.data.rate_convention]
				].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4 border-b border-border py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-mono text-xs text-foreground",
						children: v
					})]
				}, k))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: config.isError ? "The engine could not be reached." : "Loading…" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs",
				children: "Historical uptime and incident reporting are not yet published; this page is a live probe, not a service-level commitment."
			})]
		})]
	});
}
var SplitComponent = StatusPage;
//#endregion
export { SplitComponent as component };
