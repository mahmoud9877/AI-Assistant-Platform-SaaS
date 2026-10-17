"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { toggleLanguage, otherLanguageLabel } = useLanguage();

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className={cn(
        "border-indigo-400 text-sm text-indigo-200 bg-transparent hover:bg-indigo-700 hover:text-white transition-colors",
        className
      )}
    >
      <Globe className="h-4 w-4 me-2" />
      {otherLanguageLabel}
    </Button>
  );
}
