import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { _ as Tooltip, a as YAxis, c as CartesianGrid, d as Pie, f as PolarAngleAxis, g as ResponsiveContainer, h as Cell, i as BarChart, l as Bar, m as PolarGrid, n as RadarChart, o as XAxis, p as PolarRadiusAxis, r as PieChart, s as Area, t as AreaChart, u as Radar, v as Legend } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/charts-DvNhaamZ.js
var import_jsx_runtime = require_jsx_runtime();
var axis = {
	fontSize: 11,
	fill: "var(--color-muted-foreground)"
};
function tooltipStyle() {
	return {
		background: "var(--color-popover)",
		border: "1px solid var(--color-border)",
		borderRadius: 0,
		color: "var(--color-foreground)",
		fontSize: 12
	};
}
function FlowChart({ data, currencyLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-label": `Money in and out by week, in ${currencyLabel}`,
			className: "h-56 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						accessibilityLayer: false,
						data,
						margin: {
							top: 8,
							right: 8,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "label",
								tick: axis,
								tickLine: false,
								axisLine: { stroke: "var(--color-border)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: axis,
								tickLine: false,
								axisLine: false,
								width: 56,
								tickFormatter: (v) => v.toLocaleString("en-US", { notation: "compact" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: tooltipStyle(),
								cursor: { fill: "var(--color-accent)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "in",
								name: "Money in",
								fill: "var(--chart-1)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "out",
								name: "Money out",
								fill: "var(--chart-4)",
								stroke: "var(--chart-1)"
							})
						]
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("caption", { children: [
						"Money in and out by week (",
						currencyLabel,
						")"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Week"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "In"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Out"
						})
					] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "row",
							children: d.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.in }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.out })
					] }, d.label)) })
				]
			})
		})]
	});
}
function StateChart({ data }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-label": "Escrow value by state",
			className: "h-56 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						accessibilityLayer: false,
						data,
						layout: "vertical",
						margin: {
							top: 4,
							right: 12,
							left: 8,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								horizontal: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								type: "number",
								tick: axis,
								tickLine: false,
								axisLine: { stroke: "var(--color-border)" },
								tickFormatter: (v) => v.toLocaleString("en-US", { notation: "compact" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								type: "category",
								dataKey: "state",
								tick: axis,
								tickLine: false,
								axisLine: false,
								width: 84
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: tooltipStyle(),
								cursor: { fill: "var(--color-accent)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "amount",
								name: "Token units",
								fill: "var(--chart-1)"
							})
						]
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: "Escrow value by state" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: "State"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: "Amount"
					})] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "row",
						children: d.state
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.amount })] }, d.state)) })
				]
			})
		})]
	});
}
var TONES = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)"
];
/** Groups everything past the 4th slice into "Other" so five tones stay distinguishable. */
function topSlices(data) {
	const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
	if (sorted.length <= 5) return sorted;
	const rest = sorted.slice(4).reduce((s, d) => s + d.value, 0);
	return [...sorted.slice(0, 4), {
		label: "Other",
		value: rest
	}];
}
function DonutChart({ data, ariaLabel, center, format }) {
	const slices = topSlices(data);
	const total = slices.reduce((s, d) => s + d.value, 0);
	if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "No data in this period."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0 grid items-center gap-4 sm:grid-cols-[180px_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "img",
			"aria-label": ariaLabel,
			className: "relative mx-auto h-44 w-44",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, {
						accessibilityLayer: false,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
							rootTabIndex: -1,
							data: slices,
							dataKey: "value",
							nameKey: "label",
							innerRadius: "62%",
							outerRadius: "94%",
							paddingAngle: 1,
							stroke: "var(--color-background)",
							strokeWidth: 2,
							isAnimationActive: false,
							children: slices.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: TONES[i % TONES.length] }, i))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							contentStyle: tooltipStyle(),
							formatter: (v) => format(v)
						})]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular font-mono text-lg leading-none",
					children: center.value
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground",
					children: center.label
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5 text-sm",
			children: slices.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						className: "inline-block size-3 shrink-0 border border-foreground",
						style: { background: TONES[i % TONES.length] }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate",
						children: d.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular font-mono text-xs",
						children: format(d.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular w-10 text-right font-mono text-[11px] text-muted-foreground",
						children: [Math.round(d.value / total * 100), "%"]
					})
				]
			}, d.label))
		}) })]
	});
}
function HistogramChart({ data, ariaLabel, unit = "payments" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-label": ariaLabel,
			className: "h-56 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						accessibilityLayer: false,
						data,
						margin: {
							top: 8,
							right: 8,
							left: 0,
							bottom: 0
						},
						barCategoryGap: 2,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "label",
								tick: axis,
								tickLine: false,
								axisLine: { stroke: "var(--color-border)" },
								interval: 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: axis,
								tickLine: false,
								axisLine: false,
								width: 32,
								allowDecimals: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: tooltipStyle(),
								cursor: { fill: "var(--color-accent)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "count",
								name: unit,
								fill: "var(--chart-1)",
								isAnimationActive: false
							})
						]
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: ariaLabel }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: "Range"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "col",
						children: unit
					})] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						scope: "row",
						children: d.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.count })] }, d.label)) })
				]
			})
		})]
	});
}
function TrendChart({ data, ariaLabel, aName, bName, format }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-label": ariaLabel,
			className: "h-64 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
						accessibilityLayer: false,
						data,
						margin: {
							top: 8,
							right: 8,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "label",
								tick: axis,
								tickLine: false,
								axisLine: { stroke: "var(--color-border)" },
								minTickGap: 28
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: axis,
								tickLine: false,
								axisLine: false,
								width: 52,
								tickFormatter: (v) => v.toLocaleString("en-US", { notation: "compact" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: tooltipStyle(),
								formatter: (v) => format(v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "monotone",
								dataKey: "a",
								name: aName,
								stroke: "var(--chart-1)",
								strokeWidth: 2,
								fill: "var(--chart-1)",
								fillOpacity: .14,
								isAnimationActive: false
							}),
							bName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "monotone",
								dataKey: "b",
								name: bName,
								stroke: "var(--chart-3)",
								strokeWidth: 2,
								strokeDasharray: "5 3",
								fill: "var(--chart-3)",
								fillOpacity: .1,
								isAnimationActive: false
							}) : null
						]
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: ariaLabel }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Date"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: aName
						}),
						bName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: bName
						}) : null
					] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "row",
							children: d.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.a }),
						bName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: d.b ?? 0 }) : null
					] }, d.label)) })
				]
			})
		})]
	});
}
function RadarView({ data, ariaLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "m-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "img",
			"aria-label": ariaLabel,
			className: "h-72 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadarChart, {
						accessibilityLayer: false,
						data,
						outerRadius: "72%",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarGrid, { stroke: "var(--color-border)" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarAngleAxis, {
								dataKey: "axis",
								tick: {
									fontSize: 11,
									fill: "var(--color-muted-foreground)"
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarRadiusAxis, {
								angle: 90,
								domain: [0, 100],
								tick: false,
								axisLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, {
								name: "Potential",
								dataKey: "potential",
								stroke: "var(--chart-3)",
								strokeDasharray: "4 3",
								fill: "var(--chart-3)",
								fillOpacity: .08,
								isAnimationActive: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, {
								name: "Current",
								dataKey: "value",
								stroke: "var(--chart-1)",
								strokeWidth: 2,
								fill: "var(--chart-1)",
								fillOpacity: .25,
								isAnimationActive: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: tooltipStyle() })
						]
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sr-only",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "sr-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: ariaLabel }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Factor"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Current"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							children: "Potential"
						})
					] }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "row",
							children: d.axis
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: Math.round(d.value) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: Math.round(d.potential) })
					] }, d.axis)) })
				]
			})
		})]
	});
}
//#endregion
export { DonutChart, FlowChart, HistogramChart, RadarView, StateChart, TrendChart };
