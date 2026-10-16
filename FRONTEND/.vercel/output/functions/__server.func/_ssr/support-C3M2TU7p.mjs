import { i as __toESM } from "../_runtime.mjs";
import { d as newIdempotencyKey, g as support, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { c as Metric, d as Shell, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { o as shortId, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as Textarea } from "./textarea-BXgeF5np.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support-C3M2TU7p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRIORITIES = [
	"low",
	"normal",
	"high"
];
var NEXT = {
	open: "pending",
	pending: "closed",
	closed: "open"
};
var NEXT_LABEL = {
	open: "Mark pending",
	pending: "Close",
	closed: "Reopen"
};
function Support() {
	const qc = useQueryClient();
	const tickets = useQuery({
		queryKey: ["tickets"],
		queryFn: () => support.tickets()
	});
	const [subject, setSubject] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [priority, setPriority] = (0, import_react.useState)("normal");
	const keyRef = (0, import_react.useRef)(newIdempotencyKey());
	const create = useMutation({
		mutationFn: () => support.createTicket({
			subject: subject.trim(),
			description: description.trim(),
			priority
		}, keyRef.current),
		onSuccess: ({ ticket }) => {
			toast.success("Ticket opened", { description: `Reference ${shortId(ticket.id, 12)}` });
			setSubject("");
			setDescription("");
			keyRef.current = newIdempotencyKey();
			qc.invalidateQueries({ queryKey: ["tickets"] });
		},
		onError: (e) => toast.error("Ticket not created", { description: describeError(e) })
	});
	const setStatus = useMutation({
		mutationFn: ({ id, status }) => support.setStatus(id, status),
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["tickets"] }),
		onError: (e) => toast.error("Could not update ticket", { description: describeError(e) })
	});
	const open = (tickets.data ?? []).filter((t) => t.status !== "closed").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Help",
			title: "Support",
			description: "Raise an issue with a payment, invoice or verification. Include the payment reference from Send Payment so the team can trace it."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
				label: "Open tickets",
				value: open,
				sub: "Not yet closed"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
				label: "Total tickets",
				value: tickets.data?.length ?? "—",
				sub: "All time"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[400px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "New ticket",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "ticket-subject",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Subject"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "ticket-subject",
								value: subject,
								maxLength: 200,
								onChange: (e) => setSubject(e.target.value),
								className: "rounded-none",
								placeholder: "Payout to Nairobi supplier still pending"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Priority"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: priority,
								onValueChange: (v) => setPriority(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Priority",
									className: "rounded-none font-mono text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: PRIORITIES.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: p,
										children: p
									}, p))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "ticket-details",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Details"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "ticket-details",
								value: description,
								maxLength: 1e4,
								onChange: (e) => setDescription(e.target.value),
								className: "min-h-32 rounded-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full rounded-none font-mono text-xs uppercase",
							disabled: !subject.trim() || !description.trim() || create.isPending,
							onClick: () => create.mutate(),
							children: create.isPending ? "Sending…" : "Open ticket"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Your tickets",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: tickets,
					isEmpty: (d) => d.length === 0,
					empty: "No tickets yet.",
					disabledCodes: ["support_unavailable"],
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border/60",
						children: rows.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm",
											children: t.subject
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground",
											children: t.description
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 font-mono text-[10px] text-muted-foreground",
											children: [
												shortId(t.id, 12),
												" · ",
												t.priority,
												" · opened ",
												when(t.created_at)
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: t.status === "closed" ? "invert" : t.status === "pending" ? "live" : "warn",
										children: t.status
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										className: "h-7 rounded-none font-mono text-[10px] uppercase",
										disabled: setStatus.isPending,
										onClick: () => setStatus.mutate({
											id: t.id,
											status: NEXT[t.status]
										}),
										children: NEXT_LABEL[t.status]
									})]
								})]
							})
						}, t.id))
					})
				})
			})]
		})
	] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Support, {})
});
//#endregion
export { SplitComponent as component };
