import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { B as Download, X as ChevronLeft, Y as ChevronRight, ct as ArrowDown, g as Search, it as ArrowUpDown, rt as ArrowUp } from "../_libs/lucide-react.mjs";
import { d as cn, t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { i as useT } from "./i18n-CuQ20qdj.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { n as downloadCsv } from "./format-DmZ5-Nei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/data-table-Bm1wJeTq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var alignClass = {
	left: "text-left",
	right: "text-right",
	center: "text-center"
};
/**
* Accessible, responsive data table:
*  - real <table> semantics with a caption and scoped headers, sortable via aria-sort buttons;
*  - keyboard-operable rows (Enter / Space) when `onRowClick` is provided;
*  - client-side search, pagination and CSV export;
*  - below `md` each row collapses into a labelled card so nothing needs horizontal scrolling.
*/
function DataTable({ caption, columns, rows, rowKey, onRowClick, pageSize = 10, searchable = true, exportName, empty, toolbar, initialSort }) {
	const t = useT();
	const [query, setQuery] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)(initialSort ?? null);
	const [page, setPage] = (0, import_react.useState)(0);
	const textOf = (c, r) => String((c.text ?? c.sort)?.(r) ?? "");
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((r) => columns.some((c) => textOf(c, r).toLowerCase().includes(q)));
	}, [
		rows,
		query,
		columns
	]);
	const sorted = (0, import_react.useMemo)(() => {
		if (!sort) return filtered;
		const col = columns.find((c) => c.key === sort.key);
		if (!col?.sort) return filtered;
		const get = col.sort;
		return [...filtered].sort((a, b) => {
			const x = get(a);
			const y = get(b);
			const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), void 0, { numeric: true });
			return sort.dir === "asc" ? cmp : -cmp;
		});
	}, [
		filtered,
		sort,
		columns
	]);
	const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
	const safePage = Math.min(page, pages - 1);
	const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const toggleSort = (key) => {
		setPage(0);
		setSort((s) => s?.key === key ? s.dir === "asc" ? {
			key,
			dir: "desc"
		} : null : {
			key,
			dir: "asc"
		});
	};
	const onKey = (e, row) => {
		if (onRowClick && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onRowClick(row);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [searchable || exportName || toolbar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				searchable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => {
							setQuery(e.target.value);
							setPage(0);
						},
						"aria-label": `${t("common.search")}: ${caption}`,
						placeholder: t("common.search"),
						className: "h-8 w-56 rounded-none pl-8 font-mono text-xs"
					})]
				}) : null,
				toolbar,
				exportName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "ml-auto h-8 gap-1.5 rounded-none font-mono text-[10px] uppercase",
					disabled: sorted.length === 0,
					onClick: () => downloadCsv(exportName, columns.map((c) => c.header), sorted.map((r) => columns.map((c) => textOf(c, r)))),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
							className: "size-3.5",
							"aria-hidden": "true"
						}),
						" ",
						t("common.export")
					]
				}) : null
			]
		}) : null, sorted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border border-dashed border-border p-6 text-center text-xs text-muted-foreground",
			children: empty ?? "—"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden overflow-x-auto md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
							children: columns.map((c) => {
								const active = sort?.key === c.key;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									"aria-sort": active ? sort.dir === "asc" ? "ascending" : "descending" : c.sort ? "none" : void 0,
									className: cn("py-2 font-normal", alignClass[c.align ?? "left"], c.className),
									children: c.sort ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => toggleSort(c.key),
										className: cn("inline-flex items-center gap-1 uppercase tracking-[0.16em] hover:text-foreground", active && "text-foreground"),
										children: [c.header, active ? sort.dir === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
											className: "size-3",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
											className: "size-3",
											"aria-hidden": "true"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, {
											className: "size-3 opacity-40",
											"aria-hidden": "true"
										})]
									}) : c.header
								}, c.key);
							})
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							onClick: onRowClick ? () => onRowClick(row) : void 0,
							onKeyDown: (e) => onKey(e, row),
							tabIndex: onRowClick ? 0 : void 0,
							className: cn("border-b border-border/60 last:border-0", onRowClick && "cursor-pointer hover:bg-accent/40 focus-visible:bg-accent/40"),
							children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("py-2.5 pr-3 last:pr-0", alignClass[c.align ?? "left"], c.className),
								children: c.cell(row)
							}, c.key))
						}, rowKey(row))) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2 md:hidden",
				"aria-label": caption,
				children: visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					onClick: onRowClick ? () => onRowClick(row) : void 0,
					onKeyDown: (e) => onKey(e, row),
					tabIndex: onRowClick ? 0 : void 0,
					className: cn("border border-border p-3", onRowClick && "cursor-pointer active:bg-accent/40"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "space-y-1.5",
						children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
								children: c.header
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "min-w-0 text-right",
								children: c.cell(row)
							})]
						}, c.key))
					})
				}, rowKey(row)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between font-mono text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					"aria-live": "polite",
					children: [
						sorted.length,
						" ",
						t("common.rows"),
						" · ",
						safePage + 1,
						"/",
						pages
					]
				}), pages > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "size-7 rounded-none",
						disabled: safePage === 0,
						onClick: () => setPage(safePage - 1),
						"aria-label": t("common.previous"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "size-3.5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "size-7 rounded-none",
						disabled: safePage + 1 >= pages,
						onClick: () => setPage(safePage + 1),
						"aria-label": t("common.next"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "size-3.5",
							"aria-hidden": "true"
						})
					})]
				}) : null]
			})
		] })]
	});
}
//#endregion
export { DataTable as t };
