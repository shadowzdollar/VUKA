import { i as __toESM } from "../_runtime.mjs";
import { a as corridors, f as operator, g as support, h as settlements, l as isApiError, m as platform, n as api, o as describeError, p as pilots } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as Trigger2, i as Root2, n as Header, r as Item, t as Content2, y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { C as Minus, H as Cpu, L as Factory, Q as Check, U as Coffee, Z as ChevronDown, a as Truck, at as ArrowRight, c as Store, d as SignalLow, f as Shirt, j as HardHat, k as Landmark, l as Smartphone, m as Share2, n as Wheat, st as ArrowLeftRight, u as Signal } from "../_libs/lucide-react.mjs";
import { d as cn, t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { r as FlagCloth, t as Flag } from "./flags-fYmYFIMT.mjs";
import { i as useT } from "./i18n-CuQ20qdj.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as SiteFooter, r as SiteHeader, t as Photo } from "./site-header-BD7q6WjQ.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary, t as EmptyState } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader, n as useOperator, r as useSession } from "./session-DisxoMRQ.mjs";
import { _ as useWallet, c as Metric, d as Shell, g as useTransfers, h as useNotifications, l as PageHeader, p as directionFor, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { c as tokenUnits, i as money, o as shortId, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as Sparkline, i as Gauge$1, u as usd0 } from "./simple-DAbr7k5P.mjs";
import { a as LazyTrendChart, o as Skeleton } from "./lazy-charts-CUzwBwkB.mjs";
import { r as REGION_NAMES, t as CENTRAL_BANKS } from "./markets-CXFrz9pK.mjs";
import { n as setDataSaver, r as useDataSaver, t as Reveal } from "./reveal-D5NBHzlb.mjs";
import { n as Tilt, t as Sheet3D } from "./tilt-BCeSLHKR.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { n as scopeReady, r as useChainScope, t as ChainScopeBar } from "./chain-scope-bar-BRFobqc7.mjs";
import { n as parseAmount } from "./schemas-DwfNRHoV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BTYU41ft.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* A generic engraved seal: concentric rings, a tick rim and a rotational motif, with the document
* name on the rim. Deliberately NOT an official emblem of any institution.
*/
function Seal({ id, rim, motif }) {
	const r = 44;
	const ticks = Array.from({ length: 48 }, (_, i) => {
		const a = i * 7.5 * Math.PI / 180;
		return `M${(50 + 36 * Math.cos(a)).toFixed(1)},${(50 + 36 * Math.sin(a)).toFixed(1)}L${(50 + 33 * Math.cos(a)).toFixed(1)},${(50 + 33 * Math.sin(a)).toFixed(1)}`;
	}).join("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 100 100",
		className: "size-full",
		"aria-hidden": "true",
		focusable: "false",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				id,
				d: `M50 50 m-${r} 0 a${r} ${r} 0 1 1 88 0 a${r} ${r} 0 1 1 -88 0`
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50",
				cy: "50",
				r: "49",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50",
				cy: "50",
				r: "38.5",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: ticks,
				stroke: "currentColor",
				strokeWidth: "0.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				fontSize: "6.6",
				letterSpacing: "1.2",
				fill: "currentColor",
				fontFamily: "var(--font-mono, monospace)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textPath", {
					href: `#${id}`,
					children: rim
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.2",
				strokeLinecap: "round",
				children: [
					motif === "sun" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "50",
						cy: "50",
						r: "6"
					}), Array.from({ length: 16 }, (_, i) => {
						const a = i * 22.5 * Math.PI / 180;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M${50 + 10 * Math.cos(a)},${50 + 10 * Math.sin(a)}L${50 + 21 * Math.cos(a)},${50 + 21 * Math.sin(a)}` }, i);
					})] }) : null,
					motif === "star" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", { points: Array.from({ length: 10 }, (_, i) => {
						const a = (-90 + i * 36) * Math.PI / 180;
						const d = i % 2 ? 9 : 22;
						return `${(50 + d * Math.cos(a)).toFixed(1)},${(50 + d * Math.sin(a)).toFixed(1)}`;
					}).join(" ") }) : null,
					motif === "wheat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [[-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M50 ${68 - i * 8}q${sd * 12} -6 ${sd * 15} -14` }, i)) }, sd)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M50 72V30" })] }) : null,
					motif === "link" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "42",
						cy: "50",
						r: "13"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "58",
						cy: "50",
						r: "13"
					})] }) : null
				]
			})
		]
	});
}
var DOCS = [
	{
		year: "1991",
		title: "Abuja Treaty",
		motif: "wheat",
		body: "Established the African Economic Community and laid out a staged path to continental integration, built on the regional economic communities.",
		tag: "Foundation"
	},
	{
		year: "2015",
		title: "Agenda 2063",
		motif: "sun",
		body: "The African Union's long-term framework for an integrated and prosperous continent, with a first ten-year implementation plan.",
		tag: "Vision"
	},
	{
		year: "2018 – 2021",
		title: "AfCFTA",
		motif: "star",
		body: "The African Continental Free Trade Area agreement: signed in Kigali in 2018, in force from 2019, with trading under way from 1 January 2021.",
		tag: "Trade"
	},
	{
		year: "2022",
		title: "PAPSS",
		motif: "link",
		body: "The Pan-African Payment and Settlement System, developed with Afreximbank and the AfCFTA Secretariat to settle payments between African currencies.",
		tag: "Payments"
	}
];
function Frameworks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "frameworks",
		className: "scroll-mt-20 overflow-x-clip border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
						children: "The frameworks around us"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
						children: "A payment system is only as strong as the agreements behind it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-muted-foreground",
						children: "Continental trade rests on a run of treaties and programmes. VUKA is designed to complement the direction they set: lower cost, shared rules, and settlement in African currencies."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
					children: DOCS.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: i * 90,
						className: "h-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tilt, {
							max: 7,
							className: "h-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "relative flex h-full min-h-[340px] flex-col border border-border bg-card p-5 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.5)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute -right-3 -top-4 size-20 rotate-12 text-foreground/70 [transform:translateZ(40px)]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seal, {
											id: `seal-${i}`,
											rim: `${d.title.toUpperCase()} · ${d.year} · `,
											motif: d.motif
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
										children: d.tag
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-14 font-display text-4xl leading-none tabular",
										children: d.year
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-3 font-display text-2xl",
										children: d.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: d.body
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"aria-hidden": "true",
										className: "mt-auto pt-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px bg-border" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 h-px w-2/3 bg-border" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 h-px w-1/3 bg-border" })
										]
									})
								]
							})
						})
					}) }, d.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					className: "mt-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						role: "note",
						className: "max-w-3xl border-l-2 border-foreground pl-4 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-foreground",
							children: "Independence notice."
						}), " VUKA is an independent project. It is not affiliated with, endorsed by, or an implementation of any of these instruments or their institutions. Seals shown are generic illustrations, not official emblems."]
					})
				})
			]
		})
	});
}
var FEE_BPS = 50;
var SCENARIOS = [
	{
		id: "ok",
		title: "Goods arrive",
		story: "Buyer confirms delivery.",
		supplierBps: 1e4,
		fee: true,
		steps: [
			"Buyer funds escrow",
			"Goods delivered",
			"Buyer confirms",
			"Escrow releases to supplier"
		],
		rule: "Any confirmation releases the funds to the supplier."
	},
	{
		id: "silence",
		title: "Buyer goes silent",
		story: "Nobody confirms before the timeout.",
		supplierBps: 0,
		fee: false,
		steps: [
			"Buyer funds escrow",
			"Timeout passes",
			"No confirmation on record",
			"Escrow refunds the buyer"
		],
		rule: "Silence never pays out. If nobody confirms, the buyer is refunded in full."
	},
	{
		id: "split",
		title: "Partial delivery",
		story: "Dispute; arbiter awards 70% to the supplier.",
		supplierBps: 7e3,
		fee: true,
		steps: [
			"Buyer funds escrow",
			"Buyer disputes",
			"Arbiter reviews evidence",
			"Escrow splits 70 / 30"
		],
		rule: "An arbiter can split the escrow in any proportion. The fee applies only to the supplier's share."
	},
	{
		id: "absent",
		title: "Arbiter never answers",
		story: "The dispute window closes with no ruling.",
		supplierBps: 5e3,
		fee: true,
		steps: [
			"Buyer funds escrow",
			"Dispute opened",
			"Arbiter silent past window",
			"Anyone triggers the 50 / 50 fallback"
		],
		rule: "After the window, anyone can trigger an even split. A missing arbiter cannot lock funds forever."
	}
];
function EscrowLab() {
	const [sid, setSid] = (0, import_react.useState)("ok");
	const [text, setText] = (0, import_react.useState)("10000");
	const amount = parseAmount(text) ?? 0;
	const s = SCENARIOS.find((x) => x.id === sid);
	const r = (0, import_react.useMemo)(() => {
		const supplierGross = amount * s.supplierBps / 1e4;
		const fee = s.fee ? supplierGross * FEE_BPS / 1e4 : 0;
		return {
			supplier: supplierGross - fee,
			buyer: amount - supplierGross,
			fee
		};
	}, [amount, s]);
	const fmt = (n) => n.toLocaleString(void 0, {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "escrow",
		className: "scroll-mt-20 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
					children: "Escrow lab"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
					children: "Pick what goes wrong. See where the money goes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-5 max-w-2xl text-muted-foreground",
					children: [
						"The escrow contract is public code with a small set of rules. These four scenarios are the ones every cross-border trader worries about, worked through with your own amount. Illustrative protocol fee: ",
						(FEE_BPS / 100).toFixed(2),
						"% (the contract caps it at 1%)."
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 grid gap-6 lg:grid-cols-[320px_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "radiogroup",
					"aria-label": "Scenario",
					className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-1",
					children: SCENARIOS.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": sid === x.id,
						onClick: () => setSid(x.id),
						className: cn("border p-4 text-left transition-colors", sid === x.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-xl",
							children: x.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("mt-1 text-xs", sid === x.id ? "opacity-80" : "text-muted-foreground"),
							children: x.story
						})]
					}, x.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-border bg-card p-5 sm:p-7",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-xs space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "escrow-amount",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Amount held in escrow"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "escrow-amount",
								inputMode: "decimal",
								value: text,
								onChange: (e) => setText(e.target.value),
								className: "h-10 rounded-none font-mono"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-6 grid gap-2 sm:grid-cols-4",
							"aria-label": "What happens",
							children: s.steps.map((st, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "border border-border p-3 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-[10px] text-muted-foreground",
									children: String(n + 1).padStart(2, "0")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1",
									children: st
								})]
							}, st))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6",
							"aria-live": "polite",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-10 w-full overflow-hidden border border-foreground",
								role: "img",
								"aria-label": `Supplier ${fmt(r.supplier)}, buyer ${fmt(r.buyer)}, protocol fee ${fmt(r.fee)}`,
								children: amount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bg-foreground transition-[width] duration-500",
										style: { width: `${r.supplier / amount * 100}%` }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bg-[repeating-linear-gradient(135deg,var(--color-foreground)_0_2px,transparent_2px_6px)] transition-[width] duration-500",
										style: { width: `${r.fee / amount * 100}%` }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "transition-[width] duration-500",
										style: { width: `${r.buyer / amount * 100}%` }
									})
								] }) : null
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-3 grid grid-cols-3 gap-3 font-mono text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Supplier receives"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular font-display text-2xl",
										children: fmt(r.supplier)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Buyer refunded"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular font-display text-2xl",
										children: fmt(r.buyer)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Protocol fee"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular font-display text-2xl",
										children: fmt(r.fee)
									})] })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-5 border-t border-dashed border-border pt-4 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
								children: ["The rule ·", " "]
							}), s.rule]
						})
					]
				})]
			})]
		})
	});
}
function useDebounced(v, ms = 350) {
	const [x, setX] = (0, import_react.useState)(v);
	(0, import_react.useEffect)(() => {
		const id = setTimeout(() => setX(v), ms);
		return () => clearTimeout(id);
	}, [v, ms]);
	return x;
}
/** Public cost calculator backed by GET /api/public/estimate — indicative, unauthenticated, no quote id. */
function Estimator() {
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	});
	const currencies = config.data?.currencies ?? [];
	const [from, setFrom] = (0, import_react.useState)("RWF");
	const [to, setTo] = (0, import_react.useState)("KES");
	const [amountText, setAmountText] = (0, import_react.useState)("100000");
	const amount = parseAmount(amountText);
	const dAmount = useDebounced(amount);
	const est = useQuery({
		queryKey: [
			"estimate",
			from,
			to,
			dAmount
		],
		queryFn: () => api.get("/api/public/estimate", {
			from,
			to,
			amount: dAmount ?? 0
		}),
		enabled: !!dAmount && from !== to && currencies.length > 0,
		retry: false,
		staleTime: 3e4
	});
	const e = est.data;
	const limitsBody = isApiError(est.error) ? est.error.body : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "estimate",
		className: "scroll-mt-20 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid gap-12 px-4 py-20 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-[1fr_1.1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
					children: "Cost estimator"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-4xl leading-tight sm:text-5xl",
					children: [
						"Know the price ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "before" }),
						" you commit."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-lg text-muted-foreground",
					children: "Every corridor is priced from a transparent fee tier and an FX rate. Try any pair of the ten currencies below — this is the same pricing engine that issues firm quotes to signed-in traders, shown here as an indicative figure."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-6 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: "01"
							}), " Fees are 0.80% inside a regional economic community and 1.20% across regions."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: "02"
							}), " The rate is shown both ways, so there is no guessing which way it converts."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: "03"
							}), " A firm quote locks fee, rate and delivered amount for ten minutes."]
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
				delay: 120,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border bg-card p-5 sm:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-[1fr_auto_1fr] items-end gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
											htmlFor: "est-from",
											className: "font-mono text-[10px] uppercase tracking-[0.16em]",
											children: ["You send from", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CurrencyFlag, {
												currency: from,
												countries: config.data?.countries ?? []
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											id: "est-from",
											value: from,
											onChange: (x) => setFrom(x.target.value),
											className: "h-10 w-full border border-input bg-background px-2 font-mono text-sm",
											children: currencies.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: c,
												children: c
											}, c))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										size: "icon",
										className: "mb-0 size-10 rounded-none",
										"aria-label": "Swap currencies",
										onClick: () => {
											setFrom(to);
											setTo(from);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, {
											className: "size-4",
											"aria-hidden": "true"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
											htmlFor: "est-to",
											className: "font-mono text-[10px] uppercase tracking-[0.16em]",
											children: ["Recipient gets", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CurrencyFlag, {
												currency: to,
												countries: config.data?.countries ?? []
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											id: "est-to",
											value: to,
											onChange: (x) => setTo(x.target.value),
											className: "h-10 w-full border border-input bg-background px-2 font-mono text-sm",
											children: currencies.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: c,
												children: c
											}, c))
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: "est-amount",
										className: "font-mono text-[10px] uppercase tracking-[0.16em]",
										children: [
											"Amount (",
											from,
											")"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "est-amount",
										inputMode: "decimal",
										value: amountText,
										onChange: (x) => setAmountText(x.target.value),
										className: "h-11 rounded-none font-mono text-lg",
										"aria-invalid": amountText !== "" && amount === null
									}),
									amountText !== "" && amount === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										role: "alert",
										className: "text-xs",
										children: "Enter a positive amount, e.g. 100000 or 2,500.50"
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-live": "polite",
								className: "mt-6 min-h-[290px]",
								children: from === to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "border border-dashed border-border p-4 text-sm text-muted-foreground",
									children: "Same currency: no conversion and no corridor fee — a domestic payment settles on the ledger at par."
								}) : est.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-2 border-foreground p-4 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-[10px] uppercase tracking-[0.2em]",
										children: "No estimate"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-muted-foreground",
										children: [isApiError(est.error) ? est.error.message : describeError(est.error), limitsBody?.min_amount !== void 0 ? ` Allowed range: ${money(limitsBody.min_amount, from)} – ${money(limitsBody.max_amount ?? 0, from)}.` : ""]
									})]
								}) : e ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { e }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-dashed border-border p-4 text-sm text-muted-foreground",
									children: est.isFetching ? "Pricing…" : "Enter an amount to see the estimate."
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-xs text-[11px] text-muted-foreground",
									children: "Indicative, at sandbox reference rates. Sign in for a firm quote that locks the rate."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									className: "rounded-none font-mono text-xs uppercase",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/register",
										children: "Get a firm quote"
									})
								})]
							})
						]
					})
				})
			})]
		})
	});
}
/** Sends the estimate through the phone's own share sheet (WhatsApp, SMS, ...) or a WhatsApp link. */
function ShareRow({ e }) {
	const [note, setNote] = (0, import_react.useState)("");
	const text = `VUKA estimate (indicative, sandbox): send ${money(e.amount, e.from)}, fee ${money(e.fee, e.from)}, recipient gets ${money(e.delivered, e.to)}.`;
	async function share() {
		try {
			if (navigator.share) await navigator.share({
				title: "VUKA estimate",
				text
			});
			else {
				await navigator.clipboard.writeText(text);
				setNote("Copied to clipboard");
			}
		} catch (err) {
			if (err.name !== "AbortError") setNote("Could not share on this device");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-2 border-t border-border px-5 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void share(),
				className: "inline-flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
					className: "size-3",
					"aria-hidden": "true"
				}), "Share"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: `https://wa.me/?text=${encodeURIComponent(text)}`,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "border border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent",
				children: "WhatsApp"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				role: "status",
				className: "font-mono text-[10px] text-muted-foreground",
				children: note
			})
		]
	});
}
function Receipt({ e }) {
	const rows = [
		["You send", money(e.amount, e.from)],
		[`Corridor fee · ${(e.fee_bps / 100).toFixed(2)}%`, `− ${money(e.fee, e.from)}`],
		["Rate", `1 ${e.from} = ${e.inverse_rate.toPrecision(5)} ${e.to}`],
		["Payout rail", e.provider_id]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative border border-border bg-background",
		"aria-label": "Estimate receipt",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "absolute inset-x-0 -top-px h-2 bg-[radial-gradient(circle_at_6px_0,var(--color-card)_5px,transparent_5.5px)] bg-[length:12px_8px]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "space-y-2.5 px-5 pb-4 pt-6 font-mono text-xs",
				children: [rows.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted-foreground",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "tabular text-right",
						children: v
					})]
				}, k)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-4 border-t border-dashed border-border pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-sm",
						children: "Recipient receives"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "tabular font-display text-3xl leading-none",
						children: money(e.delivered, e.to)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareRow, { e }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stamp-in absolute right-4 top-3 border-2 border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
				"aria-hidden": "true",
				children: "Indicative"
			})
		]
	});
}
function CurrencyFlag({ currency, countries }) {
	const c = countries.find((x) => x.currency === currency);
	return c ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
		code: c.code,
		label: `Flag of ${c.name}`,
		className: "ml-2 inline-block w-5 align-[-3px]"
	}) : null;
}
var Globe$1 = (0, import_react.lazy)(() => import("./globe-D6UACyfy.mjs"));
/** A believable ring of corridors: every market to its regional neighbours plus a few long hauls. */
function arcsFor(markets) {
	const has = (c) => markets.some((m) => m.code === c);
	return [
		["RW", "KE"],
		["KE", "UG"],
		["UG", "TZ"],
		["RW", "TZ"],
		["KE", "ET"],
		["TZ", "ZM"],
		["ZM", "ZA"],
		["GH", "NG"],
		["NG", "SN"],
		["GH", "SN"],
		["KE", "NG"],
		["RW", "GH"],
		["ZA", "KE"],
		["ET", "NG"]
	].filter(([a, b]) => has(a) && has(b));
}
function useMounted() {
	const [m, setM] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setM(true), []);
	return m;
}
function Hero() {
	const t = useT();
	const mounted = useMounted();
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	});
	const [active, setActive] = (0, import_react.useState)(null);
	const markets = (0, import_react.useMemo)(() => config.data?.countries ?? [], [config.data]);
	const arcs = (0, import_react.useMemo)(() => arcsFor(markets), [markets]);
	const saver = useDataSaver();
	const onActive = (0, import_react.useCallback)((c) => setActive(c), []);
	const current = markets.find((m) => m.code === active);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "relative overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "reveal is-in flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						className: "h-px w-10 bg-foreground"
					}), t("landing.eyebrow")]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-6 font-display text-5xl font-normal leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl",
					children: [
						"Trade across borders on trust that is ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "italic",
							children: "enforced"
						}),
						", not just displayed."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-7 max-w-xl text-base text-muted-foreground sm:text-lg",
					children: t("landing.lead")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-9 flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						className: "group rounded-none font-mono text-xs uppercase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/register",
							children: [t("landing.cta.register"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "ml-2 size-4 transition-transform group-hover:translate-x-1",
								"aria-hidden": "true"
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						variant: "outline",
						className: "rounded-none font-mono text-xs uppercase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#estimate",
							children: "See what a payment costs"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
					className: "mt-12 grid max-w-xl grid-cols-3 border-y border-border",
					children: [
						[config.data?.countries.length ?? "—", "countries"],
						[config.data?.corridor_count ?? "—", "corridors"],
						[config.data?.currencies.length ?? "—", "currencies"]
					].map(([v, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-r border-border px-4 py-5 last:border-r-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular font-display text-4xl leading-none",
							children: v
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: l
						})]
					}, String(l)))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mx-auto aspect-square w-full max-w-[600px]",
						children: saver ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex size-full flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl",
									children: "Map paused to save data"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-xs text-sm text-muted-foreground",
									children: "The interactive globe is about 100 KB of map data. Everything else on the page works as usual."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setDataSaver(false),
									className: "border border-foreground px-3 py-1.5 font-mono text-xs uppercase hover:bg-accent",
									children: "Load the map"
								})
							]
						}) : mounted && markets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
							fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
								className: "size-full rounded-full",
								"aria-label": "Loading map"
							}),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe$1, {
								markets,
								arcs,
								activeCode: active,
								onActive,
								className: "relative size-full"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
							className: "size-full rounded-full",
							"aria-label": "Loading map"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-live": "polite",
						className: "mx-auto mt-4 min-h-[68px] max-w-[600px] border border-border bg-card p-3 text-sm",
						children: current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagCloth, {
								code: current.code,
								label: `Flag of ${current.name}`,
								className: "w-14 shrink-0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-xl",
										children: current.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs",
										children: current.currency
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: [
										"Payout rail: ",
										current.provider_name,
										" · ",
										current.region,
										" region"
									]
								})]
							})]
						}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Drag the globe. Hover a solid country to see its rail. Dashed arcs are live corridors."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mx-auto mt-3 flex max-w-[600px] flex-wrap justify-center gap-1.5",
						"aria-label": "Markets",
						children: markets.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onMouseEnter: () => setActive(m.code),
							onMouseLeave: () => setActive(null),
							onFocus: () => setActive(m.code),
							onBlur: () => setActive(null),
							className: cn("border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors", active === m.code ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
									code: m.code,
									ink: active !== m.code,
									className: "mr-1.5 inline-block w-4 align-[-2px]"
								}),
								m.code,
								" · ",
								m.currency
							]
						}) }, m.code))
					})
				]
			})]
		})
	});
}
var STEPS = [
	{
		k: "Invoice",
		h: "The supplier raises an invoice",
		b: "Goods, quantity, price and currency are written down once. The buyer sees exactly what they are agreeing to, in their own language.",
		doc: [
			"INVOICE  #0412",
			"Maize flour · 40 t",
			"RWF 18,400,000"
		]
	},
	{
		k: "Quote",
		h: "A firm quote locks the price",
		b: "Fee, FX rate and delivered amount are signed and held for ten minutes. If the rate moves, the buyer is quoted again; nobody is charged more than they were shown.",
		doc: [
			"QUOTE  q1.7f3a…",
			"Fee 0.80 %",
			"Delivers KES 1,733,000"
		]
	},
	{
		k: "Escrow",
		h: "Funds are held, not handed over",
		b: "The payment goes into a smart-contract escrow. The supplier can see it is committed, and the buyer knows it cannot be spent until the goods are confirmed.",
		doc: [
			"ESCROW  HELD",
			"Release: on confirmation",
			"Timeout: 72 h"
		]
	},
	{
		k: "Delivery",
		h: "Goods move; both sides confirm",
		b: "The buyer confirms receipt. If they are silent, the escrow refunds them — silence never pays out. A dispute opens an arbitration window with a neutral arbiter.",
		doc: [
			"DELIVERY  CONFIRMED",
			"By buyer · 14 Mar",
			"No dispute raised"
		]
	},
	{
		k: "Payout",
		h: "Money lands in mobile money",
		b: "The ledger records a balanced double entry and the payout goes to the supplier's mobile-money wallet or bank rail. Every step is auditable afterwards.",
		doc: [
			"PAYOUT  SENT",
			"mtn-rw · wallet",
			"Ledger balanced ✓"
		]
	}
];
/** Five-step journey with a 3D paper stack that reshuffles to the step the reader selects. */
function Journey() {
	const [i, setI] = (0, import_react.useState)(0);
	const step = STEPS[i];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "journey",
		className: "scroll-mt-20 border-t border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
				children: "The journey of one payment"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
				children: "From a handshake to a settled ledger, in five steps you can see."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "tablist",
						"aria-label": "Payment journey",
						className: "flex flex-wrap gap-1.5",
						children: STEPS.map((s, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							role: "tab",
							id: `journey-tab-${n}`,
							"aria-selected": i === n,
							"aria-controls": "journey-panel",
							tabIndex: i === n ? 0 : -1,
							onClick: () => setI(n),
							onKeyDown: (e) => {
								if (e.key === "ArrowRight") {
									setI((i + 1) % STEPS.length);
									document.getElementById(`journey-tab-${(i + 1) % STEPS.length}`)?.focus();
								}
								if (e.key === "ArrowLeft") {
									const p = (i + STEPS.length - 1) % STEPS.length;
									setI(p);
									document.getElementById(`journey-tab-${p}`)?.focus();
								}
							},
							className: cn("border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors", i === n ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mr-1.5 opacity-60",
								children: String(n + 1).padStart(2, "0")
							}), s.k]
						}, s.k))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "journey-panel",
						role: "tabpanel",
						"aria-labelledby": `journey-tab-${i}`,
						tabIndex: 0,
						className: "mt-8 min-h-[200px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-3xl leading-snug",
							children: step.h
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-lg text-muted-foreground",
							children: step.b
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 h-0.5 w-full bg-border",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-foreground transition-[width] duration-500",
							style: { width: `${(i + 1) / STEPS.length * 100}%` }
						})
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tilt, {
					className: "mx-auto h-[340px] w-full max-w-[520px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "relative size-full",
						children: STEPS.map((s, n) => {
							const depth = n - i;
							const z = depth < 0 ? 90 : 60 - depth * 26;
							const y = depth < 0 ? -60 : depth * 16;
							const x = depth < 0 ? -30 : depth * 12;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet3D, {
								z,
								className: "absolute inset-x-6 top-6 h-[230px] p-5 font-mono text-xs transition-[transform,opacity] duration-700 ease-out",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										transform: `translate(${x}px, ${y}px)`,
										opacity: depth < 0 ? 0 : 1
									},
									className: "size-full transition-[transform,opacity] duration-700",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-dashed border-border pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Step ", String(n + 1).padStart(2, "0")] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.k })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 space-y-3",
										children: s.doc.map((l, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: k === 0 ? "font-display text-2xl" : "text-sm text-foreground/80",
											children: l
										}, l))
									})]
								})
							}, s.k);
						})
					})
				})]
			})]
		})
	});
}
var TABS = [
	{
		id: "hold",
		label: "Hold to confirm",
		h: "A confirmation you cannot fat-finger.",
		b: "Releasing escrow is the one tap that moves money for good, so on a phone it takes a deliberate press-and-hold. A stray tap in a crowded market does nothing."
	},
	{
		id: "signal",
		label: "Weak signal",
		h: "Bad network, one payment.",
		b: "Every payment carries an idempotency key. If the connection drops and the app retries, the engine recognises the key and returns the first result instead of paying twice."
	},
	{
		id: "ussd",
		label: "Feature phone",
		h: "Not everyone has a smartphone.",
		b: "A USSD menu would let a feature phone check balances, send within limits and confirm delivery over a plain dial code. This is a working concept using the live pricing engine — the channel itself needs a telecom shortcode agreement."
	},
	{
		id: "share",
		label: "Share & install",
		h: "Send it where trade already happens.",
		b: "Share a quote or receipt straight into WhatsApp or SMS from the phone's own share sheet, and add VUKA to the home screen so it opens like an app."
	}
];
function MobileSection() {
	const [tab, setTab] = (0, import_react.useState)("hold");
	const t = TABS.find((x) => x.id === tab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "mobile",
		className: "scroll-mt-20 overflow-x-clip border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
					children: "In your pocket"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
					children: "Built for the phone you actually have, on the network you actually get."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-2xl text-muted-foreground",
					children: "Most SME trade here happens on a phone — often on patchy data, sometimes on a feature phone. These four interactions are live: try them on the handset."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-12 grid items-center gap-12 lg:grid-cols-[1fr_auto]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "tablist",
						"aria-label": "Mobile features",
						className: "grid grid-cols-2 gap-1.5 sm:grid-cols-4",
						children: TABS.map((x, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							role: "tab",
							id: `mob-tab-${x.id}`,
							"aria-selected": tab === x.id,
							"aria-controls": "mob-panel",
							tabIndex: tab === x.id ? 0 : -1,
							onClick: () => setTab(x.id),
							onKeyDown: (e) => {
								const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
								if (!d) return;
								const next = TABS[(n + d + TABS.length) % TABS.length];
								setTab(next.id);
								document.getElementById(`mob-tab-${next.id}`)?.focus();
							},
							className: cn("border px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] transition-colors", tab === x.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block opacity-60",
								children: String(n + 1).padStart(2, "0")
							}), x.label]
						}, x.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "mob-panel",
						role: "tabpanel",
						"aria-labelledby": `mob-tab-${tab}`,
						tabIndex: 0,
						className: "mt-8 min-h-[190px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-3xl leading-snug",
							children: t.h
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-lg text-muted-foreground",
							children: t.b
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataMeter, {})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { children: tab === "hold" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldScreen, {}) : tab === "signal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalScreen, {}) : tab === "ussd" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UssdScreen, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareScreen, {}) })]
			})]
		})
	});
}
function Phone({ children }) {
	const ref = (0, import_react.useRef)(null);
	const [gyro, setGyro] = (0, import_react.useState)("off");
	const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const apply = (x, y) => {
		if (ref.current && !still()) ref.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
	};
	const onMove = (e) => {
		if (e.pointerType === "touch") return;
		const r = e.currentTarget.getBoundingClientRect();
		apply(((e.clientX - r.left) / r.width - .5) * 22, -((e.clientY - r.top) / r.height - .5) * 16);
	};
	(0, import_react.useEffect)(() => {
		if (gyro !== "on") return;
		const h = (e) => {
			if (e.gamma == null || e.beta == null) return;
			apply(Math.max(-18, Math.min(18, e.gamma / 2.5)), Math.max(-14, Math.min(14, -(e.beta - 50) / 3)));
		};
		window.addEventListener("deviceorientation", h);
		return () => window.removeEventListener("deviceorientation", h);
	}, [gyro]);
	async function enableGyro() {
		const D = window.DeviceOrientationEvent;
		if (!D) return setGyro("unavailable");
		try {
			if (typeof D.requestPermission === "function" && await D.requestPermission() !== "granted") return setGyro("unavailable");
			setGyro("on");
		} catch {
			setGyro("unavailable");
		}
	}
	const canGyro = typeof window !== "undefined" && "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "stage-3d px-6 py-8",
			onPointerMove: onMove,
			onPointerLeave: () => apply(-8, 3),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref,
				className: "layer-3d relative w-[272px] transition-transform duration-150 ease-out",
				style: { transform: "rotateY(-8deg) rotateX(3deg)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "absolute inset-0 translate-x-3 translate-y-4 bg-foreground/10 [border-radius:2.6rem]",
						style: { transform: "translateZ(-30px) translate(14px,18px)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative border-[3px] border-foreground bg-background p-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] [border-radius:2.6rem]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative h-[540px] overflow-hidden border border-border bg-background [border-radius:2rem]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-hidden": "true",
								className: "absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-full flex-col pt-8",
								children
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "absolute -top-4 right-6 hidden border border-foreground bg-background px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] sm:block",
						style: { transform: "translateZ(60px)" },
						children: "SMS receipt ✓"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "absolute -bottom-4 left-6 hidden border border-foreground bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-background sm:block",
						style: { transform: "translateZ(80px)" },
						children: "Idempotent"
					})
				]
			})
		}), canGyro ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => void enableGyro(),
			className: "mx-auto mt-3 flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-accent",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
				className: "size-3.5",
				"aria-hidden": "true"
			}), gyro === "on" ? "Tilting with your phone" : gyro === "unavailable" ? "Motion not available" : "Tilt with your phone"]
		}) : null]
	});
}
var ScreenHead = ({ title, right }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center justify-between border-b border-border px-4 pb-2 pt-1.5",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-[13px] font-semibold tracking-[0.3em]",
		children: "VUKA"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
		children: right ?? title
	})]
});
var HOLD_MS = 1200;
var R = 44;
var C = 2 * Math.PI * R;
function HoldScreen() {
	const [holding, setHolding] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	const timer = (0, import_react.useRef)(void 0);
	const finish = (0, import_react.useCallback)(() => {
		setHolding(false);
		setDone(true);
		try {
			navigator.vibrate?.([
				30,
				40,
				30
			]);
		} catch {}
	}, []);
	const start = () => {
		if (done) return;
		setHolding(true);
		timer.current = window.setTimeout(finish, HOLD_MS);
	};
	const cancel = () => {
		window.clearTimeout(timer.current);
		if (!done) setHolding(false);
	};
	(0, import_react.useEffect)(() => () => window.clearTimeout(timer.current), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScreenHead, { title: "Escrow" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 space-y-3 overflow-hidden p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "Invoice #0412"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-display text-lg leading-tight",
						children: "Maize flour · 40 t"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Held in escrow · RWF 18,400,000"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Goods arrived as agreed? Confirming releases the money to the supplier."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-label": done ? "Delivery confirmed" : "Press and hold to confirm delivery",
						"aria-describedby": "hold-help",
						disabled: done,
						onPointerDown: start,
						onPointerUp: cancel,
						onPointerLeave: cancel,
						onPointerCancel: cancel,
						onKeyDown: (e) => {
							if ((e.key === " " || e.key === "Enter") && !e.repeat) {
								e.preventDefault();
								start();
							}
						},
						onKeyUp: (e) => {
							if (e.key === " " || e.key === "Enter") cancel();
						},
						onClick: (e) => {
							if (e.detail === 0 && !done) finish();
						},
						onContextMenu: (e) => e.preventDefault(),
						className: "relative grid size-[112px] touch-none select-none place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 100 100",
							className: "absolute inset-0 -rotate-90",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "50",
								cy: "50",
								r: R,
								fill: "none",
								stroke: "currentColor",
								strokeOpacity: "0.2",
								strokeWidth: "5"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "50",
								cy: "50",
								r: R,
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "5",
								strokeDasharray: C,
								strokeDashoffset: holding || done ? 0 : C,
								style: { transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : done ? "none" : "stroke-dashoffset 250ms ease-out" }
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("grid size-[76px] place-items-center rounded-full font-mono text-[10px] uppercase tracking-[0.12em] transition-all", done ? "bg-foreground text-background" : holding ? "scale-95 bg-foreground/90 text-background" : "border border-foreground"),
							children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "size-6",
								"aria-hidden": "true"
							}) : holding ? "Keep\xA0holding" : "Hold"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						id: "hold-help",
						className: "mt-3 text-center text-[11px] text-muted-foreground",
						children: done ? "Released to the supplier. An SMS receipt is on its way." : "Press and hold for 1.2 seconds. Keyboard: hold Enter."
					}),
					done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setDone(false),
						className: "mt-2 font-mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-4",
						children: "Try again"
					}) : null
				]
			})
		]
	})] });
}
function SignalScreen() {
	const [weak, setWeak] = (0, import_react.useState)(true);
	const [log, setLog] = (0, import_react.useState)([]);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [key] = (0, import_react.useState)(() => "idem_" + Math.random().toString(16).slice(2, 8));
	const timers = (0, import_react.useRef)([]);
	const clear = () => {
		timers.current.forEach(clearTimeout);
		timers.current = [];
	};
	(0, import_react.useEffect)(() => clear, []);
	function send() {
		clear();
		setPhase("sending");
		const after = (ms, fn) => timers.current.push(window.setTimeout(fn, ms));
		const push = (l) => setLog((x) => [...x, l]);
		setLog([`POST /transfers · ${key}`]);
		if (!weak) {
			after(500, () => {
				push("200 · posted");
				setPhase("done");
			});
			return;
		}
		after(900, () => push("… no response (timeout)"));
		after(1300, () => push(`retry 1 · same ${key}`));
		after(2200, () => push("… no response (timeout)"));
		after(2600, () => push(`retry 2 · same ${key}`));
		after(3300, () => {
			push("200 · original result returned");
			setPhase("done");
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScreenHead, {
		title: "Send",
		right: weak ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "inline-flex items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalLow, {
				className: "size-3",
				"aria-hidden": "true"
			}), "weak"]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "inline-flex items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signal, {
				className: "size-3",
				"aria-hidden": "true"
			}), "good"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 space-y-3 overflow-hidden p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "To"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Supplier · Nairobi" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 font-display text-2xl",
					children: "RWF 100,000"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center justify-between border border-border p-2.5 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Simulate weak network" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked: weak,
					onChange: (e) => {
						setWeak(e.target.checked);
						setPhase("idle");
						setLog([]);
						clear();
					},
					className: "size-4 accent-[var(--color-foreground)]"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: send,
				disabled: phase === "sending",
				className: "w-full bg-foreground py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-background disabled:opacity-60",
				children: phase === "sending" ? "Sending…" : phase === "done" ? "Send again" : "Send payment"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"aria-live": "polite",
				className: "min-h-[150px] border border-dashed border-border p-2.5 font-mono text-[10px] leading-relaxed",
				children: [log.length ? log.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: l.startsWith("200") ? "font-semibold" : "text-muted-foreground",
					children: l
				}, i)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground",
					children: "Tap send. With a weak network the app retries on its own."
				}), phase === "done" && weak ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 border-t border-border pt-2",
					children: [
						"Result: ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1 payment" }),
						", 2 retries recognised. Nobody was charged twice."
					]
				}) : null]
			})
		]
	})] });
}
var PLACEHOLDER_CODE = "*000#";
function UssdScreen() {
	const [path, setPath] = (0, import_react.useState)([]);
	const key = path.join(".");
	const [to, amt] = [path[1], path[2]];
	const dest = {
		"1": "KES",
		"2": "UGX",
		"3": "GHS"
	}[to ?? ""];
	const amount = {
		"1": 1e4,
		"2": 5e4,
		"3": 1e5
	}[amt ?? ""];
	const quote = useQuery({
		queryKey: [
			"ussd-quote",
			dest,
			amount
		],
		queryFn: () => api.get("/api/public/estimate", {
			from: "RWF",
			to: dest ?? "",
			amount: amount ?? 0
		}),
		enabled: path[0] === "2" && !!dest && !!amount,
		retry: false,
		staleTime: 3e4
	});
	const text = (() => {
		const q = quote.data;
		switch (key) {
			case "": return "VUKA\n1 Balance\n2 Send money\n3 Confirm delivery\n4 Trust score\n0 Exit";
			case "1": return "Business wallet\nRWF 1,240,500\nPersonal wallet\nRWF 86,200\n\n0 Back";
			case "2": return "Send to\n1 Kenya (KES)\n2 Uganda (UGX)\n3 Ghana (GHS)\n\n0 Back";
			case "3": return "Awaiting you\n1 Maize flour 40t\n   RWF 18.4M\n\n0 Back";
			case "3.1": return "Goods received?\n1 Yes, release\n2 Dispute\n\n0 Back";
			case "3.1.1": return "Released to supplier.\nSMS receipt sent.\n\n0 Menu";
			case "3.1.2": return "Dispute opened.\nAn arbiter will\ncontact you.\n\n0 Menu";
			case "4": return "Trust score\n742 · Strong\n(illustrative)\n\n0 Back";
			case "0": return "Session ended.";
			default:
				if (path[0] === "2" && path.length === 2 && dest) return `Amount (RWF)\n1 10,000\n2 50,000\n3 100,000\n\n0 Back`;
				if (path[0] === "2" && path.length === 3 && dest && amount) return quote.isPending ? "Pricing…" : quote.isError || !q ? "Amount outside\ncorridor limits.\n\n0 Back" : `Fee ${money(q.fee, "RWF")}\nThey get\n${money(q.delivered, q.to)}\nIndicative.\n1 Lock quote\n0 Cancel`;
				if (path[0] === "2" && path.length === 4 && dest && amount && path[3] === "1") return "Quote locked 10 min.\nApprove in the app.\nSandbox: no money\nmoved.\n\n0 Menu";
				return "Invalid choice.\n\n0 Back";
		}
	})();
	const terminal = key === "3.1.1" || key === "3.1.2" || path[0] === "2" && path.length === 4 && path[3] === "1";
	const press = (d) => {
		if (key === "0") return setPath([]);
		if (d === "0") return setPath(path.length === 0 ? ["0"] : terminal ? [] : path.slice(0, -1));
		setPath([...path, d]);
	};
	const exit = path.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col bg-muted/40",
		onKeyDown: (e) => {
			if (/^\d$/.test(e.key)) press(e.key);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 pb-2 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dial" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [PLACEHOLDER_CODE, " · placeholder"] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "status",
				"aria-live": "polite",
				className: "mx-3 min-h-[178px] whitespace-pre-line border border-foreground bg-background p-3 font-mono text-[12px] leading-snug",
				children: text
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pt-2 text-[10px] text-muted-foreground",
				children: exit ? "Tap a number to reply." : "Reply with a number. 0 goes back."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-auto grid grid-cols-3 gap-1.5 p-3",
				role: "group",
				"aria-label": "Keypad",
				children: [
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"*",
					"0",
					"#"
				].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: d === "*" || d === "#",
					onClick: () => press(d),
					className: "border border-border bg-background py-2.5 font-mono text-sm hover:bg-accent disabled:opacity-40",
					children: d
				}, d))
			})
		]
	});
}
function ShareScreen() {
	const [msg, setMsg] = (0, import_react.useState)("");
	const [install, setInstall] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const h = (e) => {
			e.preventDefault();
			setInstall(e);
		};
		window.addEventListener("beforeinstallprompt", h);
		return () => window.removeEventListener("beforeinstallprompt", h);
	}, []);
	const text = "VUKA receipt (sandbox): RWF 500,000 sent · fee 0.80% · KES 46,100 delivered · escrow released.";
	async function share() {
		try {
			if (navigator.share) {
				await navigator.share({
					title: "VUKA receipt",
					text
				});
				setMsg("Shared");
			} else {
				await navigator.clipboard.writeText(text);
				setMsg("Copied to clipboard");
			}
		} catch (e) {
			if (e.name !== "AbortError") setMsg("Could not share on this device");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScreenHead, { title: "Receipt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 space-y-3 overflow-hidden p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border p-3 font-mono text-[11px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between border-b border-dashed border-border pb-1.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Settlement receipt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sandbox" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-2 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "Sent"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "RWF 500,000" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "Fee · 0.80%"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "RWF 4,000" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "Escrow"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Released ✓" })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-baseline justify-between border-t border-dashed border-border pt-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivered" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-xl",
							children: "KES 46,100"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void share(),
				className: "flex w-full items-center justify-center gap-2 bg-foreground py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-background",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
					className: "size-3.5",
					"aria-hidden": "true"
				}), "Share receipt"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "status",
				className: "h-4 text-center font-mono text-[10px]",
				children: msg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-dashed border-border p-3 text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
					children: "Add to home screen"
				}), install ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => void install.prompt(),
					className: "mt-2 w-full border border-foreground py-2 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent",
					children: "Install VUKA"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-muted-foreground",
					children: [
						"Open your browser menu and choose",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: "Add to Home screen"
						}),
						". VUKA then opens full-screen, like an app."
					]
				})]
			})
		]
	})] });
}
function DataMeter() {
	const saver = useDataSaver();
	const [kb, setKb] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const measure = () => {
			const nav = performance.getEntriesByType("navigation")[0];
			const res = performance.getEntriesByType("resource");
			const bytes = (nav?.transferSize ?? 0) + res.reduce((a, r) => a + (r.transferSize || 0), 0);
			setKb(bytes > 0 ? Math.round(bytes / 1024) : null);
		};
		measure();
		const id = window.setInterval(measure, 2500);
		return () => window.clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8 border border-border p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
				children: "Light on data"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm",
				children: [
					"This page has transferred",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "tabular font-mono",
						children: kb === null ? "…" : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
					}),
					" ",
					"so far",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "(measured in your browser; development builds are larger than production)"
					}),
					"."
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex cursor-pointer items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked: saver,
					onChange: (e) => setDataSaver(e.target.checked),
					className: "size-4 accent-[var(--color-foreground)]"
				}), "Data saver"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-muted-foreground",
			children: "Data saver skips the interactive globe and its map data. It turns on automatically if your browser sends a Save-Data hint."
		})]
	});
}
/**
* Replaces decorative flag bunting with two factual, static galleries: the regulator each launch
* market answers to, and the kinds of businesses the network is built for. No third-party logos or
* seals are reproduced here — see the independence note below each gallery for why.
*/
var SECTORS = [
	{
		icon: Wheat,
		label: "Agriculture & grain",
		note: "Maize, coffee cherry, grain wholesalers"
	},
	{
		icon: Coffee,
		label: "Coffee & beverages",
		note: "Cooperatives shipping green coffee"
	},
	{
		icon: Shirt,
		label: "Textiles & garments",
		note: "Fabric importers, garment makers"
	},
	{
		icon: Store,
		label: "Wholesale & retail",
		note: "Cross-border stock buyers"
	},
	{
		icon: Truck,
		label: "Logistics & freight",
		note: "Haulage and customs agents"
	},
	{
		icon: Factory,
		label: "Manufacturing",
		note: "Parts, packaging, light industry"
	},
	{
		icon: HardHat,
		label: "Construction materials",
		note: "Cement, steel, hardware"
	},
	{
		icon: Cpu,
		label: "Electronics & hardware",
		note: "Devices, components, spares"
	}
];
function NetworkGallery() {
	const markets = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	}).data?.countries ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-b border-border bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-16 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
				children: "The network in view"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-4xl",
				children: "Real regulators. Real trades. No logos we haven't earned the right to use."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full min-w-0 flex-col border border-border bg-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 border-b border-border px-5 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, {
								className: "size-4",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
								children: "Regulatory landscape, by market"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "min-w-0 divide-y divide-border",
							children: markets.length ? markets.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex min-w-0 items-center gap-2 px-4 py-2.5 text-sm sm:gap-3 sm:px-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
										code: m.code,
										className: "w-6 shrink-0 border border-border"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-16 shrink-0 truncate font-medium sm:w-28",
										children: m.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-muted-foreground",
										children: CENTRAL_BANKS[m.code] ?? "—"
									})
								]
							}, m.code)) : Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { className: "h-10 animate-pulse bg-muted/40" }, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-auto border-t border-border px-5 py-3 text-[11px] text-muted-foreground",
							children: [
								"Named for information only. VUKA holds no licence, partnership or endorsement from any institution listed here — see",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#faq",
									className: "underline underline-offset-4",
									children: "the FAQ"
								}),
								"."
							]
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: 100,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-full min-w-0 flex-col border border-border bg-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-b border-border px-5 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
									children: "Businesses the network is built for"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid flex-1 grid-cols-2 sm:grid-cols-4",
								children: SECTORS.map(({ icon: Icon, label, note }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2 border-l border-t border-border p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
											className: "size-5",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium leading-tight",
											children: label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground",
											children: note
										})
									]
								}, label))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "border-t border-border px-5 py-3 text-[11px] text-muted-foreground",
								children: [
									"Illustrative categories, not customer logos — see",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-foreground",
										children: "Illustrative stories"
									}),
									" below for how a trade in each looks end to end."
								]
							})
						]
					})
				})]
			})]
		})
	});
}
var kicker$1 = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground";
var SCENES = [
	{
		src: "/images/landing/mombasa-port.webp",
		alt: "A container ship leaving the port of Mombasa, Kenya",
		width: 1600,
		height: 1200,
		caption: "Goods are already moving. The money should move as fast.",
		credit: {
			location: "Mombasa, Kenya",
			credit: "Ian Kiptoo",
			license: "CC BY 4.0",
			sourceUrl: "https://commons.wikimedia.org/wiki/File:Container_ship_exiting_Mombasa_port,_Kenya_01.jpg"
		}
	},
	{
		src: "/images/landing/mpesa-agent.webp",
		alt: "A mobile money agent kiosk in Nairobi, Kenya",
		width: 1600,
		height: 1067,
		caption: "Most traders already bank through a phone, not a branch.",
		credit: {
			location: "Nairobi, Kenya",
			credit: "Fiona Graham",
			license: "CC BY-SA 2.0",
			sourceUrl: "https://commons.wikimedia.org/wiki/File:M-PESA_mobile_money_and_Equity_agent,_Nairobi,_Kenya.jpg"
		}
	},
	{
		src: "/images/landing/kenya-coffee.webp",
		alt: "Rows of coffee plants on red volcanic soil near Kiambu County, Kenya",
		width: 1200,
		height: 900,
		caption: "A single harvest can depend on one payment landing on time.",
		credit: {
			location: "Kiambu County, Kenya",
			credit: "Lebu Ayiga",
			license: "CC BY 4.0",
			sourceUrl: "https://commons.wikimedia.org/wiki/File:Coffee_plantation_near_Kawaida_Falls,_Cianda,_Kiambu_County_01.jpg"
		}
	}
];
/** A quiet photographic break between the pitch and the interactive demos — real trade, real places. */
function Scenes() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: kicker$1,
				children: "The trade this is built for"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-4xl",
				children: "Not an abstraction. Ports, markets and phones, across ten countries."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-8 md:grid-cols-3",
				children: SCENES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
					delay: i * 70,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: s.src,
						alt: s.alt,
						width: s.width,
						height: s.height,
						credit: s.credit,
						className: "h-full",
						imgClassName: "aspect-[4/3]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xs text-sm text-muted-foreground",
						children: s.caption
					})]
				}, s.src))
			})]
		})
	});
}
var Accordion = Root2;
var AccordionItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
	ref,
	className: cn("border-b", className),
	...props
}));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
	className: "flex",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Trigger2, {
		ref,
		className: cn("flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })]
	})
}));
AccordionTrigger.displayName = Trigger2.displayName;
var AccordionContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("pb-4 pt-0", className),
		children
	})
}));
AccordionContent.displayName = Content2.displayName;
var kicker = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground";
/** Trust strip directly under the hero: what is enforced by design, in one line each. */
function Principles() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-y border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mx-auto grid gap-px px-4 sm:grid-cols-2 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-4",
			children: [
				["Escrow by contract", "Funds are held by code, not by a person."],
				["Price before commitment", "Fee, rate and delivered amount are shown first."],
				["Double-entry ledger", "Every movement balances or is rejected."],
				["Fail-closed screening", "If a check cannot run, the payment does not."]
			].map(([h, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-3 py-5 lg:px-4 lg:first:pl-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "mt-0.5 size-4 shrink-0",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-medium",
					children: h
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: b
				})] })]
			}, h))
		})
	});
}
function Features() {
	const cell = "border border-border bg-card p-6 transition-colors hover:bg-accent/40";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "features",
		className: "scroll-mt-20 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: kicker,
				children: "What is inside"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
				children: "Everything a trade needs, so nothing has to be improvised."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-12 grid gap-3 md:grid-cols-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-3 md:row-span-2`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Wallets"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-3xl",
								children: "One account, every currency you trade in."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-md text-sm text-muted-foreground",
								children: "Hold balances in the ten launch currencies, top up from mobile money, and see a real-time statement of every movement, each one traceable to a balanced ledger entry."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 font-mono text-xs tracking-[0.08em] text-muted-foreground",
								children: "RWF · KES · UGX · TZS · GHS · NGN · XOF · ETB · ZMW · ZAR"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-3`,
						delay: 60,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Invoices"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-2xl",
								children: "Terms in writing, payable in one tap."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Raise an invoice in your currency; the buyer pays in theirs. Both see the same figures."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-3`,
						delay: 120,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Sanctions and risk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-2xl",
								children: "Screened before money moves."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Payments are screened and limit-checked up front. A failed check blocks the payment, never delays a warning."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-2`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Verification"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-xl",
								children: "Tiered limits"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Start small; raise your limits as you verify. Documents are never uploaded to VUKA, only references."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-2`,
						delay: 60,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Insight"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-xl",
								children: "Live analytics"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Volume, corridors, fees and settlement times, in charts that also come as accessible tables."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
						className: `${cell} md:col-span-2`,
						delay: 120,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: kicker,
								children: "Languages"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-xl",
								children: "Five, and counting"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "English, French, Kiswahili, Portuguese and Kinyarwanda. Translations are first-pass and under native review."
							})
						]
					})
				]
			})]
		})
	});
}
function Markets() {
	const rows = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	}).data?.countries ?? [];
	const groups = Array.from(new Set(rows.map((r) => r.region)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "markets",
		className: "scroll-mt-20 border-t border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: kicker,
					children: "Launch markets"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
					children: "Ten countries, four regions, one continent to grow into."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-2xl text-muted-foreground",
					children: "Each market is served by a named payout rail. All rails run in a sandbox today; going live per rail needs a licence or licensed partner and a signed agreement, and we say so rather than imply otherwise."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4",
				children: groups.map((g, gi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
					delay: gi * 60,
					className: "border border-border bg-card p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: kicker,
						children: REGION_NAMES[g] ?? g
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-border",
						children: rows.filter((r) => r.region === g).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-3 py-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
									code: r.code,
									className: "w-8 shrink-0 self-center shadow-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mr-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-display text-xl leading-none",
										children: r.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-[11px] text-muted-foreground",
										children: r.provider_name
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right font-mono text-xs",
									children: [r.currency, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
										children: "sandbox"
									})]
								})
							]
						}, r.code))
					})]
				}, g))
			})]
		})
	});
}
var STORIES = [
	{
		who: "A grain trader",
		where: "Kigali → Nairobi",
		q: "I used to ship first and hope. Now the money is committed before the truck leaves, and I can show the buyer that it is.",
		tag: "Supplier"
	},
	{
		who: "A garment wholesaler",
		where: "Accra → Lagos",
		q: "The fee was on the screen before I agreed to anything. There was no second number waiting at the end.",
		tag: "Buyer"
	},
	{
		who: "A coffee cooperative",
		where: "Addis Ababa → Kampala",
		q: "When a shipment arrived short, the escrow let the arbiter split the payment fairly. Nobody had to chase anyone.",
		tag: "Dispute"
	}
];
function Stories() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "scroll-mt-20 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: kicker,
					children: "Illustrative stories"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
					children: "Built around the trades people actually make."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-xs text-muted-foreground",
					children: "These are composite scenarios written to show how VUKA is designed to work. They are not testimonials from real customers."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4 md:grid-cols-3",
				children: STORIES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: i * 80,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
						className: "flex h-full flex-col justify-between border border-border p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-hidden": "true",
								className: "font-display text-6xl leading-none text-muted-foreground/40",
								children: "“"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
								className: "-mt-2 font-display text-xl leading-snug",
								children: s.q
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
								className: "mt-6 flex items-end justify-between border-t border-dashed border-border pt-4 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-medium",
									children: s.who
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: s.where
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
									children: s.tag
								})]
							})
						]
					})
				}, s.who))
			})]
		})
	});
}
var ROWS = [
	[
		"Total cost shown before you commit",
		"partial",
		false,
		true
	],
	[
		"Funds held until delivery is confirmed",
		false,
		false,
		true
	],
	[
		"Neutral arbitration for disputes",
		false,
		false,
		true
	],
	[
		"Settles into mobile money",
		false,
		"partial",
		true
	],
	[
		"Auditable, balanced ledger of every step",
		"partial",
		false,
		true
	],
	[
		"Reputation portable across counterparties",
		false,
		false,
		true
	]
];
function Mark({ v }) {
	if (v === true) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
		className: "mx-auto size-4",
		"aria-hidden": "true"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "sr-only",
		children: "Yes"
	})] });
	if (v === "partial") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
		className: "mx-auto size-4 text-muted-foreground",
		"aria-hidden": "true"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "sr-only",
		children: "Sometimes"
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": "true",
			children: "—"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "No"
		})]
	});
}
function Comparison() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: kicker,
					children: "How it compares"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 font-display text-4xl leading-tight sm:text-5xl",
					children: "What changes when the rules are built in."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted-foreground",
					children: "A general comparison of how each approach typically works; individual banks and services vary."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
				className: "mt-8 border border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative overflow-x-auto",
					tabIndex: 0,
					role: "region",
					"aria-label": "Capability comparison table",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[560px] text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
								className: "sr-only",
								children: "Capability comparison"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border font-mono text-[10px] uppercase tracking-[0.16em]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-4 text-left font-normal text-muted-foreground",
										children: "Capability"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-4 font-normal text-muted-foreground",
										children: "Informal / cash"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "p-4 font-normal text-muted-foreground",
										children: "Typical bank wire"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "col",
										className: "bg-foreground p-4 font-normal text-background",
										children: "VUKA"
									})
								]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ROWS.map(([label, a, b, c]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										scope: "row",
										className: "p-4 text-left font-normal",
										children: label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { v: a })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { v: b })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "bg-accent/50 p-4 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { v: c })
									})
								]
							}, label)) })
						]
					})
				})
			})]
		})
	});
}
var FAQ = [
	["Is VUKA live and moving real money?", "No. Every payout rail currently runs in a sandbox with simulated balances. Moving real money requires a licence or licensed partner in each country and signed agreements with each telecom or bank. Nothing on this page claims either."],
	["Who holds the money during an escrow?", "A smart contract on a public blockchain, not VUKA and not the other party. Its rules are fixed: confirmation releases to the supplier, silence refunds the buyer, disputes go to an arbiter, and if the arbiter does not answer anyone can trigger a 50/50 split."],
	["What does it cost?", "A corridor fee of 0.80% inside a regional economic community and 1.20% across regions, shown before you commit. Escrow adds a small protocol fee, capped at 1% by the contract, taken only from an amount paid to a supplier."],
	["Which currencies and countries?", "Ten launch markets (Rwanda, Kenya, Uganda, Tanzania, Ghana, Nigeria, Senegal, Ethiopia, Zambia, South Africa) and their currencies, with any-to-any corridors between them."],
	["What personal data do you keep?", "Your name, phone number, the business details you enter and your transaction history. Identity documents are never uploaded to VUKA; you file a reference from a verification provider or a document hash. See the privacy notice for exactly what is stored in your browser."],
	["How is the trust score calculated?", "From five weighted, ledger-backed factors, each discounted until there is enough evidence. The formula is on this page. No one, including VUKA staff, can edit a score directly."],
	["Can I use it in my language?", "The interface is available in English, French, Kiswahili, Portuguese and Kinyarwanda. Non-English strings are a first pass and are being reviewed by native speakers."],
	["Is it accessible?", "It is built to WCAG 2.1 AA: keyboard operable, screen-reader labelled, reduced-motion aware, with tables behind every chart. We test with automated tooling and welcome reports of anything we missed."]
];
function Faq() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "faq",
		className: "scroll-mt-20 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid gap-10 px-4 py-20 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-[1fr_1.6fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: kicker,
					children: "Questions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 font-display text-4xl leading-tight sm:text-5xl",
					children: "Straight answers, including the uncomfortable ones."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-5 text-sm text-muted-foreground",
					children: [
						"Still unsure?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/about",
							hash: "contact",
							className: "underline underline-offset-4",
							children: "Tell us what you need"
						}),
						"."
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Accordion, {
				type: "single",
				collapsible: true,
				className: "border-t border-border",
				children: FAQ.map(([q, a], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccordionItem, {
					value: `q${i}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionTrigger, {
						className: "py-5 text-left font-display text-xl font-normal hover:no-underline",
						children: q
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionContent, {
						className: "max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground",
						children: a
					})]
				}, q))
			})]
		})
	});
}
function CtaBand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "bg-foreground text-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 lg:px-10 2xl:px-16 md:flex-row md:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.3em] opacity-70",
				children: "Ready when you are"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl",
				children: "Your next cross-border trade can start with a signed quote."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "lg",
					variant: "secondary",
					className: "group rounded-none font-mono text-xs uppercase",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/register",
						children: ["Open a trader account", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
							className: "ml-2 size-4 transition-transform group-hover:translate-x-1",
							"aria-hidden": "true"
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "lg",
					variant: "outline",
					className: "rounded-none border-background bg-transparent font-mono text-xs uppercase text-background hover:bg-background hover:text-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						children: "Sign in"
					})
				})]
			})]
		})
	});
}
var FACTORS = [
	{
		id: "cycles",
		label: "Completed escrow cycles",
		weight: 35,
		denom: 10,
		unit: "cycles",
		hint: "Trades finished without a dispute against you"
	},
	{
		id: "invoices",
		label: "Invoices settled on time",
		weight: 25,
		denom: 5,
		unit: "invoices",
		hint: "Paid within the agreed terms"
	},
	{
		id: "reversals",
		label: "Clean payment record",
		weight: 20,
		denom: 10,
		unit: "payments",
		hint: "Share of payments never reversed"
	},
	{
		id: "volume",
		label: "Trading volume history",
		weight: 10,
		denom: 4,
		unit: "months",
		hint: "Months of steady activity"
	},
	{
		id: "diversity",
		label: "Counterparty diversity",
		weight: 10,
		denom: 5,
		unit: "partners",
		hint: "Distinct businesses you have traded with"
	}
];
function TrustLab() {
	const [quality, setQuality] = (0, import_react.useState)({
		cycles: 90,
		invoices: 90,
		reversals: 95,
		volume: 70,
		diversity: 60
	});
	const [evidence, setEvidence] = (0, import_react.useState)({
		cycles: 4,
		invoices: 2,
		reversals: 4,
		volume: 1,
		diversity: 2
	});
	const rows = FACTORS.map((f) => {
		const conf = Math.min(1, (evidence[f.id] ?? 0) / f.denom);
		return {
			f,
			conf,
			pts: 550 * f.weight * (quality[f.id] ?? 0) * conf / 1e4
		};
	});
	const score = Math.round(300 + rows.reduce((a, r) => a + r.pts, 0));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "trust",
		className: "scroll-mt-20 border-t border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid gap-12 px-4 py-20 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-[1fr_1.2fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
					children: "Trust score lab"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 font-display text-4xl leading-tight sm:text-5xl",
					children: "A reputation you can build, and can read."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-md text-muted-foreground",
					children: "A VUKA trust score runs from 300 to 850. It is computed from five ledger-backed factors, each weighted, and each discounted until there is enough evidence to trust it. One good trade cannot buy a top score. Move the sliders to see how it works."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 border border-foreground p-6",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Your simulated score"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-baseline gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-display text-7xl leading-none",
								children: score
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs uppercase tracking-[0.2em]",
								children: score >= 750 ? "Excellent" : score >= 650 ? "Strong" : score >= 550 ? "Building" : "New"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative mt-5 h-2 border border-foreground",
							role: "img",
							"aria-label": `Score ${score} on a 300 to 850 scale`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-foreground transition-[width] duration-500",
								style: { width: `${(score - 300) / 550 * 100}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex justify-between font-mono text-[10px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "300" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "850" })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs text-muted-foreground",
					children: "Illustration of the published formula. A real score is computed by the engine from your own ledger history."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
				delay: 100,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-5",
					children: rows.map(({ f, conf, pts }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "border border-border bg-card p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", {
								className: "px-1 font-mono text-[10px] uppercase tracking-[0.16em]",
								children: [
									f.label,
									" · weight ",
									f.weight,
									"%"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: f.hint
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Quality" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "tabular font-mono",
											children: [quality[f.id], "%"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 0,
										max: 100,
										value: quality[f.id],
										onChange: (e) => setQuality({
											...quality,
											[f.id]: Number(e.target.value)
										}),
										className: "mt-1 w-full accent-[var(--color-foreground)]"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Evidence (",
											f.unit,
											")"
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "tabular font-mono",
											children: [
												evidence[f.id],
												" / ",
												f.denom
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 0,
										max: f.denom + 4,
										value: evidence[f.id],
										onChange: (e) => setEvidence({
											...evidence,
											[f.id]: Number(e.target.value)
										}),
										className: "mt-1 w-full accent-[var(--color-foreground)]"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"confidence ",
										(conf * 100).toFixed(0),
										"%"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-1.5 flex-1 border border-border",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block h-full bg-foreground transition-[width]",
											style: { width: `${pts / (550 * f.weight / 100) * 100}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular text-foreground",
										children: [
											"+",
											pts.toFixed(0),
											" pts"
										]
									})
								]
							})
						]
					}, f.id))
				})
			})]
		})
	});
}
var Atlas = (0, import_react.lazy)(() => import("./atlas-xw1xdonv.mjs").then((m) => ({ default: m.Atlas })));
/** Public landing page shown to signed-out visitors. */
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				id: "main",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Principles, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scenes, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Journey, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Estimator, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EscrowLab, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Features, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustLab, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkGallery, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
						fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-[900px] border-t border-border bg-muted/30",
							"aria-hidden": "true"
						}),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Atlas, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markets, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frameworks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stories, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comparison, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CtaBand, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
/** Must match the wording the engine computes in handleAcknowledgeReconciliationAlert. */
function alertMessage(s) {
	const errs = s.metrics.Errors;
	return errs > 0 ? `The worker has reported ${errs} error${errs === 1 ? "" : "s"}.` : `Indexing is behind by ${s.lag_blocks} finalized blocks.`;
}
function OperatorCockpit() {
	const me = useOperator();
	const qc = useQueryClient();
	const [scope, setScope] = useChainScope();
	const ready = scopeReady(scope);
	const status = useQuery({
		queryKey: ["recon-status", scope],
		queryFn: () => operator.reconciliationStatus(scope),
		enabled: ready,
		refetchInterval: 15e3,
		retry: false
	});
	const escrows = useQuery({
		queryKey: ["escrows", scope],
		queryFn: () => operator.escrows(scope),
		enabled: ready,
		refetchInterval: 3e4,
		retry: false
	});
	const providers = useQuery({
		queryKey: ["providers"],
		queryFn: corridors.providers,
		refetchInterval: 3e4
	});
	const policy = useQuery({
		queryKey: ["settlements"],
		queryFn: () => settlements.list()
	});
	const pilotList = useQuery({
		queryKey: ["pilots"],
		queryFn: pilots.list
	});
	const platformStats = useQuery({
		queryKey: [
			"analytics",
			"platform",
			30
		],
		queryFn: () => operator.analytics(30),
		staleTime: 6e4,
		retry: false
	});
	const ack = useMutation({
		mutationFn: (s) => operator.ackAlert(scope, s.alert_level, alertMessage(s)),
		onSuccess: () => {
			toast.success("Alert acknowledged");
			qc.invalidateQueries({ queryKey: ["recon-status"] });
		},
		onError: (e) => toast.error("Could not acknowledge", { description: describeError(e) })
	});
	const sums = {
		locked: 0,
		released: 0,
		refunded: 0,
		disputed: 0,
		split: 0
	};
	for (const e of escrows.data ?? []) {
		const v = tokenUnits(e.amount);
		if (e.state === "LOCKED" || e.state === "CREATED") sums.locked += v;
		else if (e.state === "RELEASED") sums.released += v;
		else if (e.state === "REFUNDED") sums.refunded += v;
		else if (e.state === "SPLIT") sums.split += v;
		else sums.disputed += v;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Executive operations",
			title: "Settlement Cockpit",
			description: `Signed in as ${me.email} (${me.role}). Chain reconciliation, escrow exposure, provider readiness and the settlement safety policy in one view.`,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				className: "rounded-none font-mono text-xs uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/escrow",
					children: "Escrow register"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "rounded-none font-mono text-xs uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/disputes",
					children: "Dispute tribunal"
				})
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainScopeBar, {
			scope,
			onChange: setScope
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Escrow locked",
					value: ready ? money(sums.locked) : "—",
					sub: "Token units in contract"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Released",
					value: ready ? money(sums.released) : "—",
					sub: "Paid to suppliers"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Refunded",
					value: ready ? money(sums.refunded) : "—",
					sub: "Returned to buyers"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Disputed / frozen",
					value: ready ? money(sums.disputed) : "—",
					sub: "Under arbiter control"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Network pulse · last 30 days",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "h-7 rounded-none font-mono text-[10px] uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/analytics",
					children: "Network intelligence"
				})
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: platformStats,
				disabledCodes: ["analytics_unavailable"],
				children: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 lg:grid-cols-[220px_1fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge$1, {
							value: r.totals.success_rate,
							label: "Settlement success",
							sub: `${r.totals.succeeded} settled · ${r.totals.failed} failed`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Settled volume",
							value: usd0(r.totals.volume_usd),
							trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: r.daily.map((d) => d.out_usd) })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyTrendChart, {
						data: r.daily.map((d) => ({
							label: d.date.slice(5),
							a: d.out_usd
						})),
						aName: "Settled volume",
						ariaLabel: "Settled volume per day, USD equivalent",
						format: usd0
					})]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Chain reconciliation",
				className: "lg:col-span-2",
				meta: status.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					tone: status.data.alert_level === "ok" ? "invert" : "warn",
					children: status.data.alert_level
				}) : null,
				children: !ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { children: "Enter the escrow contract above to see reconciliation status." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: status,
					disabledCodes: ["reconciliation_disabled"],
					children: (s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid gap-2 font-mono text-xs sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Cursor (indexed to)",
									v: String(s.cursor)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Latest block",
									v: String(s.latest_block)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Finalized block",
									v: String(s.finalized_block)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Lag (blocks)",
									v: `${s.lag_blocks} (warn ${s.warning_lag_blocks} / crit ${s.critical_lag_blocks})`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Polls",
									v: `${s.metrics.SuccessfulPolls}/${s.metrics.Polls}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Events applied",
									v: String(s.metrics.EventsApplied)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Worker errors",
									v: String(s.metrics.Errors)
								})
							]
						}), s.alert_level !== "ok" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-mono text-[10px] uppercase tracking-[0.2em]",
										children: [s.alert_level, " alert"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: alertMessage(s)
									}),
									s.acknowledged_by ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-muted-foreground",
										children: [
											"Acknowledged by ",
											s.acknowledged_by,
											" · ",
											when(s.acknowledged_at)
										]
									}) : null
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								className: "rounded-none font-mono text-[10px] uppercase",
								disabled: ack.isPending,
								onClick: () => ack.mutate(s),
								children: "Acknowledge"
							})]
						}) : null]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Settlement safety",
					meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: "live",
						children: "Read-only"
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
						query: policy,
						children: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "space-y-2 font-mono text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Global kill switch",
									v: p.policy.GlobalKillSwitch ? "ACTIVE" : "off"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Live execution",
									v: p.policy.ExecutionEnabled ? "enabled" : "disabled"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Approvals required",
									v: String(p.policy.RequiredApprovals)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Per-command cap",
									v: money(p.policy.MaxAmountMinor / 100)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Pending commands",
									v: String(p.commands.filter((c) => c.status === "pending").length)
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[11px] text-muted-foreground",
						children: "The kill switch is deployment configuration (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH). It cannot be toggled from the browser by design."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Providers & pilots",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
						query: providers,
						children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "space-y-2 font-mono text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Providers healthy",
								v: `${rows.filter((r) => r.healthy).length}/${rows.length}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Providers halted",
								v: String(rows.filter((r) => r.config.kill_switch).length)
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
							query: pilotList,
							children: (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "space-y-2 font-mono text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Active pilots",
									v: String(p.pilots.filter((x) => x.status === "active").length)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Observation only",
									v: p.observationOnly ? "yes" : "no"
								})]
							})
						})
					})]
				})]
			})]
		})
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
function TraderHome() {
	const trader = useTrader();
	const qc = useQueryClient();
	const wallet = useWallet();
	const transfers = useTransfers();
	const notifications = useNotifications();
	const ownIds = (0, import_react.useMemo)(() => new Set(wallet.data?.accounts.map((a) => a.id) ?? []), [wallet.data]);
	const unread = (notifications.data ?? []).filter((n) => !n.read_at);
	const markRead = useMutation({
		mutationFn: (id) => support.markRead(id, trader.id),
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
		onError: (e) => toast.error(describeError(e))
	});
	const analytics = useQuery({
		queryKey: [
			"analytics",
			"trader",
			30
		],
		queryFn: () => platform.analytics(30),
		staleTime: 6e4
	});
	const verified = trader.kyc_status === "VERIFIED" || trader.kyc_status === "APPROVED";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Trader overview",
			title: `Welcome, ${trader.full_name}`,
			description: "Your business and personal money, kept apart. Send payments across corridors, issue invoices, and follow every settlement to the ledger.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				className: "rounded-none font-mono text-xs uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/escrow",
					children: "Invoices"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "rounded-none font-mono text-xs uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/send",
					children: "Send payment"
				})
			})] })
		}),
		!verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-mono text-[10px] uppercase tracking-[0.2em]",
				children: ["Verification ", trader.kyc_status.toLowerCase()]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-xs text-muted-foreground",
				children: "Your account is not yet verified. Higher limits and new counterparties require a completed identity check by the compliance team."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "rounded-none font-mono text-[10px] uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/support",
					children: "Request verification"
				})
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: wallet,
			children: (w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					w.accounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: `${a.type === "BUSINESS" ? "Business trade" : "Personal"} wallet`,
						value: money(w.balances[a.id]?.amount ?? 0, a.currency),
						sub: "Derived from ledger postings"
					}, a.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Verification",
						value: trader.kyc_status,
						sub: trader.phone_number
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Unread notices",
						value: unread.length,
						sub: "From settlements and support"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Last 30 days",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "h-7 rounded-none font-mono text-[10px] uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/analytics",
					children: "Open insights"
				})
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: analytics,
				disabledCodes: ["analytics_unavailable"],
				children: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Sent",
								value: usd0(r.totals.sent_usd),
								trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: r.daily.map((d) => d.out_usd) })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Received",
								value: usd0(r.totals.received_usd),
								trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: r.daily.map((d) => d.in_usd) })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Success rate",
								value: `${Math.round(r.totals.success_rate * 100)}%`,
								sub: `${r.totals.succeeded} of ${r.totals.succeeded + r.totals.failed + r.totals.reversed} finished`
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyTrendChart, {
						data: r.daily.map((d) => ({
							label: d.date.slice(5),
							a: d.out_usd,
							b: d.in_usd
						})),
						aName: "Money out",
						bName: "Money in",
						ariaLabel: "Money in and out per day, USD equivalent",
						format: usd0
					})]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Recent activity",
				className: "lg:col-span-2",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "h-7 rounded-none font-mono text-[10px] uppercase",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/wallets",
						children: "All transfers"
					})
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: transfers,
					isEmpty: (d) => d.length === 0,
					empty: "No transfers yet. Top up your business wallet to get started.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border/60",
						children: rows.slice(0, 6).map((t) => {
							const dir = directionFor(t, ownIds);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-wrap items-center justify-between gap-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-mono text-xs",
									children: [
										dir === "out" ? "Sent" : dir === "in" ? "Received" : "Internal",
										" ·",
										" ",
										shortId(t.id),
										t.invoice_number ? ` · ${t.invoice_number}` : ""
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: when(t.created_at)
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-sm tabular-nums",
										children: [dir === "out" ? "−" : dir === "in" ? "+" : "", money(t.amount, t.currency)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: t.status === "SUCCESS" ? "invert" : t.status === "FAILED" || t.status === "REVERSED" ? "warn" : "live",
										children: t.status
									})]
								})]
							}, t.id);
						})
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Notifications",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [unread.length, " unread"] }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: notifications,
					isEmpty: (d) => d.length === 0,
					empty: "Nothing to report.",
					disabledCodes: ["support_unavailable"],
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border/60",
						children: rows.slice(0, 6).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: n.read_at ? "text-sm text-muted-foreground" : "text-sm font-medium",
										children: n.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-xs text-muted-foreground",
										children: n.body
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 font-mono text-[10px] text-muted-foreground",
										children: when(n.created_at)
									})
								] }), !n.read_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									className: "h-6 rounded-none px-2 font-mono text-[10px] uppercase",
									disabled: markRead.isPending,
									onClick: () => markRead.mutate(n.id),
									children: "Read"
								}) : null]
							})
						}, n.id))
					})
				})
			})]
		})
	] });
}
/** Signed-out visitors get the public landing page; signed-in users get their workspace. */
function Home() {
	const { session } = useSession();
	if (session.status === "anon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ByRole, {}) });
}
function ByRole() {
	const { session } = useSession();
	return session.status === "operator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperatorCockpit, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TraderHome, {});
}
//#endregion
export { Home as component };
