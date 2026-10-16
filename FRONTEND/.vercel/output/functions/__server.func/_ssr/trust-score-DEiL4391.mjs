import { m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as ErrorState, r as Loading } from "./query-state-38NEt_Mf.mjs";
import { i as useTrader } from "./session-DisxoMRQ.mjs";
import { c as Metric, d as Shell, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { t as day } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as LazyRadarView } from "./lazy-charts-CUzwBwkB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trust-score-DEiL4391.js
var import_jsx_runtime = require_jsx_runtime();
var ACTIONS = {
	cycles: "Complete more payments. Ten finished payments give this factor its full weight; failed payments lower the rate.",
	invoices: "Issue invoices and get them paid. Five invoices give this factor its full weight.",
	reversals: "Avoid reversals: agree amounts and recipients before sending.",
	volume: "Keep activity steady across consecutive 30-day windows (four settled payments across two windows).",
	diversity: "Trade with more distinct partners. Five different counterparties give this factor its full weight."
};
/** score = 300 + 550 × Σ(weight × value × confidence) / 10 000, so each lever has an exact point value. */
function opportunities(factors) {
	return factors.map((f) => {
		const raiseValue = 550 * f.weight * (100 - f.value) * f.confidence / 1e4;
		const addEvidence = 550 * f.weight * f.value * (1 - f.confidence) / 1e4;
		const potential = raiseValue + addEvidence + 550 * f.weight * (100 - f.value) * (1 - f.confidence) / 1e4;
		return {
			factor: f,
			points: Math.round(potential),
			lever: addEvidence >= raiseValue ? "evidence" : "quality"
		};
	}).filter((o) => o.points > 0).sort((a, b) => b.points - a.points).slice(0, 3);
}
async function sha256Hex(text) {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
function TrustScore() {
	const trader = useTrader();
	const trustQuery = useQuery({
		queryKey: ["trust", trader.id],
		queryFn: platform.trust,
		staleTime: 6e4
	});
	const result = trustQuery.data ? {
		...trustQuery.data,
		cyclesScored: trustQuery.data.cycles_scored
	} : null;
	const failure = trustQuery.isError ? trustQuery : void 0;
	async function exportCertificate() {
		if (!result) return;
		const issued = (/* @__PURE__ */ new Date()).toISOString();
		const body = [
			"VUKA TRADE-CREDIT CERTIFICATE",
			"=============================",
			`Trader: ${trader.full_name} (${trader.id})`,
			`Issued: ${issued}`,
			`Composite score: ${result.score} / 850 (band ${result.band})`,
			`Settlement cycles scored: ${result.cyclesScored}`,
			"",
			...result.factors.map((f) => `${f.label.padEnd(32)} weight ${String(f.weight).padStart(2)}%  score ${Math.round(f.value)}/100  evidence ${Math.round(f.confidence * 100)}%  — ${f.detail}`),
			"",
			"Derived exclusively from on-platform ledger settlement outcomes.",
			"No demographic, identity or inferred behavioural inputs are used.",
			"Informational only; not a credit decision."
		].join("\n");
		const digest = await sha256Hex(body);
		const url = URL.createObjectURL(new Blob([`${body}\n\nSHA-256 of the text above: ${digest}\n`], { type: "text/plain" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `vuka-trade-credit-certificate-${day(issued)}.txt`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Trade-credit certificate exported", { description: `SHA-256 ${digest.slice(0, 12)}…` });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Credit engine",
		title: "Trust & Credit Score",
		description: "The score is a deterministic function of your settlement history. Every point is attributable to a recorded ledger outcome — no opaque model, no identity proxies.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => void exportCertificate(),
			disabled: !result || result.cyclesScored === 0,
			className: "rounded-none font-mono text-xs uppercase",
			children: "Export credit certificate"
		})
	}), failure ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		error: failure.error,
		onRetry: () => void trustQuery.refetch()
	}) : !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[320px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
						children: "Composite score"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 font-mono text-6xl tabular-nums tracking-tighter",
						children: result.cyclesScored === 0 ? "—" : result.score
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-mono text-xs text-muted-foreground",
						children: result.cyclesScored === 0 ? "No settled payments yet" : `of 850 · band ${result.band}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 w-full bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-foreground",
								style: { width: `${result.cyclesScored === 0 ? 0 : (result.score - 300) / 550 * 100}%` }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between font-mono text-[10px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "300" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "850" })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-6 space-y-2 border-t border-border pt-4 font-mono text-[11px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Trader"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: trader.full_name })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Cycles scored"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: result.cyclesScored })]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Factor breakdown",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					tone: "live",
					children: "Deterministic"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-5",
					children: result.factors.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: f.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs tabular-nums text-muted-foreground",
								children: [
									"weight ",
									f.weight,
									"% · ",
									Math.round(f.value),
									"/100 · evidence",
									" ",
									Math.round(f.confidence * 100),
									"%"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1 w-full bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-foreground",
								style: { width: `${f.value}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-xs text-muted-foreground",
							children: f.detail
						})
					] }, f.key))
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Score shape",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyRadarView, {
					ariaLabel: "Trust factors: current effective value and potential",
					data: result.factors.map((f) => ({
						axis: f.label.split(" ")[0] ?? f.label,
						value: f.value * f.confidence,
						potential: 100
					}))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] text-muted-foreground",
					children: "The solid shape is each factor's value weighted by how much evidence backs it; the dashed outline is the ceiling."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Path to a higher score",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [opportunities(result.factors).length, " levers"] }),
				children: [opportunities(result.factors).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Every factor is at its ceiling."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-4",
					children: opportunities(result.factors).map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-muted-foreground",
							children: ["0", i + 1]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm",
							children: [o.factor.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 font-mono text-xs",
								children: [
									"+",
									o.points,
									" pts possible"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: ACTIONS[o.factor.key] ?? o.factor.detail
						})] })]
					}, o.factor.key))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-[11px] text-muted-foreground",
					children: "Point values come from the published formula: 300 + 550 × Σ(weight × value × evidence) ÷ 10 000."
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Excluded inputs",
					value: "0",
					sub: "No demographic or identity signals"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Scored factors",
					value: result.factors.length,
					sub: "Each traceable to ledger rows"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Evidence weighting",
					value: "On",
					sub: "Thin history is pulled toward the floor"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "border border-dashed border-border p-3 text-xs text-muted-foreground",
			children: "Mutual-release rate and arbitration record are not part of this score yet: the engine keys on-chain escrows to wallet addresses rather than to traders, so they cannot be attributed to you."
		})
	] })] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustScore, {})
});
//#endregion
export { SplitComponent as component };
