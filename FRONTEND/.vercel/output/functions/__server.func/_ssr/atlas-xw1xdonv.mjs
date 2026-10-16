import { i as __toESM } from "../_runtime.mjs";
import { m as platform } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn } from "./dropdown-menu-WnKjXFQ9.mjs";
import { n as FlagArt, r as FlagCloth, t as Flag } from "./flags-fYmYFIMT.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as corridorFeeBps, n as DIAL, r as REGION_NAMES } from "./markets-CXFrz9pK.mjs";
import { r as useDataSaver, t as Reveal } from "./reveal-D5NBHzlb.mjs";
import { i as countries, n as ATLAS_ID, r as byId, t as AFRICA } from "./geo-Bveelqjf.mjs";
import { n as Tilt } from "./tilt-BCeSLHKR.mjs";
import { c as centroid_default, n as naturalEarth1_default, r as path_default } from "../_libs/d3-geo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/atlas-xw1xdonv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var W = 600;
var H = 640;
/** A circular passport stamp: the flag in the centre, the country and currency set around the rim. */
function Stamp({ m, active, tilt }) {
	const id = `ring-${m.code}`;
	const r = 41;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 100 100",
		className: "size-full overflow-visible",
		"aria-hidden": "true",
		focusable: "false",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			id,
			d: `M50 50 m-${r} 0 a${r} ${r} 0 1 1 82 0 a${r} ${r} 0 1 1 -82 0`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", {
			id: `${id}-clip`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50",
				cy: "50",
				r: "27"
			})
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			transform: `rotate(${tilt} 50 50)`,
			className: cn(active && "stamp-in"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "50",
					cy: "50",
					r: "48",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "50",
					cy: "50",
					r: "30",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					fontSize: "7.6",
					letterSpacing: "1.4",
					fill: "currentColor",
					fontFamily: "var(--font-mono, monospace)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textPath", {
						href: `#${id}`,
						startOffset: "0",
						children: `${m.name.toUpperCase()} · ${m.currency} · ${m.code} ·`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					clipPath: `url(#${id}-clip)`,
					className: cn("transition-[filter] duration-300", active ? "" : "grayscale contrast-125"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
						transform: `translate(9.5 23) scale(${(54 / 600).toFixed(4)})`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagArt, {
							code: m.code,
							id: `stamp-${m.code}`
						})
					})
				})
			]
		}, active ? "on" : "off")]
	});
}
var TILTS = [
	-6,
	4,
	-3,
	7,
	-5,
	2,
	-7,
	5,
	-2,
	6
];
function Atlas() {
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5,
		retry: false
	});
	const saver = useDataSaver();
	const markets = (0, import_react.useMemo)(() => config.data?.countries ?? [], [config.data]);
	const [picked, setPicked] = (0, import_react.useState)("KE");
	const [hover, setHover] = (0, import_react.useState)(null);
	const activeCode = hover ?? picked;
	const active = markets.find((m) => m.code === activeCode) ?? markets[0];
	const scene = (0, import_react.useMemo)(() => {
		const africa = countries.filter((f) => AFRICA.has(String(f.id)));
		const proj = naturalEarth1_default().fitExtent([[6, 6], [594, 634]], {
			type: "FeatureCollection",
			features: africa
		});
		const path = path_default(proj);
		const idToCode = new Map(Object.entries(ATLAS_ID).map(([c, id]) => [id, c]));
		return {
			shapes: africa.map((f) => ({
				id: String(f.id),
				d: path(f) ?? "",
				code: idToCode.get(String(f.id)),
				f
			})),
			pins: Object.entries(ATLAS_ID).map(([code, id]) => {
				const f = byId.get(id);
				return {
					code,
					at: f ? proj(centroid_default(f)) : null,
					bounds: f ? path.bounds(f) : null
				};
			})
		};
	}, []);
	const same = markets.filter((m) => active && m.code !== active.code && m.region === active.region);
	const other = markets.filter((m) => active && m.code !== active.code && m.region !== active.region);
	const pinSide = {
		RW: -1,
		GH: -1,
		SN: -1,
		TZ: 1
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "atlas",
		className: "scroll-mt-20 overflow-hidden border-t border-border bg-muted/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto px-4 pb-20 pt-10 sm:px-6 lg:px-10 2xl:px-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
						children: "The atlas of markets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl",
						children: "Ten flags, one ledger."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-muted-foreground",
						children: "Each launch market is cut from the map in its own colours. Pick one to see its payout rail, its dialling code, and which corridors sit in the same fee group."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 grid gap-10 lg:grid-cols-[1.15fr_1fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: saver ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-[420px] items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
						children: "Map hidden while data saver is on. The passport stamps below still work."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: `0 0 ${W} ${H}`,
						className: "mx-auto h-auto w-full max-w-[560px] text-foreground",
						"aria-hidden": "true",
						focusable: "false",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pattern", {
								id: "atlas-hatch",
								width: "6",
								height: "6",
								patternUnits: "userSpaceOnUse",
								patternTransform: "rotate(45)",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									width: "6",
									height: "6",
									style: { fill: "var(--color-card)" }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "6",
									stroke: "currentColor",
									strokeOpacity: "0.55",
									strokeWidth: "1"
								})]
							}), scene.shapes.filter((s) => s.code).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", {
								id: `atlas-clip-${s.code}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: s.d })
							}, s.id))] }),
							scene.shapes.filter((s) => !s.code).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: s.d,
								fill: "url(#atlas-hatch)",
								style: {
									stroke: "var(--color-foreground)",
									strokeOpacity: .4
								},
								strokeWidth: "0.6"
							}, s.id)),
							scene.shapes.filter((s) => s.code).sort((a, b) => Number(a.code === activeCode) - Number(b.code === activeCode)).map((s) => {
								const code = s.code;
								const b = scene.pins.find((p) => p.code === code)?.bounds;
								const on = code === activeCode;
								const w = b ? b[1][0] - b[0][0] : 0;
								const h = b ? b[1][1] - b[0][1] : 0;
								const k = b ? Math.max(w / 900, h / 600) : 0;
								const dim = markets.length > 0 && active && !on && markets.find((m) => m.code === code)?.region !== active.region;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									style: {
										transform: on ? "translate(-2px,-5px)" : void 0,
										transition: "transform .25s ease, filter .25s ease, opacity .25s",
										filter: on ? "drop-shadow(0 8px 6px rgba(0,0,0,.45))" : "drop-shadow(0 2px 1.5px rgba(0,0,0,.35))",
										opacity: dim ? .72 : 1,
										cursor: "pointer"
									},
									onPointerEnter: () => setHover(code),
									onPointerLeave: () => setHover(null),
									onClick: () => setPicked(code),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
										clipPath: `url(#atlas-clip-${code})`,
										children: b ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
											transform: `translate(${b[0][0] + w / 2 - 450 * k} ${b[0][1] + h / 2 - 300 * k}) scale(${k})`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagArt, {
												code,
												id: `atlas-${code}`
											})
										}) : null
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: s.d,
										fill: "none",
										style: { stroke: on ? "var(--color-foreground)" : "var(--color-background)" },
										strokeWidth: on ? 1.8 : .9
									})]
								}, s.id);
							}),
							scene.pins.map((p, i) => {
								if (!p.at) return null;
								const on = p.code === activeCode;
								const side = pinSide[p.code] ?? 1;
								const [x, y] = p.at;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									transform: `translate(${x} ${y}) scale(${on ? 1.3 : 1})`,
									style: {
										pointerEvents: "none",
										transition: "transform .25s"
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
											cx: "0",
											cy: "1",
											rx: "4",
											ry: "1.5",
											fill: "rgba(0,0,0,.35)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
											x1: "0",
											y1: "0",
											x2: "0",
											y2: "-30",
											stroke: "currentColor",
											strokeWidth: "1.4"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
											className: "sway",
											style: {
												transformOrigin: "0 -30px",
												animationDelay: `${i * -.6}s`
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
												transform: `translate(${side === 1 ? 0 : -27} -30) scale(${27 / 900})`,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
														width: "900",
														height: "600",
														fill: "none"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagArt, {
														code: p.code,
														id: `pin-${p.code}`
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
														width: "900",
														height: "600",
														fill: "none",
														stroke: "currentColor",
														strokeWidth: "24"
													})
												]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "0",
											cy: "-30",
											r: "1.8",
											fill: "currentColor"
										})
									]
								}, p.code);
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: 100,
						children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tilt, {
							max: 4,
							className: "w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border border-border bg-card p-5 sm:p-6",
								"aria-live": "polite",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagCloth, {
											code: active.code,
											label: `Flag of ${active.name}`,
											className: "w-40 shrink-0 sm:w-48"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
													children: ["Visa page · ", active.code]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "mt-1 font-display text-4xl leading-none",
													children: active.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
													className: "mt-4 space-y-1.5 font-mono text-xs",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "w-16 text-muted-foreground",
																children: "Currency"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: active.currency })]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "w-16 text-muted-foreground",
																children: "Dial"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["+", DIAL[active.code] ?? ""] })]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "w-16 shrink-0 text-muted-foreground",
																children: "Rail"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
																className: "min-w-0",
																children: active.provider_name
															})]
														})
													]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-6 border-t border-dashed border-border pt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
												children: ["Fee group · ", REGION_NAMES[active.region] ?? active.region]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeeRow, {
												title: `Inside the group · ${(corridorFeeBps(active.region, active.region) / 100).toFixed(2)}%`,
												list: same,
												empty: "No other launch market shares this group yet."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeeRow, {
												title: `Across groups · ${(corridorFeeBps("a", "b") / 100).toFixed(2)}%`,
												list: other
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-[11px] text-muted-foreground",
										children: "Fee tiers as configured in the engine; indicative and shown before any payment is committed."
									})
								]
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-72 animate-pulse border border-border bg-card" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
					className: "mt-14",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-2xl",
							children: "The passport"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
							children: "Choose a market"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "radiogroup",
						"aria-label": "Market",
						className: "mt-4 grid grid-cols-5 gap-2 border border-border bg-card p-3 sm:gap-4 sm:p-5 lg:grid-cols-10",
						children: markets.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "radio",
							"aria-checked": picked === m.code,
							"aria-label": `${m.name}, ${m.currency}`,
							onClick: () => setPicked(m.code),
							onMouseEnter: () => setHover(m.code),
							onMouseLeave: () => setHover(null),
							onFocus: () => setHover(m.code),
							onBlur: () => setHover(null),
							className: cn("aspect-square text-muted-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring", picked === m.code && "text-foreground"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stamp, {
								m,
								active: picked === m.code,
								tilt: TILTS[i % TILTS.length] ?? 0
							})
						}, m.code))
					})]
				})
			]
		})
	});
}
function FeeRow({ title, list, empty }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs",
			children: title
		}), list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 flex flex-wrap gap-1.5",
			children: list.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-1.5 border border-border py-1 pl-1 pr-2 text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
					code: m.code,
					className: "w-5 shrink-0"
				}), m.name]
			}, m.code))
		}) : empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted-foreground",
			children: empty
		}) : null]
	});
}
//#endregion
export { Atlas };
