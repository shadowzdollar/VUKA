import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn } from "./dropdown-menu-WnKjXFQ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lazy-charts-CUzwBwkB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
(0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.FlowChart })));
var Donut = (0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.DonutChart })));
var Histogram = (0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.HistogramChart })));
var Trend = (0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.TrendChart })));
var Radar = (0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.RadarView })));
var State = (0, import_react.lazy)(() => import("./charts-DvNhaamZ.mjs").then((m) => ({ default: m.StateChart })));
/** Charts render client-side only (they measure the DOM) and never block first paint. */
function useMounted() {
	const [m, setM] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setM(true), []);
	return m;
}
var fallback = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
	className: "h-56 w-full rounded-none",
	"aria-label": "Loading chart"
});
function LazyStateChart(props) {
	return useMounted() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(State, { ...props })
	}) : fallback;
}
function lazyChart(Comp, height = "h-56") {
	return function Lazy(props) {
		return useMounted() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
				className: `${height} w-full rounded-none`,
				"aria-label": "Loading chart"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, { ...props })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
			className: `${height} w-full rounded-none`,
			"aria-label": "Loading chart"
		});
	};
}
var LazyDonutChart = lazyChart(Donut, "h-44");
var LazyHistogramChart = lazyChart(Histogram);
var LazyTrendChart = lazyChart(Trend, "h-64");
var LazyRadarView = lazyChart(Radar, "h-72");
//#endregion
export { LazyTrendChart as a, LazyStateChart as i, LazyHistogramChart as n, Skeleton as o, LazyRadarView as r, LazyDonutChart as t };
