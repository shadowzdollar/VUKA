import { i as __toESM } from "../_runtime.mjs";
import { f as operator, o as describeError, s as download } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { d as Shell, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/activity-CBpDV-WG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PAGE = 25;
function Activity() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [action, setAction] = (0, import_react.useState)("");
	const [from, setFrom] = (0, import_react.useState)("");
	const [to, setTo] = (0, import_react.useState)("");
	const [page, setPage] = (0, import_react.useState)(0);
	const q = useQuery({
		queryKey: [
			"activity",
			search,
			action,
			from,
			to,
			page
		],
		queryFn: () => operator.activity({
			limit: PAGE,
			offset: page * PAGE,
			search,
			action,
			from,
			to
		}),
		staleTime: 6e4
	});
	const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / PAGE));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Audit",
		title: "Activity Log",
		description: "Append-only record of every operator action: sign-ins, approvals, exports and alert acknowledgements. Viewing this page is itself recorded.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			className: "rounded-none font-mono text-xs uppercase",
			onClick: () => void download("/api/activity/export", "vuka-operator-activity.csv", {
				search,
				action,
				from,
				to
			}).catch((e) => toast.error(describeError(e))),
			children: "Export CSV"
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Operator activity",
		meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [q.data?.total ?? "—", " records"] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: search,
						onChange: (e) => {
							setSearch(e.target.value);
							setPage(0);
						},
						"aria-label": "Search actor, resource or details",
						placeholder: "Search actor, resource, details…",
						className: "w-72 rounded-none font-mono text-xs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: action,
						onChange: (e) => {
							setAction(e.target.value.toUpperCase());
							setPage(0);
						},
						"aria-label": "Filter by action",
						placeholder: "ACTION",
						className: "w-48 rounded-none font-mono text-xs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						"aria-label": "From date",
						value: from,
						onChange: (e) => {
							setFrom(e.target.value);
							setPage(0);
						},
						className: "w-40 rounded-none font-mono text-xs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						"aria-label": "To date",
						value: to,
						onChange: (e) => {
							setTo(e.target.value);
							setPage(0);
						},
						className: "w-40 rounded-none font-mono text-xs"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: q,
				isEmpty: (d) => d.activities.length === 0,
				empty: "No activity matches these filters.",
				children: ({ activities }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[820px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Time"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Actor"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Role"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Action"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Resource"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Details"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: activities.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs tabular-nums text-muted-foreground",
									children: when(a.created_at)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: a.actor
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: a.role
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: a.action })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs text-muted-foreground",
									children: a.resource ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-xs text-muted-foreground",
									children: a.details ?? "—"
								})
							]
						}, a.id)) })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Page ",
					page + 1,
					" of ",
					pages
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "h-7 rounded-none font-mono text-[10px] uppercase",
						disabled: page === 0,
						onClick: () => setPage((p) => p - 1),
						children: "Prev"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "h-7 rounded-none font-mono text-[10px] uppercase",
						disabled: page + 1 >= pages,
						onClick: () => setPage((p) => p + 1),
						children: "Next"
					})]
				})]
			})
		]
	})] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "operator",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {})
});
//#endregion
export { SplitComponent as component };
