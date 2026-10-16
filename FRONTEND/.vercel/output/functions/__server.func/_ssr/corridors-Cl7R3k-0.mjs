import { i as __toESM } from "../_runtime.mjs";
import { a as corridors } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary, n as ErrorState, r as Loading } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader, r as useSession } from "./session-DisxoMRQ.mjs";
import { _ as useWallet, c as Metric, d as Shell, g as useTransfers, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { i as money, l as truncMid, o as shortId, r as fromMinor, s as toMinor, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/corridors-Cl7R3k-0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var MNO = {
	RWF: "MTN-MOMO-RW",
	KES: "MPESA-KE",
	UGX: "MTN-MOMO-UG",
	TZS: "MPESA-TZ"
};
/**
* Renders a ledger transfer as an ISO 20022 pacs.008.001.08 FIToFICstmrCdtTrf message. This is a
* client-side rendering of data the engine already holds; the authoritative translation/validation
* lives in the Python ISO gateway (ENGINE/python-iso-gateway), which is a separate service.
*/
function buildPacs008(t, parties) {
	const to = parties.creditorCurrency ?? t.currency;
	const created = new Date(t.created_at).toISOString().replace(/\.\d+Z$/, "Z");
	const e2e = t.invoice_number ?? t.id;
	return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>VUKA-${esc(t.id.replace(/-/g, "").slice(0, 20).toUpperCase())}</MsgId>
      <CreDtTm>${created}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd><ClrSys><Prtry>VUKA-LEDGER</Prtry></ClrSys></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><InstrId>${esc(t.id)}</InstrId><EndToEndId>${esc(e2e)}</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="${esc(t.currency)}">${t.amount.toFixed(2)}</IntrBkSttlmAmt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr><Nm>${esc(parties.debtorName)}</Nm></Dbtr>
      <DbtrAgt><FinInstnId><Othr><Id>${MNO[t.currency] ?? "VUKA-LEDGER"}</Id></Othr></FinInstnId></DbtrAgt>
      <Cdtr><Nm>${esc(parties.creditorName)}</Nm></Cdtr>
      <CdtrAgt><FinInstnId><Othr><Id>${MNO[to] ?? "VUKA-LEDGER"}</Id></Othr></FinInstnId></CdtrAgt>${t.invoice_number ? `\n      <RmtInf><Strd><RfrdDocInf><Nb>${esc(t.invoice_number)}</Nb></RfrdDocInf></Strd></RmtInf>` : ""}
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}
var REQUIRED = [
	"MsgId",
	"CreDtTm",
	"NbOfTxs",
	"InstrId",
	"EndToEndId",
	"IntrBkSttlmAmt",
	"Dbtr",
	"Cdtr"
];
/**
* Well-formedness plus presence of the mandatory pacs.008 elements. This is NOT XSD validation;
* it says so in the UI.
*/
function structuralCheck(xml) {
	const doc = new DOMParser().parseFromString(xml, "application/xml");
	if (doc.getElementsByTagName("parsererror").length > 0) return {
		ok: false,
		problems: ["XML is not well-formed"]
	};
	const problems = REQUIRED.filter((tag) => doc.getElementsByTagName(tag).length === 0).map((tag) => `Missing mandatory element <${tag}>`);
	return {
		ok: problems.length === 0,
		problems
	};
}
function CorridorsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {}) });
}
function Switch() {
	const { session } = useSession();
	return session.status === "operator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperatorProviders, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TraderCorridors, {});
}
function TraderCorridors() {
	const corridors$1 = useQuery({
		queryKey: ["corridors"],
		queryFn: corridors.list
	});
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)("100000");
	const selected = corridors$1.data?.find((c) => c.id === selectedId) ?? corridors$1.data?.[0];
	const minor = Number(amount) > 0 ? toMinor(Number(amount)) : 0;
	const quote = useQuery({
		queryKey: [
			"quote",
			selected?.id,
			minor
		],
		queryFn: () => corridors.quote(selected.id, minor),
		enabled: !!selected && minor > 0,
		retry: false
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Network",
			title: "Corridors",
			description: "Live corridor pricing and limits from the engine, a firm quote calculator, and an ISO 20022 rendering of your own transfers."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: corridors$1,
			isEmpty: (d) => d.length === 0,
			empty: "No corridors are configured.",
			children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Corridors",
							value: rows.length,
							sub: "Configured on this engine"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Enabled",
							value: rows.filter((c) => c.enabled && !c.kill_switch).length,
							sub: "Accepting quotes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Halted",
							value: rows.filter((c) => c.kill_switch).length,
							sub: "Kill switch active"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Corridor rate card",
					meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: "live",
						children: "Live from engine"
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						caption: "Corridor rate card",
						rows,
						rowKey: (c) => c.id,
						onRowClick: (c) => setSelectedId(c.id),
						pageSize: 12,
						exportName: "vuka-corridors.csv",
						initialSort: {
							key: "pair",
							dir: "asc"
						},
						columns: [
							{
								key: "pair",
								header: "Corridor",
								sort: (c) => c.id,
								text: (c) => `${c.id} ${c.from_country} ${c.to_country} ${c.from_currency} ${c.to_currency}`,
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: selected?.id === c.id ? "font-semibold" : void 0,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs",
										children: [
											c.from_currency,
											" → ",
											c.to_currency
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "ml-2 text-xs text-muted-foreground",
										children: [
											c.from_country,
											" → ",
											c.to_country
										]
									})]
								})
							},
							{
								key: "rate",
								header: "Indicative rate",
								align: "right",
								sort: (c) => c.fx.inverse_rate,
								text: (c) => String(c.fx.inverse_rate),
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-mono text-xs",
									children: [
										"1 ",
										c.from_currency,
										" = ",
										c.fx.inverse_rate.toPrecision(5),
										" ",
										c.to_currency
									]
								})
							},
							{
								key: "fee",
								header: "Fee",
								align: "right",
								sort: (c) => c.fees_bps,
								text: (c) => `${c.fees_bps / 100}%`,
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-mono text-xs",
									children: [c.fees_bps / 100, "%"]
								})
							},
							{
								key: "limits",
								header: "Min / max",
								align: "right",
								text: (c) => `${c.min_amount_minor}-${c.max_amount_minor}`,
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-mono text-xs",
									children: [
										money(fromMinor(c.min_amount_minor)),
										" –",
										" ",
										money(fromMinor(c.max_amount_minor))
									]
								})
							},
							{
								key: "provider",
								header: "Payout rail",
								sort: (c) => c.provider_id,
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: c.provider_id
								})
							},
							{
								key: "state",
								header: "State",
								align: "right",
								sort: (c) => c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED",
								cell: (c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: c.kill_switch || !c.enabled ? "warn" : "invert",
									children: c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"
								})
							}
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "How pricing works",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-[1fr_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Every corridor is priced from a transparent fee tier plus the indicative FX rate. A firm quote locks the rate, fee and delivered amount for its validity window, so what you confirm is what settles."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 space-y-2 text-sm",
							children: [
								"Choose the corridor and amount — the quote shows fee, rate and the amount delivered.",
								"Confirm — the quote id is bound to the payment; a changed market cannot alter it.",
								"Collect and pay out — your mobile-money wallet is charged, the recipient is paid on their local rail."
							].map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: ["0", i + 1]
								}), step]
							}, step))
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Fee tiers"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: Array.from(new Set(rows.map((c) => c.fees_bps))).sort((a, b) => a - b).map((bps) => {
								const n = rows.filter((c) => c.fees_bps === bps).length;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-baseline justify-between border border-border px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular font-mono text-lg",
										children: [(bps / 100).toFixed(2), "%"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [
											n,
											" corridors ·",
											" ",
											bps <= 80 ? "within a regional economic community" : "across regions"
										]
									})]
								}, bps);
							})
						})] })]
					})
				}),
				selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Quote calculator",
					meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: selected.id }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "quote-amount",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: [
									"Send amount (",
									selected.from_currency,
									")"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "quote-amount",
								value: amount,
								onChange: (e) => setAmount(e.target.value),
								inputMode: "decimal",
								className: "rounded-none font-mono"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: minor === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Enter an amount for a firm quote."
						}) : quote.isFetching && !quote.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { label: "Fetching quote" }) : quote.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							error: quote.error,
							onRetry: () => void quote.refetch()
						}) : quote.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "space-y-2 border border-border p-3 font-mono text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Rate",
									v: `1 ${selected.from_currency} = ${quote.data.quote.inverse_rate.toPrecision(5)} ${selected.to_currency}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Ledger rate",
									v: `${quote.data.quote.rate.toPrecision(5)} ${selected.from_currency} per ${selected.to_currency}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Fee",
									v: `−${money(fromMinor(quote.data.quote.fee_minor), selected.from_currency)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-t border-border pt-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Beneficiary receives" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular-nums",
										children: money(fromMinor(quote.data.quote.deliver_amount_minor), selected.to_currency)
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 break-all text-[11px] text-muted-foreground",
							children: [
								"Quote ",
								truncMid(quote.data.quote.id, 10, 8),
								" · expires",
								" ",
								when(quote.data.quote.expires_at)
							]
						})] }) : null })]
					})
				}) : null
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IsoViewer, {})
	] });
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular-nums",
			children: v
		})]
	});
}
function IsoViewer() {
	const trader = useTrader();
	const wallet = useWallet();
	const transfers = useTransfers();
	const [id, setId] = (0, import_react.useState)("");
	const [result, setResult] = (0, import_react.useState)(null);
	const usable = (transfers.data ?? []).filter((t) => t.status === "SUCCESS");
	const t = usable.find((x) => x.id === id) ?? usable[0];
	const own = new Set(wallet.data?.accounts.map((a) => a.id) ?? []);
	const xml = t ? buildPacs008(t, {
		debtorName: own.has(t.source_account_id) ? trader.full_name : `VUKA account ${shortId(t.source_account_id)}`,
		creditorName: own.has(t.destination_account_id) ? trader.full_name : `VUKA account ${shortId(t.destination_account_id)}`
	}) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "ISO 20022 pacs.008 message",
		meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
			tone: result.ok ? "invert" : "warn",
			children: result.ok ? "Structure OK" : `${result.problems.length} problem(s)`
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "sm",
			variant: "outline",
			disabled: !xml,
			className: "h-7 rounded-none font-mono text-[10px] uppercase",
			onClick: () => {
				const r = structuralCheck(xml);
				setResult(r);
				if (r.ok) toast.success("Well-formed, all mandatory elements present");
				else toast.error(r.problems[0] ?? "Invalid message");
			},
			children: "Check structure"
		})] }),
		children: transfers.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : usable.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Complete a payment to render it as a standards-based credit-transfer message."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 max-w-md space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "font-mono text-[10px] uppercase tracking-[0.16em]",
					children: "Transfer"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: t?.id ?? "",
					onValueChange: (v) => {
						setId(v);
						setResult(null);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						"aria-label": "Transfer",
						className: "rounded-none font-mono text-xs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
						className: "rounded-none",
						children: usable.slice(0, 25).map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: x.id,
							children: [
								shortId(x.id),
								" · ",
								money(x.amount, x.currency),
								x.invoice_number ? ` · ${x.invoice_number}` : ""
							]
						}, x.id))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "overflow-x-auto border border-border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed",
				children: xml
			}),
			result && !result.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 border-2 border-foreground p-3 text-xs",
				children: result.problems.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: p }, p))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted-foreground",
				children: "Rendered in your browser from the ledger transfer. The check above confirms well-formedness and mandatory elements only; full schema validation is performed by the ISO 20022 gateway service."
			})
		] })
	});
}
function OperatorProviders() {
	const providers = useQuery({
		queryKey: ["providers"],
		queryFn: corridors.providers,
		refetchInterval: 3e4
	});
	const events = useQuery({
		queryKey: ["webhook-events"],
		queryFn: corridors.webhookEvents
	});
	const recon = useQuery({
		queryKey: ["provider-recon"],
		queryFn: corridors.reconciliation
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Network operations",
			title: "Corridors & Providers",
			description: "Telecom provider readiness and kill switches, authenticated webhook evidence, and per-corridor provider reconciliation. Callbacks are evidence only and never mutate ledger entries."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: providers,
			isEmpty: (d) => d.length === 0,
			empty: "No providers registered.",
			children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Providers",
						value: rows.length,
						sub: "Registered adapters"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Healthy",
						value: rows.filter((p) => p.healthy).length,
						sub: "Passing readiness checks"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Kill switch",
						value: rows.filter((p) => p.config.kill_switch).length,
						sub: "Providers halted"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "External calls",
						value: rows.filter((p) => p.config.external_calls).length,
						sub: "Live provider traffic"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Provider registry",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					tone: "live",
					children: "Sandbox"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[820px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Provider"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Environment"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Countries"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Currencies"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Checked"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right",
									children: "Health"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: p.config.display_name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-[10px] text-muted-foreground",
										children: p.config.id
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: p.config.environment
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: p.config.supported_countries.join(", ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs",
									children: p.config.supported_currencies.join(", ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono text-xs text-muted-foreground",
									children: when(p.last_checked)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5 text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: p.config.kill_switch || !p.healthy ? "warn" : "invert",
										children: p.config.kill_switch ? "KILL SWITCH" : p.healthy ? "HEALTHY" : "DEGRADED"
									}), p.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-[10px] text-muted-foreground",
										children: p.reason
									}) : null]
								})
							]
						}, p.config.id)) })]
					})
				})
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Provider reconciliation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: recon,
					isEmpty: (d) => d.length === 0,
					empty: "No reconciliation records yet.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border/60",
						children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-xs",
								children: [
									r.provider_id,
									" · ",
									r.corridor_id
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[11px] text-muted-foreground",
								children: [
									r.open_items,
									" open · last event ",
									when(r.last_event_at)
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: r.open_items > 0 ? "warn" : "invert",
								children: r.state
							})]
						}, `${r.provider_id}-${r.corridor_id}`))
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Webhook evidence",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: events,
					isEmpty: (d) => d.length === 0,
					empty: "No provider callbacks received.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border/60",
						children: rows.slice(0, 10).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-xs",
								children: [
									e.provider_id,
									" · ",
									e.event_type
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[11px] text-muted-foreground",
								children: [
									when(e.received_at),
									" · ",
									e.settlement_action
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: e.authenticated ? "invert" : "warn",
								children: e.authenticated ? "AUTHENTICATED" : "UNVERIFIED"
							})]
						}, e.id))
					})
				})
			})]
		})
	] });
}
//#endregion
export { CorridorsPage as component };
