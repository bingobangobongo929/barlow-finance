"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("header");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const label = theme === "dark" ? t("lightMode") : t("darkMode");

  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={t("toggleTheme")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <Moon className="h-5 w-5" strokeWidth={1.5} />
        )}
      </Button>
    </Tooltip>
  );
}
