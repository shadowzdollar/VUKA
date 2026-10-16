import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chain-scope-bar-BRFobqc7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* The engine's escrow / dispute / reconciliation reads are scoped to one contract on one chain
* (`?contract=0x…&chain_id=80002`). The engine does not advertise its configured contract, so the
* operator supplies it once here. VITE_ESCROW_CONTRACT / VITE_ESCROW_CHAIN_ID provide defaults.
*/
var STORAGE_KEY = "vuka.chainScope";
var DEFAULT_CHAIN = Number({
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_ESCROW_CHAIN_ID"] ?? 80002);
function read() {
	const fallback = {
		contract: {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/"
		}["VITE_ESCROW_CONTRACT"] ?? "",
		chain_id: DEFAULT_CHAIN
	};
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return {
			contract: typeof parsed.contract === "string" ? parsed.contract : fallback.contract,
			chain_id: typeof parsed.chain_id === "number" ? parsed.chain_id : DEFAULT_CHAIN
		};
	} catch {
		return fallback;
	}
}
function useChainScope() {
	const [scope, setScope] = (0, import_react.useState)(() => typeof window === "undefined" ? {
		contract: "",
		chain_id: DEFAULT_CHAIN
	} : read());
	return [scope, (0, import_react.useCallback)((next) => {
		setScope(next);
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {}
	}, [])];
}
function scopeReady(scope) {
	return /^0x[0-9a-fA-F]{40}$/.test(scope.contract.trim());
}
/**
* Escrow, dispute and reconciliation reads are scoped to a contract on a chain. The engine does
* not advertise its configured contract, so the operator enters it once (remembered in this browser).
*/
function ChainScopeBar({ scope, onChange }) {
	const [contract, setContract] = (0, import_react.useState)(scope.contract);
	const [chain, setChain] = (0, import_react.useState)(String(scope.chain_id ?? 80002));
	const dirty = contract.trim() !== scope.contract || Number(chain) !== scope.chain_id;
	const valid = scopeReady({ contract }) && Number(chain) > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end gap-2 border border-border p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-[280px] flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					htmlFor: "scope-contract",
					className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
					children: "Escrow contract"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "scope-contract",
					value: contract,
					onChange: (e) => setContract(e.target.value),
					placeholder: "0x… (VUKA_RECONCILIATION_CONTRACT)",
					className: "mt-1 h-8 rounded-none font-mono text-xs"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-28",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					htmlFor: "scope-chain",
					className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
					children: "Chain id"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "scope-chain",
					value: chain,
					onChange: (e) => setChain(e.target.value),
					inputMode: "numeric",
					className: "mt-1 h-8 rounded-none font-mono text-xs"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				disabled: !valid || !dirty,
				className: "h-8 rounded-none font-mono text-[10px] uppercase",
				onClick: () => onChange({
					contract: contract.trim(),
					chain_id: Number(chain)
				}),
				children: "Apply"
			})
		]
	});
}
//#endregion
export { scopeReady as n, useChainScope as r, ChainScopeBar as t };
