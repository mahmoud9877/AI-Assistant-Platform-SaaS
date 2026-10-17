"use client";

import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store";

export function LogoutButton({ className }: { className?: string }) {
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      onClick={logout}
      className={cn(
        "border-red-400 text-sm text-red-300 bg-transparent hover:bg-red-700 hover:text-white transition-colors",
        className
      )}
    >
      <LogOut className="h-4 w-4 me-2" />
      {t("home.logout")}
    </Button>
  );
}
