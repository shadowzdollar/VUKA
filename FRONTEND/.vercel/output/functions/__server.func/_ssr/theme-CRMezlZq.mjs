import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theme-CRMezlZq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "vuka.theme";
/**
* Runs before first paint (inlined in <head>) so a dark-mode user never sees a white flash.
* Kept dependency-free and wrapped in try/catch: storage can be blocked in private windows.
*/
var themeInitScript = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
var ThemeContext = (0, import_react.createContext)(null);
function systemPrefersDark() {
	return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function ThemeProvider({ children }) {
	const [preference, setPref] = (0, import_react.useState)("system");
	const [resolved, setResolved] = (0, import_react.useState)("light");
	(0, import_react.useEffect)(() => {
		try {
			const stored = window.localStorage.getItem(KEY);
			if (stored === "light" || stored === "dark" || stored === "system") setPref(stored);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		const apply = () => {
			const dark = preference === "dark" || preference === "system" && systemPrefersDark();
			document.documentElement.classList.toggle("dark", dark);
			setResolved(dark ? "dark" : "light");
		};
		apply();
		if (preference !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, [preference]);
	const setPreference = (0, import_react.useCallback)((p) => {
		setPref(p);
		try {
			window.localStorage.setItem(KEY, p);
		} catch {}
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		preference,
		resolved,
		setPreference
	}), [
		preference,
		resolved,
		setPreference
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value,
		children
	});
}
function useTheme() {
	const ctx = (0, import_react.useContext)(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
	return ctx;
}
//#endregion
export { themeInitScript as n, useTheme as r, ThemeProvider as t };
