import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { downloadCsv } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell content. */
  cell: (row: T) => ReactNode;
  /** Comparable value for sorting; omit to make the column non-sortable. */
  sort?: (row: T) => string | number;
  /** Plain text used for search and CSV export (defaults to the sort value). */
  text?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  /** Hide this column on narrow screens (still shown in the mobile card as a label/value pair). */
  className?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  searchable?: boolean;
  exportName?: string;
  empty?: ReactNode;
  toolbar?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * Accessible, responsive data table:
 *  - real <table> semantics with a caption and scoped headers, sortable via aria-sort buttons;
 *  - keyboard-operable rows (Enter / Space) when `onRowClick` is provided;
 *  - client-side search, pagination and CSV export;
 *  - below `md` each row collapses into a labelled card so nothing needs horizontal scrolling.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  onRowClick,
  pageSize = 10,
  searchable = true,
  exportName,
  empty,
  toolbar,
  initialSort,
}: DataTableProps<T>) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const textOf = (c: Column<T>, r: T) => String((c.text ?? c.sort)?.(r) ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => textOf(c, r).toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return filtered;
    const get = col.sort;
    return [...filtered].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const cmp =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((s) =>
      s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );
  };

  const onKey = (e: KeyboardEvent, row: T) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className="space-y-3">
      {searchable || exportName || toolbar ? (
        <div className="flex flex-wrap items-center gap-2">
          {searchable ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                aria-label={`${t("common.search")}: ${caption}`}
                placeholder={t("common.search")}
                className="h-8 w-56 rounded-none pl-8 font-mono text-xs"
              />
            </div>
          ) : null}
          {toolbar}
          {exportName ? (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-8 gap-1.5 rounded-none font-mono text-[10px] uppercase"
              disabled={sorted.length === 0}
              onClick={() =>
                downloadCsv(
                  exportName,
                  columns.map((c) => c.header),
                  sorted.map((r) => columns.map((c) => textOf(c, r))),
                )
              }
            >
              <Download className="size-3.5" aria-hidden="true" /> {t("common.export")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {empty ?? "—"}
        </div>
      ) : (
        <>
          {/* Desktop / tablet */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {columns.map((c) => {
                    const active = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          active
                            ? sort!.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : c.sort
                              ? "none"
                              : undefined
                        }
                        className={cn(
                          "py-2 font-normal",
                          alignClass[c.align ?? "left"],
                          c.className,
                        )}
                      >
                        {c.sort ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              "inline-flex items-center gap-1 uppercase tracking-[0.16em] hover:text-foreground",
                              active && "text-foreground",
                            )}
                          >
                            {c.header}
                            {active ? (
                              sort!.dir === "asc" ? (
                                <ArrowUp className="size-3" aria-hidden="true" />
                              ) : (
                                <ArrowDown className="size-3" aria-hidden="true" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={(e) => onKey(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      onRowClick && "cursor-pointer hover:bg-accent/40 focus-visible:bg-accent/40",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "py-2.5 pr-3 last:pr-0",
                          alignClass[c.align ?? "left"],
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: one labelled card per row */}
          <ul className="space-y-2 md:hidden" aria-label={caption}>
            {visible.map((row) => (
              <li
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={(e) => onKey(e, row)}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border border-border p-3",
                  onRowClick && "cursor-pointer active:bg-accent/40",
                )}
              >
                <dl className="space-y-1.5">
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {c.header}
                      </dt>
                      <dd className="min-w-0 text-right">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span aria-live="polite">
              {sorted.length} {t("common.rows")} · {safePage + 1}/{pages}
            </span>
            {pages > 1 ? (
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-none"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                  aria-label={t("common.previous")}
                >
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-none"
                  disabled={safePage + 1 >= pages}
                  onClick={() => setPage(safePage + 1)}
                  aria-label={t("common.next")}
                >
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
