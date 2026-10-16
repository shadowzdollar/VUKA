import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn } from "./dropdown-menu-WnKjXFQ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tilt-BCeSLHKR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* A stack of "paper" layers that tilt in 3D toward the pointer and separate slightly in depth.
* Purely decorative (aria-hidden by callers when the content is repeated as text). Static for
* reduced-motion users.
*/
function Tilt({ children, className, max = 9 }) {
	const ref = (0, import_react.useRef)(null);
	const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const onMove = (e) => {
		const el = ref.current;
		if (!el || still() || e.pointerType === "touch") return;
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width - .5;
		const y = (e.clientY - r.top) / r.height - .5;
		el.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
	};
	const reset = () => {
		if (ref.current) ref.current.style.transform = "rotateY(-6deg) rotateX(4deg)";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("stage-3d", className),
		onPointerMove: onMove,
		onPointerLeave: reset,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "layer-3d",
			style: { transform: "rotateY(-6deg) rotateX(4deg)" },
			children
		})
	});
}
/** One sheet inside a <Tilt>, lifted `z` pixels toward the viewer. */
function Sheet3D({ z, className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("border border-border bg-card shadow-[0_18px_40px_-22px_rgba(0,0,0,0.5)]", className),
		style: { transform: `translateZ(${z}px)` },
		children
	});
}
//#endregion
export { Tilt as n, Sheet3D as t };
