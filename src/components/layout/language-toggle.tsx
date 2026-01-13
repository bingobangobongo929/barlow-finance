"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" aria-label={t("toggleLanguage")}>
          <Globe className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      }
      align="end"
    >
      {locales.map((loc) => (
        <DropdownItem
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={locale === loc ? "bg-[var(--bg-hover)]" : ""}
        >
          <span className="mr-2">
            {loc === "en" ? "🇬🇧" : "🇩🇰"}
          </span>
          {localeNames[loc]}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
