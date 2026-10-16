import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/send-Bdf77dgo.js
var $$splitComponentImporter = () => import("./send-xjF1xrf0.mjs");
var Route = createFileRoute("/send")({
	validateSearch: (search) => typeof search["invoice"] === "string" ? { invoice: search["invoice"] } : {},
	head: () => ({ meta: [{ title: "Send Payment — VUKA" }, {
		name: "description",
		content: "Pay a supplier across borders with a live corridor quote and a tracked settlement."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
