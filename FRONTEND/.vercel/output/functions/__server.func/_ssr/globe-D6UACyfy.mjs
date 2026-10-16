import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { V as Crosshair, at as ArrowRight, b as Pause, ot as ArrowLeft, y as Play } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { r as useTheme } from "./theme-CRMezlZq.mjs";
import { i as countries, n as ATLAS_ID, r as byId, t as AFRICA } from "./geo-Bveelqjf.mjs";
import { a as graticule10, c as centroid_default, i as interpolate_default, o as contains_default, r as path_default, s as distance_default, t as orthographic_default } from "../_libs/d3-geo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/globe-D6UACyfy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var reduce = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function Globe({ markets, arcs, activeCode, onActive, className }) {
	const wrap = (0, import_react.useRef)(null);
	const canvas = (0, import_react.useRef)(null);
	const { resolved } = useTheme();
	const [paused, setPaused] = (0, import_react.useState)(false);
	const state = (0, import_react.useRef)({
		lambda: -20,
		phi: -4,
		vx: 0,
		dragging: false,
		lastX: 0,
		lastY: 0,
		idleSince: 0,
		hover: null,
		w: 0,
		h: 0
	});
	const colors = (0, import_react.useRef)({
		fg: "#000",
		bg: "#fff",
		muted: "#888",
		hatch: null
	});
	const propsRef = (0, import_react.useRef)({
		markets,
		arcs,
		activeCode,
		paused
	});
	propsRef.current = {
		markets,
		arcs,
		activeCode,
		paused
	};
	const drawRef = (0, import_react.useRef)(() => void 0);
	const readColors = (0, import_react.useCallback)(() => {
		const el = wrap.current;
		if (!el) return;
		const cs = getComputedStyle(el);
		const fg = cs.getPropertyValue("--color-foreground").trim() || "#000";
		const bg = cs.getPropertyValue("--color-background").trim() || "#fff";
		const muted = cs.getPropertyValue("--color-muted-foreground").trim() || "#888";
		const tile = document.createElement("canvas");
		tile.width = tile.height = 7;
		const g = tile.getContext("2d");
		let hatch = null;
		if (g) {
			g.strokeStyle = fg;
			g.globalAlpha = .55;
			g.lineWidth = 1;
			g.beginPath();
			g.moveTo(0, 7);
			g.lineTo(7, 0);
			g.stroke();
			hatch = canvas.current?.getContext("2d")?.createPattern(tile, "repeat") ?? null;
		}
		colors.current = {
			fg,
			bg,
			muted,
			hatch
		};
	}, []);
	(0, import_react.useEffect)(() => {
		readColors();
		drawRef.current(performance.now());
	}, [resolved, readColors]);
	(0, import_react.useEffect)(() => {
		const cv = canvas.current;
		const el = wrap.current;
		if (!cv || !el) return;
		const ctx = cv.getContext("2d");
		if (!ctx) return;
		const s = state.current;
		const still = reduce();
		let raf = 0;
		let visible = true;
		const resize = () => {
			const r = el.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			s.w = r.width;
			s.h = r.height;
			cv.width = Math.round(r.width * dpr);
			cv.height = Math.round(r.height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			readColors();
			draw(performance.now());
		};
		const centroids = /* @__PURE__ */ new Map();
		for (const [code, id] of Object.entries(ATLAS_ID)) {
			const f = byId.get(id);
			if (f) centroids.set(code, centroid_default(f));
		}
		const draw = (t) => {
			const { w, h } = s;
			if (!w || !h) return;
			const { fg, bg, muted, hatch } = colors.current;
			const { markets: mk, arcs: ar, activeCode: ac, paused: pz } = propsRef.current;
			const marketSet = new Set(mk.map((m) => ATLAS_ID[m.code]).filter(Boolean));
			if (!still && !pz && !s.dragging && performance.now() - s.idleSince > 2500) {
				const target = -22 + 22 * Math.sin(t / 7e3);
				s.lambda += (target - s.lambda) * .02;
				s.phi += (-6 - s.phi) * .02;
			}
			s.lambda += s.vx;
			s.vx *= .94;
			s.phi = Math.max(-62, Math.min(62, s.phi));
			const R = Math.min(w, h) / 2 - 6;
			const cx = w / 2;
			const cy = h / 2;
			const proj = orthographic_default().scale(R).translate([cx, cy]).rotate([s.lambda, s.phi]).clipAngle(90);
			const path = path_default(proj, ctx);
			ctx.clearRect(0, 0, w, h);
			ctx.beginPath();
			path({ type: "Sphere" });
			ctx.fillStyle = bg;
			ctx.fill();
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = fg;
			ctx.stroke();
			ctx.beginPath();
			path(graticule10());
			ctx.lineWidth = .5;
			ctx.globalAlpha = .18;
			ctx.strokeStyle = fg;
			ctx.stroke();
			ctx.globalAlpha = 1;
			for (const f of countries) {
				const id = String(f.id);
				const isMarket = marketSet.has(id);
				const isAfrica = AFRICA.has(id);
				const isActive = !!ac && ATLAS_ID[ac] === id;
				const isHover = s.hover != null && ATLAS_ID[s.hover] === id;
				ctx.beginPath();
				path(f);
				if (isMarket) {
					ctx.globalAlpha = isActive || isHover ? 1 : .86;
					ctx.fillStyle = fg;
					ctx.fill();
					ctx.globalAlpha = 1;
					ctx.lineWidth = isActive || isHover ? 1.6 : .7;
					ctx.strokeStyle = bg;
					ctx.stroke();
				} else if (isAfrica && hatch) {
					ctx.fillStyle = hatch;
					ctx.fill();
					ctx.lineWidth = .6;
					ctx.strokeStyle = fg;
					ctx.globalAlpha = .7;
					ctx.stroke();
					ctx.globalAlpha = 1;
				} else {
					ctx.globalAlpha = .09;
					ctx.fillStyle = fg;
					ctx.fill();
					ctx.globalAlpha = .5;
					ctx.lineWidth = .5;
					ctx.strokeStyle = fg;
					ctx.stroke();
					ctx.globalAlpha = 1;
				}
			}
			const center = [-s.lambda, -s.phi];
			const visible = (p) => distance_default(p, center) < Math.PI / 2 - .02;
			ctx.lineCap = "round";
			ar.forEach(([a, b], i) => {
				const pa = centroids.get(a);
				const pb = centroids.get(b);
				if (!pa || !pb) return;
				const interp = interpolate_default(pa, pb);
				const lift = .06 + distance_default(pa, pb) * .28;
				const focus = ac && (a === ac || b === ac);
				ctx.beginPath();
				let started = false;
				const N = 44;
				for (let k = 0; k <= N; k++) {
					const u = k / N;
					const ll = interp(u);
					if (!visible(ll)) {
						started = false;
						continue;
					}
					const p = proj(ll);
					if (!p) continue;
					const e = 1 + lift * Math.sin(Math.PI * u);
					const x = cx + (p[0] - cx) * e;
					const y = cy + (p[1] - cy) * e;
					if (!started) {
						ctx.moveTo(x, y);
						started = true;
					} else ctx.lineTo(x, y);
				}
				ctx.lineWidth = focus ? 2 : 1.1;
				ctx.strokeStyle = fg;
				ctx.globalAlpha = focus ? 1 : ac ? .22 : .62;
				ctx.setLineDash([5, 5]);
				ctx.lineDashOffset = still ? 0 : -((t / 55 + i * 7) % 10);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.globalAlpha = 1;
			});
			ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
			ctx.textAlign = "center";
			for (const m of mk) {
				const c = centroids.get(m.code);
				if (!c || !visible(c)) continue;
				const p = proj(c);
				if (!p) continue;
				const on = ac === m.code || s.hover === m.code;
				const pulse = still ? 0 : (Math.sin(t / 500 + p[0]) + 1) / 2;
				ctx.beginPath();
				ctx.arc(p[0], p[1], 3.5 + pulse * 2.5, 0, Math.PI * 2);
				ctx.strokeStyle = bg;
				ctx.globalAlpha = .9 - pulse * .6;
				ctx.lineWidth = 1.2;
				ctx.stroke();
				ctx.globalAlpha = 1;
				ctx.beginPath();
				ctx.arc(p[0], p[1], on ? 4.5 : 3, 0, Math.PI * 2);
				ctx.fillStyle = bg;
				ctx.fill();
				ctx.lineWidth = 1.4;
				ctx.strokeStyle = fg;
				ctx.stroke();
				if (on) {
					const label = `${m.name} · ${m.currency}`;
					const tw = ctx.measureText(label).width + 12;
					ctx.fillStyle = fg;
					ctx.fillRect(p[0] - tw / 2, p[1] - 27, tw, 17);
					ctx.fillStyle = bg;
					ctx.fillText(label, p[0], p[1] - 15);
				} else {
					ctx.fillStyle = muted;
					ctx.globalAlpha = .95;
					ctx.fillStyle = bg;
					ctx.fillText(m.code, p[0], p[1] + 15);
					ctx.fillStyle = fg;
					ctx.fillText(m.code, p[0], p[1] + 14);
					ctx.globalAlpha = 1;
				}
			}
		};
		drawRef.current = draw;
		const loop = (t) => {
			if (visible && !document.hidden) draw(t);
			raf = requestAnimationFrame(loop);
		};
		resize();
		if (!still) raf = requestAnimationFrame(loop);
		const ro = new ResizeObserver(resize);
		ro.observe(el);
		const io = new IntersectionObserver(([e]) => visible = !!e?.isIntersecting, { threshold: .01 });
		io.observe(el);
		const pointFor = (e) => {
			const r = cv.getBoundingClientRect();
			return [e.clientX - r.left, e.clientY - r.top];
		};
		const hitTest = (x, y) => {
			const R = Math.min(s.w, s.h) / 2 - 6;
			const ll = orthographic_default().scale(R).translate([s.w / 2, s.h / 2]).rotate([s.lambda, s.phi]).invert?.([x, y]);
			if (!ll) return null;
			for (const m of propsRef.current.markets) {
				const f = byId.get(ATLAS_ID[m.code] ?? "");
				if (f && contains_default(f, ll)) return m.code;
			}
			return null;
		};
		const down = (e) => {
			s.dragging = true;
			s.lastX = e.clientX;
			s.lastY = e.clientY;
			s.vx = 0;
			cv.setPointerCapture(e.pointerId);
		};
		const move = (e) => {
			if (s.dragging) {
				const dx = e.clientX - s.lastX;
				s.lambda += dx * .35;
				s.phi -= (e.clientY - s.lastY) * .25;
				s.vx = dx * .06;
				s.lastX = e.clientX;
				s.lastY = e.clientY;
				s.idleSince = performance.now();
				if (still) draw(performance.now());
				return;
			}
			const [x, y] = pointFor(e);
			const hit = hitTest(x, y);
			if (hit !== s.hover) {
				s.hover = hit;
				onActive(hit);
				cv.style.cursor = hit ? "pointer" : "grab";
				if (still) draw(performance.now());
			}
		};
		const up = () => {
			s.dragging = false;
			s.idleSince = performance.now();
		};
		const leave = () => {
			if (s.hover) {
				s.hover = null;
				onActive(null);
				if (still) draw(performance.now());
			}
		};
		cv.addEventListener("pointerdown", down);
		cv.addEventListener("pointermove", move);
		cv.addEventListener("pointerup", up);
		cv.addEventListener("pointercancel", up);
		cv.addEventListener("pointerleave", leave);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			io.disconnect();
			cv.removeEventListener("pointerdown", down);
			cv.removeEventListener("pointermove", move);
			cv.removeEventListener("pointerup", up);
			cv.removeEventListener("pointercancel", up);
			cv.removeEventListener("pointerleave", leave);
		};
	}, [onActive, readColors]);
	const nudge = (d) => {
		state.current.lambda += d;
		state.current.idleSince = performance.now();
		if (reduce()) drawRef.current(performance.now());
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrap,
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvas,
			role: "img",
			"aria-label": `Globe of Africa showing ${markets.length} launch markets connected by payment corridors: ${markets.map((m) => m.name).join(", ")}.`,
			className: "h-full w-full cursor-grab touch-pan-y select-none"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 bg-background/85 p-1 backdrop-blur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-8 rounded-none",
					onClick: () => nudge(-18),
					"aria-label": "Rotate globe west",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
						className: "size-4",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-8 rounded-none",
					onClick: () => {
						state.current.lambda = -22;
						state.current.phi = -6;
						if (reduce()) drawRef.current(performance.now());
					},
					"aria-label": "Re-centre on Africa",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, {
						className: "size-4",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-8 rounded-none",
					onClick: () => nudge(18),
					"aria-label": "Rotate globe east",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						className: "size-4",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-8 rounded-none",
					onClick: () => setPaused((p) => !p),
					"aria-label": paused ? "Resume gentle motion" : "Pause gentle motion",
					"aria-pressed": paused,
					children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-4",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
						className: "size-4",
						"aria-hidden": "true"
					})
				})
			]
		})]
	});
}
//#endregion
export { ATLAS_ID, Globe as default };
