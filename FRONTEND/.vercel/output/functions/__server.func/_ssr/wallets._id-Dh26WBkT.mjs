import { i as __toESM } from "../_runtime.mjs";
import { o as describeError, s as download, u as ledger } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { F as FileDown, ot as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as QueryBoundary, r as Loading } from "./query-state-38NEt_Mf.mjs";
import { c as Metric, f as accountLabel, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, o as shortId, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
import { t as Route } from "./wallets._id-D3GSxaF0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallets._id-Dh26WBkT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** ISO date (YYYY-MM-DD), for the plain HTML date inputs below. */
function isoDate(d) {
	return d.toISOString().slice(0, 10);
}
function statusTone(s) {
	if (s === "SUCCESS") return "invert";
	if (s === "FAILED" || s === "REVERSED") return "warn";
	return "live";
}
function WalletDetail() {
	const { id } = Route.useParams();
	const [fromDate, setFromDate] = (0, import_react.useState)(() => isoDate(/* @__PURE__ */ new Date(Date.now() - 2592e6)));
	const [toDate, setToDate] = (0, import_react.useState)(() => isoDate(new Date(Date.now() + 864e5)));
	const account = useQuery({
		queryKey: ["account", id],
		queryFn: () => ledger.account(id)
	});
	const balance = useQuery({
		queryKey: ["balance", id],
		queryFn: () => ledger.balance(id)
	});
	const from = `${fromDate}T00:00:00Z`;
	const to = `${toDate}T00:00:00Z`;
	const statement = useQuery({
		queryKey: [
			"statement",
			id,
			from,
			to
		],
		queryFn: () => ledger.statement(id, {
			from,
			to
		}),
		enabled: fromDate < toDate
	});
	const entries = (0, import_react.useMemo)(() => [...statement.data?.entries ?? []].sort((a, b) => b.created_at.localeCompare(a.created_at)), [statement.data]);
	async function downloadXml() {
		try {
			await download(`/api/accounts/${id}/statement`, `vuka-statement-${shortId(id)}-${fromDate}-${toDate}.xml`, {
				from,
				to
			});
		} catch (err) {
			toast.error(describeError(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/wallets",
				className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
					className: "size-3.5",
					"aria-hidden": "true"
				}), "All wallets"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl leading-tight",
					children: account.data ? accountLabel(account.data) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Wallet"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-xs text-muted-foreground",
					children: [
						"acct ",
						id,
						account.data ? ` · opened ${when(account.data.created_at)}` : ""
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: () => void downloadXml(),
					className: "rounded-none font-mono text-xs uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, {
						className: "mr-2 size-3.5",
						"aria-hidden": "true"
					}), "Download statement (ISO 20022)"]
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Current balance",
						value: balance.isPending ? "…" : money(balance.data?.amount ?? 0, account.data?.currency)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: `Opening · ${fromDate}`,
						value: statement.isPending ? "…" : money(statement.data?.opening_balance ?? 0, account.data?.currency)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: `Closing · ${toDate}`,
						value: statement.isPending ? "…" : money(statement.data?.closing_balance ?? 0, account.data?.currency)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Statement",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
							children: ["From", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: fromDate,
								max: toDate,
								onChange: (e) => setFromDate(e.target.value),
								className: "h-7 border border-input bg-background px-1.5 font-mono text-[11px]",
								"aria-label": "Statement period start"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
							children: ["To", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: toDate,
								min: fromDate,
								onChange: (e) => setToDate(e.target.value),
								className: "h-7 border border-input bg-background px-1.5 font-mono text-[11px]",
								"aria-label": "Statement period end"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [entries.length, " entries"] })
					]
				}),
				children: fromDate >= toDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "border-2 border-foreground p-3 text-xs",
					children: "The start date must be before the end date."
				}) : statement.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Loading statement" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: statement,
					empty: "No activity in this period.",
					isEmpty: (s) => s.entries.length === 0,
					children: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						caption: `Ledger entries, ${fromDate} to ${toDate}`,
						exportName: `vuka-statement-${shortId(id)}.csv`,
						rows: entries,
						rowKey: (e) => e.id,
						initialSort: {
							key: "time",
							dir: "desc"
						},
						empty: "No activity in this period.",
						columns: [
							{
								key: "time",
								header: "Date",
								sort: (e) => e.created_at,
								text: (e) => e.created_at,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular font-mono text-xs text-muted-foreground",
									children: when(e.created_at)
								})
							},
							{
								key: "amount",
								header: "Amount",
								align: "right",
								sort: (e) => e.amount,
								text: (e) => `${e.amount}`,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-mono text-xs " + (e.amount < 0 ? "text-muted-foreground" : "text-foreground"),
									children: [e.amount < 0 ? "−" : "+", money(Math.abs(e.amount), account.data?.currency)]
								})
							},
							{
								key: "status",
								header: "Status",
								text: (e) => e.transfer_status,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: statusTone(e.transfer_status),
									children: e.transfer_status
								})
							},
							{
								key: "invoice",
								header: "Invoice",
								text: (e) => e.invoice_number ?? "",
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: e.invoice_number ?? "—"
								})
							},
							{
								key: "ref",
								header: "Reference",
								text: (e) => e.reference ?? "",
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: e.reference ?? "—"
								})
							},
							{
								key: "transfer",
								header: "Transfer",
								text: (e) => e.transaction_id,
								cell: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: shortId(e.transaction_id)
								})
							}
						]
					})
				})
			})
		]
	});
}
//#endregion
export { WalletDetail as component };
