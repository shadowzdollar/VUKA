import { i as __toESM } from "../_runtime.mjs";
import { c as invoices, l as isApiError, o as describeError, u as ledger } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn, t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader } from "./session-DisxoMRQ.mjs";
import { _ as useWallet, a as DialogFooter, c as Metric, i as DialogDescription, l as PageHeader, m as useInvoices, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, t as day } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as LazyHistogramChart } from "./lazy-charts-CUzwBwkB.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { t as Textarea } from "./textarea-BXgeF5np.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trader-invoices-Dj-BXIGs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var invoiceSubtotal = (i) => i.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
var invoiceTotal = (i) => invoiceSubtotal(i) * (1 + i.vat_rate / 100);
var AGEING = [
	"Not yet due",
	"1–30 days late",
	"31–60 days late",
	"60+ days late"
];
/** Buckets unpaid invoices by how far past their due date they are (counts, currency-neutral). */
function ageing(invoices) {
	const counts = [
		0,
		0,
		0,
		0
	];
	const today = Date.now();
	for (const i of invoices) {
		const late = Math.floor((today - new Date(i.due_date).getTime()) / 864e5);
		counts[late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : 3] += 1;
	}
	return AGEING.map((label, idx) => ({
		label,
		count: counts[idx] ?? 0
	}));
}
function TraderInvoices() {
	const trader = useTrader();
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("received");
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const list = useInvoices(tab);
	const all = useInvoices();
	const totals = (0, import_react.useMemo)(() => {
		const rows = all.data ?? [];
		const receivable = rows.filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID");
		const payable = rows.filter((i) => i.counterparty_user_id === trader.id && i.status !== "PAID");
		return {
			receivable: receivable.length,
			payable: payable.length,
			paid: rows.filter((i) => i.status === "PAID").length
		};
	}, [all.data, trader.id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Trade documents",
			title: "Invoices",
			description: "Every payment is bound to the invoice it settles. Issue an invoice to a buyer, or pay one you have received; the status turns PAID when a successful ledger transfer references its number.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setCreateOpen(true),
				className: "rounded-none font-mono text-xs uppercase",
				children: "New invoice"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Awaiting payment to you",
					value: totals.receivable,
					sub: "Issued, unpaid"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "You owe",
					value: totals.payable,
					sub: "Received, unpaid"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Settled",
					value: totals.paid,
					sub: "Paid invoices"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Owed to you · ageing",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyHistogramChart, {
					unit: "invoices",
					ariaLabel: "Unpaid invoices you issued, by days past due",
					data: ageing((all.data ?? []).filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID"))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "You owe · ageing",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyHistogramChart, {
					unit: "invoices",
					ariaLabel: "Unpaid invoices you received, by days past due",
					data: ageing((all.data ?? []).filter((i) => i.counterparty_user_id === trader.id && i.status !== "PAID"))
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Invoice register",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1.5",
				children: ["received", "issued"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t),
					className: "cursor-pointer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: tab === t ? "invert" : "neutral",
						children: t
					})
				}, t))
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: list,
				isEmpty: (d) => d.length === 0,
				empty: tab === "issued" ? "You have not issued any invoices yet." : "No invoices received.",
				children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
					caption: tab === "issued" ? "Issued invoices" : "Received invoices",
					exportName: `vuka-invoices-${tab}.csv`,
					rows,
					rowKey: (i) => i.id,
					onRowClick: (i) => void navigate({
						to: "/escrow/$id",
						params: { id: i.id }
					}),
					initialSort: {
						key: "issued",
						dir: "desc"
					},
					columns: [
						{
							key: "number",
							header: "Number",
							sort: (i) => i.number,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: i.number
							})
						},
						{
							key: "party",
							header: tab === "issued" ? "Buyer" : "Supplier",
							text: (i) => tab === "issued" ? i.counterparty_name : i.issuer_name,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								children: tab === "issued" ? i.counterparty_name : i.issuer_name
							})
						},
						{
							key: "issued",
							header: "Issued",
							sort: (i) => i.issue_date,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-mono text-xs",
								children: day(i.issue_date)
							})
						},
						{
							key: "due",
							header: "Due",
							sort: (i) => i.due_date,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-mono text-xs",
								children: day(i.due_date)
							})
						},
						{
							key: "total",
							header: "Total",
							align: "right",
							sort: (i) => invoiceTotal(i),
							text: (i) => `${invoiceTotal(i)} ${i.currency}`,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-mono",
								children: money(invoiceTotal(i), i.currency)
							})
						},
						{
							key: "status",
							header: "Status",
							align: "right",
							sort: (i) => i.status,
							cell: (i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: i.status === "PAID" ? "invert" : "live",
								children: i.status
							})
						}
					],
					empty: tab === "issued" ? "You have not issued any invoices yet." : "No invoices received."
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateInvoiceDialog, {
			open: createOpen,
			onOpenChange: setCreateOpen
		})
	] });
}
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
var suggestNumber = () => `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
function CreateInvoiceDialog({ open, onOpenChange }) {
	const trader = useTrader();
	const qc = useQueryClient();
	const currency = useWallet().data?.accounts.find((a) => a.type === "BUSINESS")?.currency ?? "RWF";
	const [phone, setPhone] = (0, import_react.useState)("");
	const [buyer, setBuyer] = (0, import_react.useState)(null);
	const [number, setNumber] = (0, import_react.useState)(suggestNumber);
	const [issue, setIssue] = (0, import_react.useState)(today);
	const [due, setDue] = (0, import_react.useState)(() => inDays(14));
	const [vat, setVat] = (0, import_react.useState)("18");
	const [terms, setTerms] = (0, import_react.useState)("");
	const [lines, setLines] = (0, import_react.useState)([{
		description: "",
		quantity: "1",
		unit_price: ""
	}]);
	const [invoiceCurrency, setInvoiceCurrency] = (0, import_react.useState)("");
	const cur = invoiceCurrency || currency;
	const lookup = useMutation({
		mutationFn: () => ledger.recipient(phone.trim()),
		onSuccess: setBuyer,
		onError: (e) => {
			setBuyer(null);
			toast.error(isApiError(e) && e.status === 404 ? "No VUKA trader with that number" : describeError(e));
		}
	});
	const parsed = lines.map((l) => ({
		description: l.description.trim(),
		quantity: Number(l.quantity),
		unit_price: Number(l.unit_price)
	}));
	const linesValid = parsed.every((l) => l.description && l.quantity > 0 && l.unit_price >= 0);
	const subtotal = parsed.reduce((s, l) => s + (l.quantity > 0 ? l.quantity * l.unit_price : 0), 0);
	const vatRate = Number(vat);
	const total = subtotal * (1 + (Number.isFinite(vatRate) ? vatRate : 0) / 100);
	const create = useMutation({
		mutationFn: () => invoices.create(trader.id, {
			number: number.trim(),
			counterparty_user_id: buyer.user.id,
			currency: cur,
			issue_date: issue,
			due_date: due,
			vat_rate: vatRate,
			...terms.trim() ? { terms: terms.trim() } : {},
			items: parsed
		}),
		onSuccess: (inv) => {
			qc.invalidateQueries({ queryKey: ["invoices"] });
			toast.success(`Invoice ${inv.number} issued`, { description: `${money(total, cur)} to ${buyer.user.full_name}` });
			onOpenChange(false);
			setBuyer(null);
			setPhone("");
			setNumber(suggestNumber());
			setLines([{
				description: "",
				quantity: "1",
				unit_price: ""
			}]);
		},
		onError: (e) => toast.error("Invoice not created", { description: describeError(e) })
	});
	const setLine = (i, patch) => setLines((ls) => ls.map((l, idx) => idx === i ? {
		...l,
		...patch
	} : l));
	const ready = !!buyer && number.trim() && linesValid && due >= issue && Number.isFinite(vatRate) && vatRate >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Issue invoice"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "The buyer will see it under Received and can pay it directly from Send Payment." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Buyer mobile number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: phone,
										onChange: (e) => {
											setPhone(e.target.value);
											setBuyer(null);
										},
										placeholder: "+250700000000",
										className: "rounded-none font-mono"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										className: "rounded-none font-mono text-xs uppercase",
										disabled: !phone.trim() || lookup.isPending,
										onClick: () => lookup.mutate(),
										children: "Look up"
									})]
								}),
								buyer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs",
									children: ["Billing ", buyer.user.full_name]
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Invoice no.",
									className: "sm:col-span-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: number,
										onChange: (e) => setNumber(e.target.value),
										className: "rounded-none font-mono"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Currency",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: cur,
										onChange: (e) => setInvoiceCurrency(e.target.value.toUpperCase().slice(0, 3)),
										className: "rounded-none font-mono"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "VAT %",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: vat,
										onChange: (e) => setVat(e.target.value),
										inputMode: "decimal",
										className: "rounded-none font-mono"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Issue date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: issue,
										onChange: (e) => setIssue(e.target.value),
										className: "rounded-none font-mono"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Due date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: due,
										onChange: (e) => setDue(e.target.value),
										className: "rounded-none font-mono"
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Line items"
								}),
								lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-2 sm:grid-cols-[1fr_80px_120px_32px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Description",
											value: l.description,
											onChange: (e) => setLine(i, { description: e.target.value }),
											className: "rounded-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Qty",
											inputMode: "decimal",
											value: l.quantity,
											onChange: (e) => setLine(i, { quantity: e.target.value }),
											className: "rounded-none font-mono"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Unit price",
											inputMode: "decimal",
											value: l.unit_price,
											onChange: (e) => setLine(i, { unit_price: e.target.value }),
											className: "rounded-none font-mono"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "icon",
											"aria-label": "Remove line",
											disabled: lines.length === 1,
											onClick: () => setLines((ls) => ls.filter((_, idx) => idx !== i)),
											className: "rounded-none",
											children: "×"
										})
									]
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									className: "rounded-none font-mono text-[10px] uppercase",
									onClick: () => setLines((ls) => [...ls, {
										description: "",
										quantity: "1",
										unit_price: ""
									}]),
									children: "Add line"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Terms (optional)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: terms,
								onChange: (e) => setTerms(e.target.value),
								className: "min-h-16 rounded-none"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex justify-between border border-border p-3 font-mono text-xs"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Total incl. VAT"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: money(total, cur)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !ready || create.isPending,
					onClick: () => create.mutate(),
					children: create.isPending ? "Issuing…" : "Issue invoice"
				}) })
			]
		})
	});
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-1.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "font-mono text-[10px] uppercase tracking-[0.16em]",
			children: label
		}), children]
	});
}
//#endregion
export { invoiceSubtotal as n, invoiceTotal as r, TraderInvoices as t };
