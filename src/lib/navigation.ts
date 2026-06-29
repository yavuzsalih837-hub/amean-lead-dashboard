import {
  LayoutDashboard,
  Users,
  Sliders,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Lead Listesi", icon: Users },
  { href: "/search-settings", label: "Arama Ayarları", icon: Sliders },
  { href: "/logs", label: "Workflow Logları", icon: ScrollText },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];
