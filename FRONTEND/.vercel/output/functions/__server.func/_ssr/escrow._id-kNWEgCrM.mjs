import { c as invoices, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { ot as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { r as Loading, t as EmptyState } from "./query-state-38NEt_Mf.mjs";
import { r as useSession } from "./session-DisxoMRQ.mjs";
import { t as Chip } from "./shell-TFIi8X1Z.mjs";
import { i as money, t as day } from "./format-DmZ5-Nei.mjs";
import { t as Route } from "./escrow._id-DK8Xqm9z.mjs";
import { n as invoiceSubtotal, r as invoiceTotal } from "./trader-invoices-Dj-BXIGs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/escrow._id-kNWEgCrM.js
var import_jsx_runtime = require_jsx_runtime();
function InvoiceDetail() {
	const { session } = useSession();
	const { id } = Route.useParams();
	const q = useQuery({
		queryKey: ["invoice", id],
		queryFn: () => invoices.get(id)
	});
	if (session.status === "operator") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, { children: [
		"Invoice detail is a trader view. Operators observe the on-chain escrow register on the",
		" ",
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/escrow",
			className: "underline underline-offset-4",
			children: "escrow list"
		}),
		"."
	] });
	const traderId = session.status === "trader" ? session.trader.id : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/escrow",
			className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
				className: "size-3.5",
				"aria-hidden": "true"
			}), "All invoices"]
		}), q.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Loading invoice" }) : q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-2 border-foreground p-4 text-sm",
			children: describeError(q.error)
		}) : (() => {
			const invoice = q.data;
			const iOwe = traderId ? invoice.counterparty_user_id === traderId : false;
			const subtotal = invoiceSubtotal(invoice);
			const total = invoiceTotal(invoice);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl leading-tight",
						children: invoice.number
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							"Issued ",
							day(invoice.issue_date),
							" · due ",
							day(invoice.due_date),
							" ·",
							" ",
							iOwe ? `you owe ${invoice.issuer_name}` : `${invoice.counterparty_name} owes you`
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							tone: invoice.status === "PAID" ? "invert" : "live",
							children: invoice.status
						}), iOwe && invoice.status !== "PAID" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							className: "rounded-none font-mono text-xs uppercase",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/send",
								search: { invoice: invoice.number },
								children: "Pay this invoice"
							})
						}) : null]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border bg-card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Issued by"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 font-display text-xl",
							children: invoice.issuer_name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border bg-card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Billed to"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 font-display text-xl",
							children: invoice.counterparty_name
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-border bg-card p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Line items"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "mt-3 w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "py-2",
										children: "Item"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "py-2 text-right",
										children: "Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "py-2 text-right",
										children: "Unit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "py-2 text-right",
										children: "Line"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: invoice.items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/60 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: it.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-right font-mono tabular-nums",
										children: it.quantity
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-right font-mono tabular-nums",
										children: money(it.unit_price, invoice.currency)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-right font-mono tabular-nums",
										children: money(it.quantity * it.unit_price, invoice.currency)
									})
								]
							}, it.id)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 space-y-1.5 border-t border-dashed border-border pt-3 font-mono text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Subtotal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular-nums",
										children: money(subtotal, invoice.currency)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
										className: "text-muted-foreground",
										children: [
											"VAT ",
											invoice.vat_rate,
											"%"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular-nums",
										children: money(total - subtotal, invoice.currency)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-t border-border pt-2 text-base font-normal text-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular-nums",
										children: money(total, invoice.currency)
									})]
								})
							]
						})
					]
				}),
				invoice.terms || invoice.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: [invoice.terms, invoice.notes].filter(Boolean).join(" · ")
				}) : null
			] });
		})()]
	});
}
//#endregion
export { InvoiceDetail as component };
