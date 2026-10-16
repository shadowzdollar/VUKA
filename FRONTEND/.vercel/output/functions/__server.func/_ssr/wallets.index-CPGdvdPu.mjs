import { i as __toESM } from "../_runtime.mjs";
import { d as newIdempotencyKey, o as describeError, u as ledger } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { F as FileDown } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary, n as ErrorState, r as Loading } from "./query-state-38NEt_Mf.mjs";
import { _ as useWallet, a as DialogFooter, c as Metric, f as accountLabel, g as useTransfers, i as DialogDescription, l as PageHeader, n as Dialog, o as DialogHeader, p as directionFor, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, n as downloadCsv, o as shortId, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallets.index-CPGdvdPu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function statusTone(s) {
	if (s === "SUCCESS") return "invert";
	if (s === "FAILED" || s === "REVERSED") return "warn";
	return "live";
}
function Wallets() {
	const wallet = useWallet();
	const transfers = useTransfers();
	const [fundOpen, setFundOpen] = (0, import_react.useState)(false);
	const [entriesFor, setEntriesFor] = (0, import_react.useState)(null);
	const [accountFilter, setAccountFilter] = (0, import_react.useState)("ALL");
	const ownIds = (0, import_react.useMemo)(() => new Set(wallet.data?.accounts.map((a) => a.id) ?? []), [wallet.data]);
	const rows = (0, import_react.useMemo)(() => (transfers.data ?? []).filter((t) => accountFilter === "ALL" || t.source_account_id === accountFilter || t.destination_account_id === accountFilter), [transfers.data, accountFilter]);
	function exportCsv() {
		downloadCsv("vuka-transfers.csv", [
			"transfer_id",
			"created_at",
			"direction",
			"status",
			"amount",
			"currency",
			"fx_rate",
			"invoice",
			"external_reference"
		], rows.map((t) => [
			t.id,
			t.created_at,
			directionFor(t, ownIds),
			t.status,
			t.amount,
			t.currency,
			t.fx_rate ?? "",
			t.invoice_number ?? "",
			t.external_reference ?? ""
		]));
		toast.success("Transfers exported", { description: `${rows.length} rows` });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Ledger engine",
			title: "Wallets & Ledger",
			description: "Trade capital sits in a business wallet, separate from your personal wallet. No balance is stored — every figure is the sum of immutable ledger postings.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: exportCsv,
				disabled: rows.length === 0,
				className: "rounded-none font-mono text-xs uppercase",
				children: "Export transfers"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setFundOpen(true),
				className: "rounded-none font-mono text-xs uppercase",
				children: "Top up wallet"
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: wallet,
			empty: "No accounts found.",
			isEmpty: (w) => w.accounts.length === 0,
			children: (w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: w.accounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/wallets/$id",
					params: { id: a.id },
					className: "block transition-colors hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
					"aria-label": `${accountLabel(a)}, ${money(w.balances[a.id]?.amount ?? 0, a.currency)}. View statement and history.`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: accountLabel(a),
						value: money(w.balances[a.id]?.amount ?? 0, a.currency),
						sub: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between gap-2 font-mono",
							children: [
								"acct ",
								shortId(a.id),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 text-foreground",
									"aria-hidden": "true",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "size-3" }), "Statement"]
								})
							]
						})
					})
				}, a.id))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Transfer register",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [rows.length, " transfers"] }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: transfers,
				children: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
					caption: "Transfer register",
					exportName: "vuka-transfers.csv",
					rows,
					rowKey: (t) => t.id,
					onRowClick: setEntriesFor,
					initialSort: {
						key: "time",
						dir: "desc"
					},
					empty: "No transfers yet. Top up a wallet or send a payment to see activity here.",
					toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: accountFilter,
						onValueChange: setAccountFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-8 w-64 rounded-none font-mono text-xs",
							"aria-label": "Filter by account",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
							className: "rounded-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "ALL",
								children: "All accounts"
							}), (wallet.data?.accounts ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: a.id,
								children: accountLabel(a)
							}, a.id))]
						})]
					}),
					columns: [
						{
							key: "id",
							header: "Transfer",
							sort: (t) => t.id,
							cell: (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: shortId(t.id)
							})
						},
						{
							key: "time",
							header: "Time",
							sort: (t) => t.created_at,
							text: (t) => t.created_at,
							cell: (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-mono text-xs text-muted-foreground",
								children: when(t.created_at)
							})
						},
						{
							key: "dir",
							header: "Direction",
							sort: (t) => directionFor(t, ownIds),
							text: (t) => directionFor(t, ownIds),
							cell: (t) => {
								const d = directionFor(t, ownIds);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs uppercase",
									children: d === "out" ? "Sent" : d === "in" ? "Received" : "Internal"
								});
							}
						},
						{
							key: "invoice",
							header: "Invoice",
							text: (t) => t.invoice_number ?? "",
							cell: (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: t.invoice_number ?? "—"
							})
						},
						{
							key: "ref",
							header: "Reference",
							text: (t) => t.external_reference ?? "",
							cell: (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: t.external_reference ?? "—"
							})
						},
						{
							key: "amount",
							header: "Amount",
							align: "right",
							sort: (t) => t.amount,
							text: (t) => `${t.amount} ${t.currency}`,
							cell: (t) => {
								const d = directionFor(t, ownIds);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-mono",
									children: [d === "out" ? "−" : d === "in" ? "+" : "", money(t.amount, t.currency)]
								});
							}
						},
						{
							key: "status",
							header: "Status",
							align: "right",
							sort: (t) => t.status,
							cell: (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: statusTone(t.status),
								children: t.status
							})
						}
					]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FundDialog, {
			open: fundOpen,
			onOpenChange: setFundOpen,
			accounts: wallet.data?.accounts ?? []
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntriesDialog, {
			transfer: entriesFor,
			onClose: () => setEntriesFor(null)
		})
	] });
}
function FundDialog({ open, onOpenChange, accounts }) {
	const qc = useQueryClient();
	const [accountId, setAccountId] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [key, setKey] = (0, import_react.useState)(newIdempotencyKey);
	const account = accounts.find((a) => a.id === (accountId || accounts.find((x) => x.type === "BUSINESS")?.id));
	const value = Number(amount);
	const fund = useMutation({
		mutationFn: () => ledger.fund(account.id, {
			amount: value,
			currency: account.currency,
			reference: "trader-topup"
		}, key),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["transfers"] });
			toast.success("Wallet topped up", { description: money(value, account.currency) });
			setAmount("");
			setKey(newIdempotencyKey());
			onOpenChange(false);
		},
		onError: (e) => toast.error("Top-up failed", { description: describeError(e) })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Top up wallet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Credits the wallet with an external cash-in (sandbox). The posting is idempotent: retrying never credits twice." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "font-mono text-[10px] uppercase tracking-[0.16em]",
							children: "Wallet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: account?.id ?? "",
							onValueChange: setAccountId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Wallet",
								className: "rounded-none font-mono text-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select wallet" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
								className: "rounded-none",
								children: accounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: a.id,
									children: accountLabel(a)
								}, a.id))
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							className: "font-mono text-[10px] uppercase tracking-[0.16em]",
							children: ["Amount ", account ? `(${account.currency})` : ""]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							className: "rounded-none font-mono",
							value: amount,
							onChange: (e) => setAmount(e.target.value),
							placeholder: "50000"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !account || !(value > 0) || fund.isPending,
					onClick: () => fund.mutate(),
					children: fund.isPending ? "Posting…" : "Confirm top-up"
				}) })
			]
		})
	});
}
function EntriesDialog({ transfer, onClose }) {
	const entries = useQuery({
		queryKey: ["entries", transfer?.id],
		queryFn: () => ledger.entries(transfer.id),
		enabled: transfer !== null
	});
	const sum = (entries.data ?? []).reduce((s, e) => s + e.amount, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: transfer !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "rounded-none sm:max-w-2xl",
			children: transfer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: ["Transfer ", shortId(transfer.id)]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					money(transfer.amount, transfer.currency),
					transfer.fx_rate ? ` · fx ${transfer.fx_rate}` : "",
					" · ",
					when(transfer.created_at)
				] })] }),
				transfer.failure_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "border-2 border-foreground p-3 text-xs",
					children: transfer.failure_reason
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Double-entry postings"
				}),
				entries.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : entries.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					error: entries.error,
					onRetry: () => void entries.refetch()
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "Entry"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "Account"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 text-right",
								children: "Debit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 text-right",
								children: "Credit"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: entries.data.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 font-mono text-xs",
								children: shortId(e.id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 font-mono text-xs",
								children: shortId(e.account_id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 text-right font-mono tabular-nums",
								children: e.amount < 0 ? money(-e.amount) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 text-right font-mono tabular-nums",
								children: e.amount > 0 ? money(e.amount) : "—"
							})
						]
					}, e.id)) })]
				}), transfer.fx_rate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "border border-border p-3 font-mono text-[11px] text-muted-foreground",
					children: "Cross-currency transfer: postings are balanced per currency leg through the FX settlement accounts, so a single sum across legs is not meaningful."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border border-border p-3 font-mono text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: ["Σ postings in ", transfer.currency]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: Math.abs(sum) < 1e-6 ? "invert" : "warn",
						children: Math.abs(sum) < 1e-6 ? "Balanced" : `Δ ${sum}`
					})]
				})] })
			] }) : null
		})
	});
}
//#endregion
export { Wallets as component };
