"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  CreditCard,
  FolderKanban,
  Calendar,
  Car,
  Clock,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/transactions", icon: Receipt, labelKey: "transactions" },
  { href: "/budgets", icon: PieChart, labelKey: "budgets" },
  { href: "/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/loans", icon: CreditCard, labelKey: "loans" },
  { href: "/projects", icon: FolderKanban, labelKey: "projects" },
  { href: "/calendar", icon: Calendar, labelKey: "calendar" },
  { href: "/vehicles", icon: Car, labelKey: "vehicles" },
  { href: "/upcoming", icon: Clock, labelKey: "upcoming" },
  { href: "/advisor", icon: Sparkles, labelKey: "advisor" },
  { href: "/settings", icon: Settings, labelKey: "settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const isActive = (href: string) => {
    // Remove locale prefix from pathname for comparison
    const pathWithoutLocale = pathname.replace(/^\/(en|da)/, "");
    return (
      pathWithoutLocale === href ||
      pathWithoutLocale.startsWith(`${href}/`)
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border-default)] bg-[var(--bg-card)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-[var(--border-default)] px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
              <span className="font-heading text-lg font-bold text-white">B</span>
            </div>
            <span className="font-heading text-lg font-semibold text-[var(--text-primary)]">
              Barlow
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
              <span className="font-heading text-lg font-bold text-white">B</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const label = t(item.labelKey);

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {collapsed ? (
                  <Tooltip content={label} side="right">
                    {linkContent}
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--border-default)] p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">{t("collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
