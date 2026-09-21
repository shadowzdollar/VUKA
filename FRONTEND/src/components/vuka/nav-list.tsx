import { Link } from "@tanstack/react-router";
import type { NavGroup } from "@/components/vuka/nav";
import { useT } from "@/lib/i18n";

/** Grouped navigation used by both the desktop sidebar and the mobile drawer. */
export function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const t = useT();
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const headingId = `nav-group-${group.labelKey}`;
        return (
          <div key={group.labelKey} role="group" aria-labelledby={headingId}>
            <div
              id={headingId}
              className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {t(group.labelKey)}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      preload="intent"
                      onClick={onNavigate}
                      activeOptions={{ exact: item.exact ?? false }}
                      className="group flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      activeProps={{
                        className: "border-foreground bg-accent text-foreground font-medium",
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
