"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AuthLayout, authLinkClass } from "./auth-layout";
import { LoginForm } from "./login-form";

export default function LoginScreen() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t("login.title")} description={t("login.description")}>
      <LoginForm />
      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password" className={authLinkClass}>
          {t("account.forgotPassword")}
        </Link>
        <p className="text-white/70">
          {t("account.noAccount")}{" "}
          <Link href="/signup" className={authLinkClass}>
            {t("account.createAccount")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
