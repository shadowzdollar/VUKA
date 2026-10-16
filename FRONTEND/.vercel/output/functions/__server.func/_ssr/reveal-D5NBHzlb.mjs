import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { d as cn } from "./dropdown-menu-WnKjXFQ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reveal-D5NBHzlb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "vuka.dataSaver";
var listeners = /* @__PURE__ */ new Set();
function browserHint() {
	return !!navigator.connection?.saveData;
}
function read() {
	try {
		const v = window.localStorage.getItem(KEY);
		if (v === "on") return true;
		if (v === "off") return false;
	} catch {}
	return browserHint();
}
function setDataSaver(on) {
	try {
		window.localStorage.setItem(KEY, on ? "on" : "off");
	} catch {}
	listeners.forEach((l) => l());
}
/** True when the visitor chose data-saver, or their browser asks for reduced data (Save-Data). */
function useDataSaver() {
	return (0, import_react.useSyncExternalStore)((cb) => {
		listeners.add(cb);
		return () => listeners.delete(cb);
	}, read, () => false);
}
/**
* Fades content up once as it scrolls into view. Content is fully visible without JavaScript or when
* the user prefers reduced motion (the global CSS neutralises the transition), and it never re-hides.
*/
function Reveal({ children, className, as: Tag = "div", delay = 0 }) {
	const ref = (0, import_react.useRef)(null);
	const [shown, setShown] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setShown(true);
			return;
		}
		const io = new IntersectionObserver(([e]) => {
			if (e?.isIntersecting) {
				setShown(true);
				io.disconnect();
			}
		}, {
			threshold: .12,
			rootMargin: "0px 0px -6% 0px"
		});
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
		ref,
		className: cn("reveal", shown && "is-in", className),
		style: delay ? { transitionDelay: `${delay}ms` } : void 0,
		children
	});
}
//#endregion
export { setDataSaver as n, useDataSaver as r, Reveal as t };
