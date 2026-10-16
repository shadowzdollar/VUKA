import { i as __toESM } from "../_runtime.mjs";
import { f as operator, m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { r as useSession } from "./session-DisxoMRQ.mjs";
import { c as Metric, d as Shell, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { a as InsightList, c as Sparkline, d as usdCompact, i as Gauge$1, l as busiest, n as FlowMatrix, o as PeriodPicker, r as Funnel, s as RankedBars, t as ActivityHeatmap, u as usd0 } from "./simple-DAbr7k5P.mjs";
import { a as LazyTrendChart, n as LazyHistogramChart, t as LazyDonutChart } from "./lazy-charts-CUzwBwkB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-h7G9af5b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var usd = (n) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
var pct = (n) => `${Math.round(n * 100)}%`;
/**
* Plain-language observations derived deterministically from a report. Each statement quotes the
* figures it is based on, so a reader can verify it against the charts.
*/
function buildInsights(r) {
	const t = r.totals;
	const out = [];
	if (t.payments === 0) return [{
		title: "No payments in this period",
		body: "Once payments settle, this page shows volume trends, corridor usage and reliability. Send a payment or widen the period to see data.",
		tone: "info"
	}];
	const half = Math.floor(r.daily.length / 2);
	const sum = (days) => days.reduce((s, d) => s + d.out_usd + d.in_usd, 0);
	const first = sum(r.daily.slice(0, half));
	const second = sum(r.daily.slice(half));
	if (first > 0 && second > 0) {
		const change = (second - first) / first;
		out.push({
			title: change >= 0 ? "Volume is growing" : "Volume is slowing",
			body: `The second half of the period moved ${usd(second)} against ${usd(first)} in the first half (${change >= 0 ? "+" : ""}${Math.round(change * 100)}%).`,
			tone: change < -.25 ? "watch" : "info"
		});
	}
	const finished = t.succeeded + t.failed + t.reversed;
	if (finished >= 5) {
		const bad = t.failed + t.reversed;
		out.push({
			title: t.success_rate >= .9 ? "Reliable settlement" : "Settlement reliability needs attention",
			body: `${t.succeeded} of ${finished} finished payments settled (${pct(t.success_rate)}); ${bad} failed or were reversed.`,
			tone: t.success_rate >= .9 ? "info" : "watch"
		});
	}
	const top = r.counterparties?.[0];
	if (top && t.volume_usd > 0) {
		const share = top.volume_usd / t.volume_usd;
		if (share >= .5) out.push({
			title: "Concentrated on one counterparty",
			body: `${top.name} accounts for ${pct(share)} of your settled volume. Spreading activity across partners also strengthens your trust score.`,
			tone: "watch"
		});
	}
	if (t.succeeded > 0) {
		const share = t.cross_currency_payments / t.succeeded;
		out.push({
			title: share > 0 ? "Cross-border share" : "All activity is domestic",
			body: share > 0 ? `${pct(share)} of settled payments crossed a currency border${r.corridors[0] ? `, led by ${r.corridors[0].from} → ${r.corridors[0].to} (${usd(r.corridors[0].volume_usd)})` : ""}.` : "No settled payment crossed a currency border in this period.",
			tone: "info"
		});
		out.push({
			title: "Typical payment size",
			body: `The average settled payment is ${usd(t.avg_payment_usd)}; the largest was ${usd(t.largest_payment_usd)}.`,
			tone: "info"
		});
	}
	const slot = busiest(r.heatmap);
	if (slot !== "—") out.push({
		title: "Busiest time",
		body: `Most activity happens on ${slot} UTC.`,
		tone: "info"
	});
	return out;
}
function ByRole() {
	const { session } = useSession();
	return session.status === "operator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Intelligence, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Insights, {});
}
var monthDay = (iso) => iso.slice(5);
function Trend({ r, aName, bName }) {
	const data = r.daily.map((d) => ({
		label: monthDay(d.date),
		a: d.out_usd,
		...bName ? { b: d.in_usd } : {}
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyTrendChart, {
		data,
		aName,
		...bName ? { bName } : {},
		ariaLabel: `${aName}${bName ? ` and ${bName}` : ""} per day, USD equivalent`,
		format: usd0
	});
}
function Basis({ r }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-[11px] text-muted-foreground",
		children: [
			"Figures are USD-equivalent at the platform's ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono",
				children: r.rate_basis
			}),
			" ",
			"reference rates, over the last ",
			r.period_days,
			" days, counting settled payments between traders. Generated ",
			new Date(r.generated_at).toLocaleString(),
			"."
		]
	});
}
function Insights() {
	const [days, setDays] = (0, import_react.useState)(30);
	const q = useQuery({
		queryKey: [
			"analytics",
			"trader",
			days
		],
		queryFn: () => platform.analytics(days),
		staleTime: 6e4
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Insights",
		title: "Your trade, in numbers",
		description: "How money moves through your business: trends, where it goes, how reliably it settles and when you are most active. Everything is computed from your own ledger history.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeriodPicker, {
			value: days,
			onChange: setDays
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
		query: q,
		disabledCodes: ["analytics_unavailable"],
		children: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TraderBody, { r })
	})] });
}
function TraderBody({ r }) {
	const t = r.totals;
	const insights = (0, import_react.useMemo)(() => buildInsights(r), [r]);
	const outSeries = r.daily.map((d) => d.out_usd);
	const inSeries = r.daily.map((d) => d.in_usd);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Sent",
					value: usd0(t.sent_usd),
					sub: `${t.payments_out} payments`,
					trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: outSeries })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Received",
					value: usd0(t.received_usd),
					sub: `${t.payments_in} payments`,
					trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: inSeries })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Average payment",
					value: usd0(t.avg_payment_usd),
					sub: `Largest ${usd0(t.largest_payment_usd)}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Cross-border",
					value: t.cross_currency_payments,
					sub: "Settled payments across currencies"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "What the numbers say",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [insights.length, " observations"] }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsightList, { items: insights })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[1fr_260px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Money in and out per day",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trend, {
					r,
					aName: "Money out",
					bName: "Money in"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Settlement reliability",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge$1, {
					value: t.success_rate,
					label: "Success rate",
					sub: `${t.succeeded} settled · ${t.failed} failed · ${t.reversed} reversed`
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Where your money moves",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: r.currencies.map((c) => ({
						label: c.label,
						value: c.value_usd
					})),
					ariaLabel: "Settled volume by currency",
					center: {
						value: usdCompact(t.volume_usd),
						label: "settled"
					},
					format: usd0
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Payment outcomes",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: r.statuses.map((s) => ({
						label: s.label,
						value: s.count
					})),
					ariaLabel: "Payments by outcome",
					center: {
						value: String(t.payments),
						label: "payments"
					},
					format: (v) => String(v)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Payment size distribution",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyHistogramChart, {
					data: r.histogram.map((b) => ({
						label: b.label,
						count: b.count
					})),
					ariaLabel: "Settled payments by size, USD equivalent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] text-muted-foreground",
					children: "Each bar counts settled payments whose USD value falls in the range."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Top counterparties",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankedBars, {
					ariaLabel: "Counterparties by settled volume",
					items: (r.counterparties ?? []).map((c) => ({
						label: c.name,
						value: c.volume_usd,
						display: usd0(c.volume_usd),
						note: `${c.count} payment${c.count === 1 ? "" : "s"}`
					}))
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Corridor flows",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowMatrix, {
				flows: r.corridors,
				format: usdCompact
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "When you are active",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityHeatmap, { grid: r.heatmap })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Basis, { r })
	] });
}
function Intelligence() {
	const [days, setDays] = (0, import_react.useState)(30);
	const q = useQuery({
		queryKey: [
			"analytics",
			"platform",
			days
		],
		queryFn: () => operator.analytics(days),
		staleTime: 6e4
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Network intelligence",
		title: "Platform analytics",
		description: "Throughput, corridor flows, payment mix, verification funnel and rail reliability across the whole network — the operational picture an oversight body would ask for.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeriodPicker, {
			value: days,
			onChange: setDays
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
		query: q,
		disabledCodes: ["analytics_unavailable"],
		children: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformBody, { r })
	})] });
}
var KYC_LABEL = {
	PENDING: "Unverified",
	VERIFIED: "Verified",
	APPROVED: "Verified",
	BUSINESS_VERIFIED: "Business verified",
	REJECTED: "Rejected",
	SUSPENDED: "Suspended"
};
function PlatformBody({ r }) {
	const t = r.totals;
	const insights = (0, import_react.useMemo)(() => buildInsights(r), [r]);
	const kyc = r.kyc ?? [];
	const count = (k) => kyc.find((x) => x.label === k)?.count ?? 0;
	const total = t.total_traders ?? 0;
	const verified = count("VERIFIED") + count("APPROVED") + count("BUSINESS_VERIFIED");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Settled volume",
					value: usd0(t.volume_usd),
					sub: `${t.succeeded} payments`,
					trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: r.daily.map((d) => d.out_usd) })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Success rate",
					value: `${Math.round(t.success_rate * 100)}%`,
					sub: `${t.failed} failed · ${t.reversed} reversed`,
					trend: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, { values: r.daily.map((d) => d.failed) })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Active traders",
					value: t.active_traders ?? 0,
					sub: `${t.new_traders ?? 0} new · ${total} total`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Cash-in",
					value: usd0(t.cash_in_usd),
					sub: "Wallet top-ups settled"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "What the numbers say",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [insights.length, " observations"] }),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsightList, { items: insights })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Settled volume per day",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trend, {
				r,
				aName: "Settled volume"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Volume by currency",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: r.currencies.map((c) => ({
						label: c.label,
						value: c.value_usd
					})),
					ariaLabel: "Settled volume by currency",
					center: {
						value: usdCompact(t.volume_usd),
						label: "settled"
					},
					format: usd0
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Payment outcomes",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: r.statuses.map((s) => ({
						label: s.label,
						value: s.count
					})),
					ariaLabel: "Payments by outcome",
					center: {
						value: String(t.payments),
						label: "payments"
					},
					format: (v) => String(v)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Corridor flow matrix",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowMatrix, {
				flows: r.corridors,
				format: usdCompact
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Payment size distribution",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyHistogramChart, {
					data: r.histogram.map((b) => ({
						label: b.label,
						count: b.count
					})),
					ariaLabel: "Settled payments by size, USD equivalent"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Verification funnel",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, {
					ariaLabel: "Trader verification funnel",
					stages: [
						{
							label: "All traders",
							count: total
						},
						{
							label: "Verified or above",
							count: verified
						},
						{
							label: "Business verified",
							count: count("BUSINESS_VERIFIED")
						}
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
						data: kyc.map((k) => ({
							label: KYC_LABEL[k.label] ?? k.label,
							value: k.count
						})),
						ariaLabel: "Traders by verification level",
						center: {
							value: String(total),
							label: "traders"
						},
						format: (v) => String(v)
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Rail reliability",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankedBars, {
					ariaLabel: "Provider success rate",
					empty: "No provider executions in this period.",
					items: (r.providers ?? []).map((p) => ({
						label: p.provider,
						value: p.success_rate * 100,
						display: `${Math.round(p.success_rate * 100)}%`,
						note: `${p.succeeded} ok · ${p.failed} failed · ${p.total} calls`
					}))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Cross-border workflows",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankedBars, {
					ariaLabel: "Workflows by state",
					empty: "No workflows in this period.",
					items: (r.workflows ?? []).map((w) => ({
						label: w.label.replaceAll("_", " "),
						value: w.count,
						display: String(w.count)
					}))
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Support load",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: (r.tickets ?? []).map((k) => ({
						label: k.label,
						value: k.count
					})),
					ariaLabel: "Support tickets by status",
					center: {
						value: String((r.tickets ?? []).reduce((s, k) => s + k.count, 0)),
						label: "tickets"
					},
					format: (v) => String(v)
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Settlement commands",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: (r.settlements ?? []).map((k) => ({
						label: k.label,
						value: k.count
					})),
					ariaLabel: "Settlement commands by status",
					center: {
						value: String((r.settlements ?? []).reduce((s, k) => s + k.count, 0)),
						label: "commands"
					},
					format: (v) => String(v)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Network activity by weekday and hour",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityHeatmap, { grid: r.heatmap })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Basis, { r })
	] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ByRole, {}) });
//#endregion
export { SplitComponent as component };
