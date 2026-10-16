import { l as isApiError, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/query-state-38NEt_Mf.js
var import_jsx_runtime = require_jsx_runtime();
/** Monochrome placeholder used while a request is in flight. */
function Loading({ label = "Loading" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-dashed border-border p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
		children: [label, "…"]
	});
}
function EmptyState({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border border-dashed border-border p-6 text-center text-xs text-muted-foreground",
		children
	});
}
function ErrorState({ error, onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-mono text-[10px] uppercase tracking-[0.2em]",
			children: isApiError(error) ? `Request failed · ${error.code}` : "Request failed"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted-foreground",
			children: describeError(error)
		})] }), onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			size: "sm",
			className: "rounded-none font-mono text-[10px] uppercase",
			onClick: onRetry,
			children: "Retry"
		}) : null]
	});
}
/**
* Renders loading / error / empty / data for a query so every page handles all four states.
* `disabledCodes` turns known "feature not configured on this engine" answers into a calm notice
* instead of an error (e.g. reconciliation_disabled when no chain RPC is configured).
*/
function QueryBoundary({ query, children, empty, isEmpty, disabledCodes = [] }) {
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	if (query.isError) {
		if (isApiError(query.error) && disabledCodes.includes(query.error.code)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, { children: [query.error.message, ". This feature is not enabled on this engine."] });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			error: query.error,
			onRetry: () => void query.refetch()
		});
	}
	if (isEmpty?.(query.data) && empty) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { children: empty });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: children(query.data) });
}
//#endregion
export { QueryBoundary as i, ErrorState as n, Loading as r, EmptyState as t };
