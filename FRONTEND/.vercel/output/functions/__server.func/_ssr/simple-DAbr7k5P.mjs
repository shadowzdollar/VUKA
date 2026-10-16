import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { A as Info, o as TriangleAlert } from "../_libs/lucide-react.mjs";
import { d as cn } from "./dropdown-menu-WnKjXFQ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/simple-DAbr7k5P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PERIODS = [
	7,
	30,
	90,
	365
];
var usd0 = (n) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
var usdCompact = (n) => `$${n.toLocaleString("en-US", {
	notation: "compact",
	maximumFractionDigits: 1
})}`;
/** Accessible segmented control (a radio group) for the reporting period. */
function PeriodPicker({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "radiogroup",
		"aria-label": "Reporting period",
		className: "inline-flex border border-border",
		children: PERIODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "radio",
			"aria-checked": value === p,
			onClick: () => onChange(p),
			className: cn("px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors", value === p ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"),
			children: p === 365 ? "1y" : `${p}d`
		}, p))
	});
}
function InsightList({ items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid gap-3 md:grid-cols-2",
		children: items.map((i) => {
			const Icon = i.tone === "watch" ? TriangleAlert : Info;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: cn("flex gap-3 p-4", i.tone === "watch" ? "border-2 border-foreground" : "border border-border"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "mt-0.5 size-4 shrink-0",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm font-medium",
					children: [i.title, i.tone === "watch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: " (worth attention)"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: i.body
				})] })]
			}, i.title);
		})
	});
}
/**
* Lightweight (no chart library) visual primitives. All monochrome: value is encoded by length,
* opacity or position, and every mark has a text equivalent, so nothing depends on colour.
*/
/** Inline trend line for KPI cards. Purely decorative: the number beside it carries the meaning. */
function Sparkline({ values, className }) {
	if (values.length < 2) return null;
	const max = Math.max(...values, 1e-9);
	const min = Math.min(...values, 0);
	const span = max - min || 1;
	const w = 100;
	const h = 28;
	const pts = values.map((v, i) => `${i / (values.length - 1) * w},${26 - (v - min) / span * 24}`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		preserveAspectRatio: "none",
		"aria-hidden": "true",
		className: cn("h-7 w-full", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			points: pts.join(" "),
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.5",
			vectorEffect: "non-scaling-stroke"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			points: `0,${h} ${pts.join(" ")} ${w},${h}`,
			fill: "currentColor",
			opacity: "0.08"
		})]
	});
}
/** Semicircular gauge for a 0..1 ratio (success rate, limit usage). */
function Gauge$1({ value, label, sub }) {
	const v = Math.max(0, Math.min(1, value));
	const c = Math.PI * 42;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0 text-center",
		role: "img",
		"aria-label": `${label}: ${Math.round(v * 100)}%`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 100 58",
				className: "mx-auto w-full max-w-[200px]",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M8 50 A42 42 0 0 1 92 50",
						fill: "none",
						stroke: "var(--color-border)",
						strokeWidth: "9"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M8 50 A42 42 0 0 1 92 50",
						fill: "none",
						stroke: "var(--color-foreground)",
						strokeWidth: "9",
						strokeDasharray: `${v * c} ${c}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
						x: "50",
						y: "46",
						textAnchor: "middle",
						className: "fill-foreground font-mono text-[15px]",
						children: [Math.round(v * 100), "%"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
				className: "-mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
				children: label
			}),
			sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-muted-foreground",
				children: sub
			}) : null
		]
	});
}
/** Ranked horizontal bars (top counterparties, provider reliability, workflow states...). */
function RankedBars({ items, ariaLabel, empty = "No data in this period." }) {
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: empty
	});
	const max = Math.max(...items.map((i) => i.value), 1e-9);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		"aria-label": ariaLabel,
		children: items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 truncate",
					children: i.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular shrink-0 font-mono text-xs",
					children: i.display ?? i.value
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 h-1.5 w-full bg-muted",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-foreground",
					style: { width: `${i.value / max * 100}%` }
				})
			}),
			i.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 text-[11px] text-muted-foreground",
				children: i.note
			}) : null
		] }, i.label))
	});
}
/** Stage funnel: each row's bar is relative to the first stage. */
function Funnel({ stages, ariaLabel }) {
	const top = Math.max(stages[0]?.count ?? 0, 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "space-y-2",
		"aria-label": ariaLabel,
		children: stages.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-32 shrink-0 text-xs text-muted-foreground",
					children: s.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-6 flex-1 bg-muted",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-full items-center bg-foreground px-2 font-mono text-[10px] text-background",
						style: {
							width: `${Math.max(s.count / top * 100, 4)}%`,
							opacity: 1 - i * .18
						},
						children: s.count
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: s.count
				})
			]
		}, s.label))
	});
}
var DAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];
/** Weekday x hour activity heatmap; opacity encodes volume and each cell has a text label. */
function ActivityHeatmap({ grid }) {
	const id = (0, import_react.useId)();
	const max = Math.max(1, ...grid.flat());
	if (grid.flat().reduce((a, b) => a + b, 0) === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "No activity in this period."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-labelledby": id,
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-[520px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-9 grid grid-cols-24 gap-px",
					style: { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" },
					"aria-hidden": "true",
					children: Array.from({ length: 24 }, (_, h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-center font-mono text-[9px] text-muted-foreground",
						children: h % 3 === 0 ? h : ""
					}, h))
				}), grid.map((row, d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-px flex items-center gap-1",
					"aria-hidden": "true",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-8 shrink-0 font-mono text-[10px] text-muted-foreground",
						children: DAYS[d]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid flex-1 gap-px",
						style: { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" },
						children: row.map((n, h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							title: `${DAYS[d]} ${String(h).padStart(2, "0")}:00 UTC — ${n} payment${n === 1 ? "" : "s"}`,
							className: "aspect-square border border-border/60 bg-foreground",
							style: { opacity: n === 0 ? .03 : .15 + n / max * .85 }
						}, h))
					})]
				}, DAYS[d]))]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			id,
			className: "mt-2 text-[11px] text-muted-foreground",
			children: [
				"Payments by weekday and hour (UTC). Busiest slot: ",
				busiest(grid),
				"."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: "Payments by weekday and hour (UTC)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: "Weekday"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: "Hours with activity"
					})] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: grid.map((row, d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "row",
						children: DAYS[d]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.map((n, h) => n ? `${h}:00 ×${n}` : null).filter(Boolean).join(", ") || "none" })] }, DAYS[d])) })
				]
			})
		})
	] });
}
function busiest(grid) {
	let best = {
		d: 0,
		h: 0,
		n: 0
	};
	grid.forEach((row, d) => row.forEach((n, h) => n > best.n && (best = {
		d,
		h,
		n
	})));
	return best.n === 0 ? "—" : `${DAYS[best.d]} ${String(best.h).padStart(2, "0")}:00 (${best.n})`;
}
/**
* Quantised shading steps chosen so the label stays >= 4.5:1 against the cell in both themes:
* light steps carry foreground text, dark steps flip to background text. No mid-tone in between.
*/
function shade(frac) {
	if (frac < .34) return {
		pct: 10,
		light: true
	};
	if (frac < .5) return {
		pct: 25,
		light: true
	};
	if (frac < .67) return {
		pct: 38,
		light: true
	};
	if (frac < .85) return {
		pct: 72,
		light: false
	};
	return {
		pct: 86,
		light: false
	};
}
/** Currency-to-currency flow matrix (heatmap table). Rows = source, columns = destination. */
function FlowMatrix({ flows, format }) {
	if (flows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "No cross-currency payments in this period."
	});
	const cur = Array.from(new Set(flows.flatMap((f) => [f.from, f.to]))).sort();
	const cell = new Map(flows.map((f) => [`${f.from}>${f.to}`, f]));
	const max = Math.max(...flows.map((f) => f.volume_usd), 1e-9);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full border-collapse text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
					className: "sr-only",
					children: "Payment volume by source currency (rows) and destination currency (columns), in USD equivalent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					scope: "col",
					className: "p-1.5 text-left font-mono text-[10px] font-normal text-muted-foreground",
					children: "from ↓ / to →"
				}), cur.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					scope: "col",
					className: "p-1.5 font-mono text-[10px] font-normal text-muted-foreground",
					children: c
				}, c))] }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: cur.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					scope: "row",
					className: "p-1.5 text-left font-mono text-[10px] font-normal text-muted-foreground",
					children: r
				}), cur.map((c) => {
					const f = cell.get(`${r}>${c}`);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border border-border/60 p-0",
						children: f ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("flex h-10 min-w-[52px] items-center justify-center font-mono text-[10px]", shade(f.volume_usd / max).light ? "text-foreground" : "text-background"),
							style: { background: `color-mix(in oklab, var(--color-foreground) ${shade(f.volume_usd / max).pct}%, var(--color-background))` },
							title: `${r} → ${c}: ${format(f.volume_usd)} in ${f.count} payment${f.count === 1 ? "" : "s"}`,
							children: format(f.volume_usd)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-10 text-center leading-10 text-muted-foreground/40",
							"aria-label": "none",
							children: "·"
						})
					}, c);
				})] }, r)) })
			]
		})
	});
}
//#endregion
export { InsightList as a, Sparkline as c, usdCompact as d, Gauge$1 as i, busiest as l, FlowMatrix as n, PeriodPicker as o, Funnel as r, RankedBars as s, ActivityHeatmap as t, usd0 as u };
