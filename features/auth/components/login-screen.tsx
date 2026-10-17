"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { LoginForm } from "./login-form";

export default function LoginScreen() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-eve">
      <AnimatedBackground />

      <div className="absolute top-4 end-4 z-10">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md p-6 relative z-10">
        <Card className="w-full shadow-xl border border-white/10 bg-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-3 flex flex-col items-center text-white">
            <Image
              src="/placeholder.svg"
              alt="EVE Logo"
              width={80}
              height={80}
              priority
              className="mb-2 rounded-full border border-white/20 shadow-md"
            />
            <CardTitle className="text-2xl font-semibold text-center">{t("login.title")}</CardTitle>
            <CardDescription className="text-center text-sm text-white/70">{t("login.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
