import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { g as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Shell } from "./shell-TFIi8X1Z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallets-ZK2Rbwu7.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Layout for /wallets and /wallets/$id: shared trader Shell chrome, with the list
* (wallets.index.tsx) or a single account's detail (wallets.$id.tsx) rendered through the outlet.
*/
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
});
//#endregion
export { SplitComponent as component };
