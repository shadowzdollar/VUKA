import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileText,
  Gauge,
  Globe,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Scale,
  Send,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem {
  to: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  /** Exact match for "/" so it is not active on every page. */
  exact?: boolean;
}

export interface NavGroup {
  labelKey: MessageKey;
  items: NavItem[];
}

export const traderNav: NavGroup[] = [
  {
    labelKey: "nav.group.money",
    items: [
      { to: "/", labelKey: "nav.overview", icon: LayoutDashboard, exact: true },
      { to: "/wallets", labelKey: "nav.wallets", icon: Wallet },
      { to: "/send", labelKey: "nav.send", icon: Send },
      { to: "/escrow", labelKey: "nav.invoices", icon: FileText },
    ],
  },
  {
    labelKey: "nav.group.trust",
    items: [
      { to: "/trust-score", labelKey: "nav.trust", icon: Gauge },
      { to: "/analytics", labelKey: "nav.insights", icon: BarChart3 },
      { to: "/verification", labelKey: "nav.verification", icon: ClipboardCheck },
    ],
  },
  {
    labelKey: "nav.group.network",
    items: [
      { to: "/corridors", labelKey: "nav.corridors", icon: Globe },
      { to: "/support", labelKey: "nav.support", icon: LifeBuoy },
    ],
  },
];

export const operatorNav: NavGroup[] = [
  {
    labelKey: "nav.group.operations",
    items: [
      { to: "/", labelKey: "nav.cockpit", icon: LayoutDashboard, exact: true },
      { to: "/escrow", labelKey: "nav.escrow", icon: Landmark },
      { to: "/disputes", labelKey: "nav.disputes", icon: Scale },
      { to: "/analytics", labelKey: "nav.intelligence", icon: BarChart3 },
      { to: "/settlements", labelKey: "nav.settlements", icon: Send },
    ],
  },
  {
    labelKey: "nav.group.governance",
    items: [
      { to: "/compliance", labelKey: "nav.compliance", icon: ShieldCheck },
      { to: "/activity", labelKey: "nav.activity", icon: Activity },
    ],
  },
  {
    labelKey: "nav.group.network",
    items: [{ to: "/corridors", labelKey: "nav.providers", icon: Globe }],
  },
];
