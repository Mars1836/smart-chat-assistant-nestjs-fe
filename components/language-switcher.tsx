"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        type="button"
        variant={locale === "vi" ? "default" : "ghost"}
        size={compact ? "sm" : "sm"}
        className="h-8 px-3"
        onClick={() => setLocale("vi")}
      >
        VI
      </Button>
      <Button
        type="button"
        variant={locale === "en" ? "default" : "ghost"}
        size={compact ? "sm" : "sm"}
        className="h-8 px-3"
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  );
}
