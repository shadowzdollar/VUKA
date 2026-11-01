import { Link } from "@tanstack/react-router";
import type { NavGroup } from "@/components/vuka/nav";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Grouped navigation used by both the desktop sidebar (expanded or collapsed rail) and the mobile drawer. */
export function NavList({
  groups,
  onNavigate,
  collapsed = false,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const t = useT();
  return (
    <div className={cn(collapsed ? "space-y-3" : "space-y-4")}>
      {groups.map((group) => {
        const headingId = `nav-group-${group.labelKey}`;
        return (
          <div key={group.labelKey} role="group" aria-labelledby={headingId}>
            <div
              id={headingId}
              className={cn(
                "px-2.5 pb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70",
                collapsed && "sr-only",
              )}
            >
              {t(group.labelKey)}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.labelKey);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      preload="intent"
                      onClick={onNavigate}
                      title={collapsed ? label : undefined}
                      aria-label={collapsed ? label : undefined}
                      activeOptions={{ exact: item.exact ?? false }}
                      className={cn(
                        "group relative flex items-center rounded-xl text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground",
                        collapsed
                          ? "mx-auto size-9 justify-center p-0"
                          : "gap-2.5 px-2.5 py-2 hover:translate-x-0.5",
                      )}
                      activeProps={{
                        className: cn(
                          "bg-[#151515] text-white font-semibold shadow-sm hover:bg-[#151515]/95 hover:text-white hover:translate-x-0 [&_svg]:text-[#c2f74d]",
                          collapsed ? "mx-auto size-9 justify-center p-0" : "gap-2.5 px-2.5 py-2",
                        ),
                      }}
                    >
                      <Icon className="size-4 shrink-0 transition-colors" aria-hidden="true" />
                      {!collapsed ? <span className="truncate">{label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
