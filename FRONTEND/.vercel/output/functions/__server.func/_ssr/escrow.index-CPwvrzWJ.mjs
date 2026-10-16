import { i as __toESM } from "../_runtime.mjs";
import { f as operator } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as QueryBoundary, t as EmptyState } from "./query-state-38NEt_Mf.mjs";
import { r as useSession } from "./session-DisxoMRQ.mjs";
import { c as Metric, i as DialogDescription, l as PageHeader, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { c as tokenUnits, i as money, l as truncMid, u as when } from "./format-DmZ5-Nei.mjs";
import { i as LazyStateChart } from "./lazy-charts-CUzwBwkB.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
import { n as scopeReady, r as useChainScope, t as ChainScopeBar } from "./chain-scope-bar-BRFobqc7.mjs";
import { t as TraderInvoices } from "./trader-invoices-Dj-BXIGs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/escrow.index-CPwvrzWJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATES = [
	"CREATED",
	"LOCKED",
	"RELEASED",
	"REFUNDED",
	"DISPUTED",
	"SPLIT"
];
var tone = (s) => s === "RELEASED" ? "invert" : s === "DISPUTED" ? "warn" : s === "REFUNDED" ? "dead" : "live";
/** Operator view of the reconciled on-chain escrow read model (GET /api/escrows). */
function OperatorEscrows() {
	const [scope, setScope] = useChainScope();
	const ready = scopeReady(scope);
	const [filter, setFilter] = (0, import_react.useState)("ALL");
	const [active, setActive] = (0, import_react.useState)(null);
	const escrows = useQuery({
		queryKey: ["escrows", scope],
		queryFn: () => operator.escrows(scope),
		enabled: ready,
		refetchInterval: 2e4
	});
	const totals = (0, import_react.useMemo)(() => {
		const t = {
			CREATED: 0,
			LOCKED: 0,
			RELEASED: 0,
			REFUNDED: 0,
			DISPUTED: 0,
			SPLIT: 0
		};
		for (const e of escrows.data ?? []) t[e.state] += tokenUnits(e.amount);
		return t;
	}, [escrows.data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "On-chain settlement",
			title: "Escrow Register",
			description: "Read model of the invoice-linked escrow contract, reconciled from chain events after confirmations. States are chain truth: this desk observes escrows, it cannot move them."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainScopeBar, {
			scope,
			onChange: setScope
		}),
		!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { children: "Enter the escrow contract address to load escrows." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Locked / created",
						value: money(totals.LOCKED + totals.CREATED),
						sub: "Token units held in escrow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Released",
						value: money(totals.RELEASED),
						sub: "Paid to suppliers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Refunded",
						value: money(totals.REFUNDED),
						sub: "Returned to buyers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Disputed",
						value: money(totals.DISPUTED),
						sub: "Frozen pending arbitration"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Split",
						value: money(totals.SPLIT),
						sub: "Settled by arbiter ruling"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Escrow value by state",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyStateChart, { data: STATES.map((st) => ({
					state: st,
					amount: totals[st]
				})) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Escrow register",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: ["ALL", ...STATES].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilter(s),
						className: "cursor-pointer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							tone: filter === s ? "invert" : "neutral",
							children: s
						})
					}, s))
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: escrows,
					disabledCodes: ["reconciliation_disabled"],
					isEmpty: (d) => d.length === 0,
					empty: "No escrows have been reconciled for this contract yet.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						caption: "Escrow register",
						exportName: "vuka-escrows.csv",
						rows: rows.filter((e) => filter === "ALL" || e.state === filter),
						rowKey: (e) => String(e.escrow_id),
						onRowClick: setActive,
						initialSort: {
							key: "id",
							dir: "desc"
						},
						empty: "No escrows match this filter.",
						columns: [
							{
								key: "id",
								header: "Escrow",
								sort: (e) => e.escrow_id,
								text: (e) => `#${e.escrow_id}`,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs",
									children: ["#", e.escrow_id]
								})
							},
							{
								key: "invoice",
								header: "Invoice ref",
								sort: (e) => e.invoice_ref,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: truncMid(e.invoice_ref)
								})
							},
							{
								key: "buyer",
								header: "Buyer",
								text: (e) => e.buyer,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: truncMid(e.buyer)
								})
							},
							{
								key: "supplier",
								header: "Supplier",
								text: (e) => e.supplier,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: truncMid(e.supplier)
								})
							},
							{
								key: "amount",
								header: "Amount",
								align: "right",
								sort: (e) => tokenUnits(e.amount),
								text: (e) => String(tokenUnits(e.amount)),
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular font-mono",
									children: money(tokenUnits(e.amount))
								})
							},
							{
								key: "timeout",
								header: "Timeout",
								align: "right",
								sort: (e) => e.timeout_at,
								text: (e) => (/* @__PURE__ */ new Date(e.timeout_at * 1e3)).toISOString(),
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular font-mono text-xs",
									children: when((/* @__PURE__ */ new Date(e.timeout_at * 1e3)).toISOString())
								})
							},
							{
								key: "state",
								header: "State",
								align: "right",
								sort: (e) => e.state,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: tone(e.state),
									children: e.state
								})
							}
						]
					})
				})
			})
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EscrowDialog, {
			escrow: active,
			scope,
			onClose: () => setActive(null)
		})
	] });
}
function EscrowDialog({ escrow, scope, onClose }) {
	const events = useQuery({
		queryKey: [
			"escrow-events",
			scope,
			escrow?.escrow_id
		],
		queryFn: () => operator.escrowEvents(escrow.escrow_id, scope),
		enabled: escrow !== null
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: escrow !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl",
			children: escrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: ["Escrow #", escrow.escrow_id]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"Invoice ref ",
					escrow.invoice_ref,
					" · last updated at block ",
					escrow.updated_block
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid gap-2 border border-border p-3 font-mono text-[11px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Buyer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "truncate",
								children: escrow.buyer
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Supplier"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "truncate",
								children: escrow.supplier
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Amount"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: money(tokenUnits(escrow.amount)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Contract"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "truncate",
								children: escrow.contract_address
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Chain events"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: events,
					isEmpty: (d) => d.length === 0,
					empty: "No events recorded.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border border border-border",
						children: rows.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									children: e.event_type
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-[10px] text-muted-foreground",
									children: ["block ", e.block_number]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-[10px] text-muted-foreground",
								children: [
									truncMid(e.transaction_hash, 12, 8),
									" · ",
									when(e.observed_at)
								]
							})]
						}, `${e.transaction_hash}-${e.log_index}`))
					})
				})
			] }) : null
		})
	});
}
/** Traders manage invoices; operators observe the on-chain escrow read model. */
function ByRole() {
	const { session } = useSession();
	return session.status === "operator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperatorEscrows, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TraderInvoices, {});
}
//#endregion
export { ByRole as component };
