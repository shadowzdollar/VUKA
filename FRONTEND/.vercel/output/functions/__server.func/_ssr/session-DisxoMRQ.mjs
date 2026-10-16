import { i as __toESM } from "../_runtime.mjs";
import { l as isApiError, r as auth } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-DisxoMRQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SessionContext = (0, import_react.createContext)(null);
var KEYS = {
	trader: ["session", "trader"],
	operator: ["session", "operator"]
};
/** A 401/403/501 just means "not signed in as this identity"; anything else is a real failure. */
function signedOut(e) {
	return isApiError(e) && [
		401,
		403,
		501
	].includes(e.status);
}
function SessionProvider({ children }) {
	const qc = useQueryClient();
	const trader = useQuery({
		queryKey: KEYS.trader,
		queryFn: () => auth.traderMe().catch((e) => signedOut(e) ? null : Promise.reject(e)),
		staleTime: 6e4,
		retry: false
	});
	const operator = useQuery({
		queryKey: KEYS.operator,
		queryFn: () => auth.operatorMe().catch((e) => signedOut(e) ? null : Promise.reject(e)),
		staleTime: 6e4,
		retry: false
	});
	const session = (0, import_react.useMemo)(() => {
		if (trader.data) return {
			status: "trader",
			trader: trader.data
		};
		if (operator.data) return {
			status: "operator",
			operator: operator.data
		};
		if (trader.isPending || operator.isPending) return { status: "loading" };
		return { status: "anon" };
	}, [
		trader.data,
		trader.isPending,
		operator.data,
		operator.isPending
	]);
	const refresh = (0, import_react.useCallback)(async () => {
		await Promise.all([qc.invalidateQueries({ queryKey: KEYS.trader }), qc.invalidateQueries({ queryKey: KEYS.operator })]);
	}, [qc]);
	const logout = (0, import_react.useCallback)(async () => {
		if (session.status === "trader") await auth.traderLogout().catch(() => void 0);
		if (session.status === "operator") await auth.operatorLogout().catch(() => void 0);
		qc.clear();
		qc.setQueryData(KEYS.trader, null);
		qc.setQueryData(KEYS.operator, null);
	}, [qc, session.status]);
	const value = (0, import_react.useMemo)(() => ({
		session,
		refresh,
		logout
	}), [
		session,
		refresh,
		logout
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionContext.Provider, {
		value,
		children
	});
}
function useSession() {
	const ctx = (0, import_react.useContext)(SessionContext);
	if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
	return ctx;
}
/** Only call from components rendered inside `<Shell role="trader">`. */
function useTrader() {
	const { session } = useSession();
	if (session.status !== "trader") throw new Error("useTrader requires a trader session");
	return session.trader;
}
/** Only call from components rendered inside `<Shell role="operator">`. */
function useOperator() {
	const { session } = useSession();
	if (session.status !== "operator") throw new Error("useOperator requires an operator session");
	return session.operator;
}
//#endregion
export { useTrader as i, useOperator as n, useSession as r, SessionProvider as t };
