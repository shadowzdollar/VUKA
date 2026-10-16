import { i as __toESM } from "../_runtime.mjs";
import { a as corridors, h as settlements, o as describeError, p as pilots } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { n as useOperator } from "./session-DisxoMRQ.mjs";
import { a as DialogFooter, c as Metric, d as Shell, i as DialogDescription, l as PageHeader, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, o as shortId, r as fromMinor, s as toMinor, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as Textarea } from "./textarea-BXgeF5np.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settlements-Dz0g2b2a.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ACTIONS = [
	"payout",
	"fund",
	"release",
	"refund",
	"timeout",
	"arbitration"
];
var tone = (s) => [
	"succeeded",
	"approved",
	"active",
	"completed"
].includes(s) ? "invert" : [
	"failed",
	"cancelled",
	"expired",
	"rejected",
	"paused"
].includes(s) ? "warn" : "live";
function Settlements() {
	const me = useOperator();
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ["settlements"],
		queryFn: () => settlements.list()
	});
	const pilotList = useQuery({
		queryKey: ["pilots"],
		queryFn: pilots.list
	});
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [preflight, setPreflight] = (0, import_react.useState)(null);
	const [approving, setApproving] = (0, import_react.useState)(null);
	const refresh = () => void qc.invalidateQueries({ queryKey: ["settlements"] });
	const run = useMutation({
		mutationFn: async ({ kind, cmd }) => {
			if (kind === "preflight") setPreflight(await settlements.preflight(cmd.id, false));
			else if (kind === "execute") await settlements.execute(cmd.id);
			else await settlements.cancel(cmd.id);
			return kind;
		},
		onSuccess: (kind) => {
			if (kind !== "preflight") toast.success(kind === "execute" ? "Execution recorded (dry run)" : "Command cancelled");
			refresh();
		},
		onError: (e) => toast.error("Action refused", { description: describeError(e) })
	});
	const pilotAction = useMutation({
		mutationFn: ({ id, action }) => pilots.action(id, action),
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["pilots"] }),
		onError: (e) => toast.error("Pilot action refused", { description: describeError(e) })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Controlled settlement",
			title: "Settlements & Pilots",
			description: "Settlement commands need multiple approvals and pass preflight checks. Live execution is refused by policy: execute records a dry run only. Pilots are supervised, observation-only programmes.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setCreateOpen(true),
				className: "rounded-none font-mono text-xs uppercase",
				children: "New command"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: list,
			children: ({ commands, policy }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Kill switch",
						value: policy.GlobalKillSwitch ? "ACTIVE" : "off",
						sub: "Deployment configuration"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Live execution",
						value: policy.ExecutionEnabled ? "enabled" : "disabled",
						sub: "Dry run only when disabled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Approvals required",
						value: policy.RequiredApprovals,
						sub: "Distinct approvers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Per-command cap",
						value: money(fromMinor(policy.MaxAmountMinor)),
						sub: `Daily ${money(fromMinor(policy.DailyLimitMinor))}`
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Settlement commands",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
					tone: "live",
					children: [commands.length, " commands"]
				}),
				children: [commands.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "No settlement commands submitted."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[980px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Command"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Action"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Target"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right",
									children: "Amount"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Requested"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Approval"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-2" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: commands.map((c) => {
							const closed = [
								"succeeded",
								"failed",
								"cancelled",
								"expired"
							].includes(c.status);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/60 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 font-mono text-xs",
										children: shortId(c.id)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 font-mono text-xs",
										children: c.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 font-mono text-xs text-muted-foreground",
										children: c.target
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right font-mono tabular-nums",
										children: money(fromMinor(c.amount_minor), c.currency)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2.5 font-mono text-[11px] text-muted-foreground",
										children: [
											c.requested_by,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
											when(c.created_at)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
											tone: tone(c.approval_state),
											children: c.approval_state
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
											tone: tone(c.status),
											children: c.status
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right",
										children: !closed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-end gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
													onClick: () => run.mutate({
														kind: "preflight",
														cmd: c
													}),
													children: "Preflight"
												}),
												me.role === "arbiter" && c.approval_state === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
													onClick: () => setApproving(c),
													children: "Approve"
												}) : null,
												c.approval_state === "approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
													onClick: () => run.mutate({
														kind: "execute",
														cmd: c
													}),
													children: "Execute"
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
													onClick: () => run.mutate({
														kind: "cancel",
														cmd: c
													}),
													children: "Cancel"
												})
											]
										}) : null
									})
								]
							}, c.id);
						}) })]
					})
				}), me.role !== "arbiter" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-[11px] text-muted-foreground",
					children: "Approvals can only be given by an arbiter account; operators submit, run preflight and cancel."
				}) : null]
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Supervised pilots",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: pilotList.data?.observationOnly ? "Observation only" : "—" }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: pilotList,
				isEmpty: (d) => d.pilots.length === 0,
				empty: "No pilots configured. Seed one with `make pilot-seed` or create it via the API.",
				children: ({ pilots: rows }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[820px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Pilot"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Corridor"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Scope"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right",
									children: "Limits (txn / day)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Window"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-2" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: shortId(p.id)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: p.corridor_id
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-xs text-muted-foreground",
									children: p.scope
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5 text-right font-mono text-xs tabular-nums",
									children: [
										money(fromMinor(p.transaction_limit_minor)),
										" /",
										" ",
										money(fromMinor(p.daily_limit_minor))
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5 font-mono text-[11px] text-muted-foreground",
									children: [
										when(p.start_at),
										" → ",
										when(p.end_at)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: tone(p.status),
										children: p.status
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1",
										children: [
											p.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
												onClick: () => pilotAction.mutate({
													id: p.id,
													action: "pause"
												}),
												children: "Pause"
											}) : null,
											p.status === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
												onClick: () => pilotAction.mutate({
													id: p.id,
													action: "resume"
												}),
												children: "Resume"
											}) : null,
											p.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
												onClick: () => pilotAction.mutate({
													id: p.id,
													action: "complete"
												}),
												children: "Complete"
											}) : null,
											[
												"draft",
												"planned",
												"approved",
												"active",
												"paused"
											].includes(p.status) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
												onClick: () => pilotAction.mutate({
													id: p.id,
													action: "cancel"
												}),
												children: "Cancel"
											}) : null
										]
									})
								})
							]
						}, p.id)) })]
					})
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateDialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			onDone: refresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApproveDialog, {
			cmd: approving,
			onClose: () => setApproving(null),
			onDone: refresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: preflight !== null,
			onOpenChange: (o) => !o && setPreflight(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
				className: "rounded-none sm:max-w-lg",
				children: preflight ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: ["Preflight ", shortId(preflight.command_id)]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: preflight.passed ? "All required checks passed." : "One or more required checks failed." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border border border-border",
					children: preflight.checks.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start justify-between gap-3 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xs",
							children: [c.name, c.required ? "" : " (advisory)"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: c.explain
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							tone: c.passed ? "invert" : "warn",
							children: c.passed ? "PASS" : "FAIL"
						})]
					}, c.name))
				})] }) : null
			})
		})
	] });
}
function Mini({ onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		size: "sm",
		variant: "outline",
		className: "h-7 rounded-none px-2 font-mono text-[10px] uppercase",
		onClick,
		children
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "font-mono text-[10px] uppercase tracking-[0.16em]",
			children: label
		}), children]
	});
}
function CreateDialog({ open, onOpenChange, onDone }) {
	const providers = useQuery({
		queryKey: ["providers"],
		queryFn: corridors.providers,
		enabled: open
	});
	const [action, setAction] = (0, import_react.useState)("payout");
	const [target, setTarget] = (0, import_react.useState)("");
	const [provider, setProvider] = (0, import_react.useState)("");
	const [corridor, setCorridor] = (0, import_react.useState)("rw-rwf-ke-kes");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [currency, setCurrency] = (0, import_react.useState)("RWF");
	const [reason, setReason] = (0, import_react.useState)("");
	const [key] = (0, import_react.useState)(() => crypto.randomUUID());
	const create = useMutation({
		mutationFn: () => settlements.submit({
			action,
			target: target.trim(),
			provider_id: provider || providers.data?.[0]?.config.id || "",
			corridor_id: corridor.trim(),
			amount_minor: toMinor(Number(amount)),
			currency: currency.trim().toUpperCase(),
			reason: reason.trim()
		}, key),
		onSuccess: ({ command }) => {
			toast.success(`Command ${shortId(command.id)} submitted`, { description: "Dry-run only; awaiting approvals." });
			onDone();
			onOpenChange(false);
		},
		onError: (e) => toast.error("Command refused", { description: describeError(e) })
	});
	const ok = target.trim() && Number(amount) > 0 && reason.trim() && corridor.trim() && currency.trim().length === 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "New settlement command"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Submitted commands are idempotent and can never move real funds while live execution is disabled." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Action",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: action,
								onValueChange: setAction,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Action",
									className: "rounded-none font-mono text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: ACTIONS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: a,
										children: a
									}, a))
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Provider",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: provider || providers.data?.[0]?.config.id || "",
								onValueChange: setProvider,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Provider",
									className: "rounded-none font-mono text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Provider" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: (providers.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: p.config.id,
										children: p.config.id
									}, p.config.id))
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Target",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								value: target,
								onChange: (e) => setTarget(e.target.value),
								placeholder: "escrow / transfer reference"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Corridor",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								value: corridor,
								onChange: (e) => setCorridor(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Amount",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								inputMode: "decimal",
								value: amount,
								onChange: (e) => setAmount(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Currency",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								maxLength: 3,
								value: currency,
								onChange: (e) => setCurrency(e.target.value)
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Reason",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "min-h-20 rounded-none",
						value: reason,
						onChange: (e) => setReason(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !ok || create.isPending,
					onClick: () => create.mutate(),
					children: "Submit command"
				}) })
			]
		})
	});
}
function ApproveDialog({ cmd, onClose, onDone }) {
	const [reason, setReason] = (0, import_react.useState)("");
	const decide = useMutation({
		mutationFn: (decision) => settlements.approve(cmd.id, decision, reason.trim()),
		onSuccess: (_r, decision) => {
			toast.success(`Command ${decision}`);
			setReason("");
			onDone();
			onClose();
		},
		onError: (e) => toast.error("Approval refused", { description: describeError(e) })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: cmd !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Approval"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: cmd ? `${cmd.action} ${money(fromMinor(cmd.amount_minor), cmd.currency)} → ${cmd.target}` : "" })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-20 rounded-none",
					placeholder: "Reason for your decision…",
					value: reason,
					onChange: (e) => setReason(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "rounded-none font-mono text-xs uppercase",
						disabled: !reason.trim() || decide.isPending,
						onClick: () => decide.mutate("rejected"),
						children: "Reject"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "rounded-none font-mono text-xs uppercase",
						disabled: !reason.trim() || decide.isPending,
						onClick: () => decide.mutate("approved"),
						children: "Approve"
					})]
				})
			]
		})
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "operator",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settlements, {})
});
//#endregion
export { SplitComponent as component };
