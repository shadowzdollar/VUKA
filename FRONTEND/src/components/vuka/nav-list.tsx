import { Link } from "@tanstack/react-router";
import type { NavGroup } from "@/components/vuka/nav";
import { useT } from "@/lib/i18n";

/** Grouped navigation used by both the desktop sidebar and the mobile drawer. */
export function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const t = useT();
  return (
    <div className="space-y-7">
      {groups.map((group) => {
        const headingId = `nav-group-${group.labelKey}`;
        return (
          <div key={group.labelKey} role="group" aria-labelledby={headingId}>
            <div
              id={headingId}
              className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70"
            >
              {t(group.labelKey)}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      preload="intent"
                      onClick={onNavigate}
                      activeOptions={{ exact: item.exact ?? false }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all duration-150 hover:translate-x-0.5 hover:bg-accent hover:text-foreground"
                      activeProps={{
                        className: "bg-primary text-primary-foreground font-medium shadow-sm hover:translate-x-0",
                      }}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{t(item.labelKey)}</span>
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
