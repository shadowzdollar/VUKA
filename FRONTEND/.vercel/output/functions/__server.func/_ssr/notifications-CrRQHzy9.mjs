import { i as __toESM } from "../_runtime.mjs";
import { g as support, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { $ as CheckCheck, A as Info, K as CircleCheck, nt as Bell, o as TriangleAlert, q as CircleAlert } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { r as Loading, t as EmptyState } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader } from "./session-DisxoMRQ.mjs";
import { d as Shell, h as useNotifications, l as PageHeader, t as Chip } from "./shell-TFIi8X1Z.mjs";
import { a as relativeTime, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-CrRQHzy9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SEVERITIES = [
	"success",
	"info",
	"warning",
	"error"
];
function severityMeta(s) {
	switch (s) {
		case "success": return {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
				className: "size-4",
				"aria-hidden": "true"
			}),
			label: "Success",
			tone: "invert"
		};
		case "error": return {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "size-4",
				"aria-hidden": "true"
			}),
			label: "Error",
			tone: "warn"
		};
		case "warning": return {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
				className: "size-4",
				"aria-hidden": "true"
			}),
			label: "Warning",
			tone: "warn"
		};
		default: return {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
				className: "size-4",
				"aria-hidden": "true"
			}),
			label: "Info",
			tone: "neutral"
		};
	}
}
function Notifications() {
	const trader = useTrader();
	const qc = useQueryClient();
	const q = useNotifications();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const markRead = useMutation({
		mutationFn: (id) => support.markRead(id, trader.id),
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: ["notifications", trader.id] });
			const prev = qc.getQueryData(["notifications", trader.id]);
			qc.setQueryData(["notifications", trader.id], (list) => (list ?? []).map((n) => n.id === id ? {
				...n,
				read_at: (/* @__PURE__ */ new Date()).toISOString()
			} : n));
			return { prev };
		},
		onError: (err, _id, ctx) => {
			if (ctx?.prev) qc.setQueryData(["notifications", trader.id], ctx.prev);
			toast.error(describeError(err));
		},
		onSettled: () => void qc.invalidateQueries({ queryKey: ["notifications", trader.id] })
	});
	const all = (0, import_react.useMemo)(() => q.data ?? [], [q.data]);
	const unreadIds = (0, import_react.useMemo)(() => all.filter((n) => !n.read_at).map((n) => n.id), [all]);
	const items = (0, import_react.useMemo)(() => {
		if (filter === "all") return all;
		if (filter === "unread") return all.filter((n) => !n.read_at);
		return all.filter((n) => n.severity === filter);
	}, [all, filter]);
	async function markAllRead() {
		const ids = unreadIds;
		for (const id of ids) try {
			await markRead.mutateAsync(id);
		} catch {}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				eyebrow: "Account",
				title: "Notifications",
				description: "Payment, verification and trust-score updates for your account, newest first.",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					disabled: unreadIds.length === 0 || markRead.isPending,
					onClick: () => void markAllRead(),
					className: "rounded-none font-mono text-xs uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
						className: "mr-2 size-3.5",
						"aria-hidden": "true"
					}), "Mark all as read"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "tablist",
				"aria-label": "Filter notifications",
				className: "flex flex-wrap gap-1.5",
				children: [
					["all", `All${all.length ? ` (${all.length})` : ""}`],
					["unread", `Unread${unreadIds.length ? ` (${unreadIds.length})` : ""}`],
					...SEVERITIES.map((s) => [s, severityMeta(s).label])
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": filter === key,
					onClick: () => setFilter(key),
					className: "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors " + (filter === key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-accent"),
					children: label
				}, key))
			}),
			q.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Loading notifications" }) : q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-2 border-foreground p-4 text-sm",
				children: describeError(q.error)
			}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
				className: "mx-auto mb-2 size-5 text-muted-foreground",
				"aria-hidden": "true"
			}), all.length === 0 ? "No notifications yet. Payment, verification and trust-score updates will show up here." : "Nothing matches this filter."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border border border-border",
				children: items.map((n) => {
					const meta = severityMeta(n.severity);
					const unread = !n.read_at;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: unread ? "bg-card" : "bg-background",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 shrink-0 text-foreground",
									"aria-hidden": "true",
									children: meta.icon
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: unread ? "font-semibold" : "font-medium",
													children: n.title
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
													tone: meta.tone,
													children: meta.label
												}),
												unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "size-1.5 rounded-full bg-foreground",
													"aria-hidden": "true"
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sr-only",
													children: unread ? "Unread" : "Read"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted-foreground",
											children: n.body
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
											dateTime: n.created_at,
											title: when(n.created_at),
											className: "mt-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground",
											children: relativeTime(n.created_at)
										})
									]
								}),
								unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									disabled: markRead.isPending,
									onClick: () => markRead.mutate(n.id),
									className: "shrink-0 rounded-none font-mono text-[10px] uppercase",
									children: "Mark read"
								}) : null
							]
						})
					}, n.id);
				})
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notifications, {})
});
//#endregion
export { SplitComponent as component };
