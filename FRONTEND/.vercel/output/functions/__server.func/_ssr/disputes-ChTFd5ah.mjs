import { i as __toESM } from "../_runtime.mjs";
import { f as operator, o as describeError, s as download } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as QueryBoundary, t as EmptyState } from "./query-state-38NEt_Mf.mjs";
import { n as useOperator } from "./session-DisxoMRQ.mjs";
import { c as Metric, d as Shell, i as DialogDescription, l as PageHeader, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { l as truncMid, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as Textarea } from "./textarea-BXgeF5np.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
import { n as scopeReady, r as useChainScope, t as ChainScopeBar } from "./chain-scope-bar-BRFobqc7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/disputes-ChTFd5ah.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var isOpen = (d) => !d.resolved_at && d.status.toLowerCase() !== "resolved";
function Tribunal() {
	const [scope, setScope] = useChainScope();
	const ready = scopeReady(scope);
	const [active, setActive] = (0, import_react.useState)(null);
	const disputes = useQuery({
		queryKey: ["disputes", scope],
		queryFn: () => operator.disputes(scope),
		enabled: ready,
		refetchInterval: 2e4
	});
	const open = (0, import_react.useMemo)(() => (disputes.data ?? []).filter(isOpen).length, [disputes.data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Arbitration",
			title: "Dispute Tribunal",
			description: "Disputes are raised on-chain and freeze the escrow. Arbiters record review notes and a RELEASE / REFUND recommendation; an operator approves it before the outcome is executed by the contract."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainScopeBar, {
			scope,
			onChange: setScope
		}),
		!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { children: "Enter the escrow contract address to load disputes." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Open disputes",
					value: open,
					sub: "Awaiting a resolution"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Resolved",
					value: (disputes.data?.length ?? 0) - open,
					sub: "Closed on-chain"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Total",
					value: disputes.data?.length ?? "—",
					sub: "For this contract"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Arbitration queue",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				tone: "live",
				children: "Live"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: disputes,
				disabledCodes: ["reconciliation_disabled"],
				isEmpty: (d) => d.length === 0,
				empty: "No disputes have been raised for this contract.",
				children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
					caption: "Arbitration queue",
					exportName: "vuka-disputes.csv",
					rows,
					rowKey: (d) => d.id,
					onRowClick: setActive,
					initialSort: {
						key: "raised",
						dir: "desc"
					},
					columns: [
						{
							key: "case",
							header: "Case",
							sort: (d) => d.id,
							text: (d) => d.id,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: truncMid(d.id, 8, 4)
							})
						},
						{
							key: "escrow",
							header: "Escrow",
							sort: (d) => d.escrow_id,
							text: (d) => `#${d.escrow_id}`,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs",
								children: ["#", d.escrow_id]
							})
						},
						{
							key: "claim",
							header: "Claim",
							text: (d) => d.reason,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "line-clamp-2 text-xs",
								children: d.reason
							})
						},
						{
							key: "raised",
							header: "Raised",
							sort: (d) => d.created_at,
							text: (d) => d.created_at,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-mono text-xs text-muted-foreground",
								children: when(d.created_at)
							})
						},
						{
							key: "tx",
							header: "Tx",
							text: (d) => d.raised_transaction_hash,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: truncMid(d.raised_transaction_hash)
							})
						},
						{
							key: "status",
							header: "Status",
							align: "right",
							sort: (d) => d.status,
							cell: (d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: isOpen(d) ? "warn" : "invert",
								children: d.status
							})
						}
					]
				})
			})
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaseDialog, {
			dispute: active,
			onClose: () => setActive(null)
		})
	] });
}
function CaseDialog({ dispute, onClose }) {
	const me = useOperator();
	const qc = useQueryClient();
	const id = dispute?.id;
	const isArbiter = me.role === "arbiter";
	const timeline = useQuery({
		queryKey: ["dispute-timeline", id],
		queryFn: () => operator.disputeTimeline(id),
		enabled: !!id
	});
	const reviews = useQuery({
		queryKey: ["dispute-reviews", id],
		queryFn: () => operator.disputeReviews(id),
		enabled: !!id && isArbiter
	});
	const decisions = useQuery({
		queryKey: ["dispute-decisions", id],
		queryFn: () => operator.disputeDecisions(id),
		enabled: !!id
	});
	const [note, setNote] = (0, import_react.useState)("");
	const [choice, setChoice] = (0, import_react.useState)("RELEASE");
	const [rationale, setRationale] = (0, import_react.useState)("");
	const refresh = () => {
		qc.invalidateQueries({ queryKey: ["dispute-timeline", id] });
		qc.invalidateQueries({ queryKey: ["dispute-reviews", id] });
		qc.invalidateQueries({ queryKey: ["dispute-decisions", id] });
	};
	const addNote = useMutation({
		mutationFn: () => operator.addReview(id, note.trim()),
		onSuccess: () => {
			toast.success("Review note recorded");
			setNote("");
			refresh();
		},
		onError: (e) => toast.error(describeError(e))
	});
	const recommend = useMutation({
		mutationFn: () => operator.recommend(id, choice, rationale.trim()),
		onSuccess: () => {
			toast.success(`${choice} recommendation recorded`, { description: "Awaiting operator approval." });
			setRationale("");
			refresh();
		},
		onError: (e) => toast.error(describeError(e))
	});
	const approve = useMutation({
		mutationFn: (decisionId) => operator.approveDecision(decisionId),
		onSuccess: () => {
			toast.success("Decision approved");
			refresh();
		},
		onError: (e) => toast.error("Approval refused", { description: describeError(e) })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: dispute !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto rounded-none sm:max-w-3xl",
			children: dispute ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: [
						"Case ",
						truncMid(dispute.id, 8, 4),
						" · escrow #",
						dispute.escrow_id
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"Raised ",
					when(dispute.created_at),
					" · ",
					dispute.status
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "border border-border p-3 text-sm",
					children: dispute.reason
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Decisions",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
						query: decisions,
						isEmpty: (d) => d.length === 0,
						empty: "No recommendation yet.",
						children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border border border-border",
							children: rows.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "space-y-1 px-3 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
											tone: "invert",
											children: d.decision
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono text-[11px] text-muted-foreground",
											children: [
												"by ",
												d.decided_by,
												" · ",
												when(d.created_at)
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
											tone: d.approvals.length > 0 ? "invert" : "warn",
											children: [
												d.approvals.length,
												" approval",
												d.approvals.length === 1 ? "" : "s"
											]
										}), me.role === "operator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											className: "h-7 rounded-none font-mono text-[10px] uppercase",
											disabled: approve.isPending || d.approvals.some((a) => a.approver_email === me.email),
											onClick: () => approve.mutate(d.id),
											children: "Approve"
										}) : null]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: d.rationale
								})]
							}, d.id))
						})
					})
				}),
				isArbiter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Review notes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
						query: reviews,
						isEmpty: (d) => d.length === 0,
						empty: "No notes yet.",
						children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border border border-border",
							children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs",
									children: r.note
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-mono text-[10px] text-muted-foreground",
									children: [
										r.reviewer_email,
										" · ",
										when(r.created_at)
									]
								})]
							}, r.id))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: note,
							onChange: (e) => setNote(e.target.value),
							placeholder: "Add a review note…",
							className: "min-h-16 rounded-none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-none font-mono text-[10px] uppercase",
							disabled: !note.trim() || addNote.isPending,
							onClick: () => addNote.mutate(),
							children: "Add note"
						})]
					})]
				}), isOpen(dispute) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Record recommendation",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: choice,
								onValueChange: (v) => setChoice(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Recommendation",
									className: "w-48 rounded-none font-mono text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
									className: "rounded-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "RELEASE",
										children: "Release to supplier"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "REFUND",
										children: "Refund to buyer"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: rationale,
								onChange: (e) => setRationale(e.target.value),
								placeholder: "Written rationale (required, permanently recorded)…",
								className: "min-h-20 rounded-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "rounded-none font-mono text-xs uppercase",
								disabled: rationale.trim().length < 12 || recommend.isPending,
								onClick: () => recommend.mutate(),
								children: "Record recommendation"
							})
						]
					})
				}) : null] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "border border-dashed border-border p-3 text-xs text-muted-foreground",
					children: "Review notes and recommendations are recorded by arbiters. As an operator you can approve a recommendation above and export the audit trail."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Audit timeline",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						className: "h-7 rounded-none font-mono text-[10px] uppercase",
						onClick: () => void download(`/api/disputes/${dispute.id}/export`, `dispute-${dispute.escrow_id}-audit.csv`).catch((e) => toast.error(describeError(e))),
						children: "Export CSV"
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
						query: timeline,
						isEmpty: (d) => d.length === 0,
						empty: "No timeline entries.",
						children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border/60 border border-border",
							children: rows.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs",
										children: t.summary
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-[10px] text-muted-foreground",
										children: when(t.created_at)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-mono text-[10px] text-muted-foreground",
									children: [t.kind, t.actor ? ` · ${t.actor}` : ""]
								})]
							}, t.id))
						})
					})
				})
			] }) : null
		})
	});
}
function Section({ title, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
				children: title
			}), action]
		}), children]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "operator",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tribunal, {})
});
//#endregion
export { SplitComponent as component };
