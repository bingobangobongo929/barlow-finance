"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-card)] px-6 transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-[280px]"
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-xl font-semibold text-[var(--text-primary)]">
          {t("appName")}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notifications")}
          className="relative"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </Button>

        <LanguageToggle />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
