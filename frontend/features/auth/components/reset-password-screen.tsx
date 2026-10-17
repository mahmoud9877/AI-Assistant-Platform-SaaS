"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { errorMessage } from "@/lib/notify";
import { authApi } from "../api";
import { newPasswordSchema } from "../passwords";
import { useAuthStore } from "../store";
import { AuthLayout, authInputClass, authLinkClass } from "./auth-layout";

type Values = z.infer<typeof newPasswordSchema>;

/** Opened from the emailed link (`?token=`); sets a new password. */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = async ({ password }: Values) => {
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      // Every session was revoked, including any in this browser.
      useAuthStore.getState().endSession("signed-out");
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const linkBroken = !/^[0-9a-f]{64}$/.test(token);

  return (
    <AuthLayout title={t("account.resetTitle")}>
      {done ? (
        <p role="status" className="text-white text-center">{t("account.resetDone")}</p>
      ) : linkBroken ? (
        <p role="alert" className="text-red-200 text-center">{t("account.resetBadLink")}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}{" "}
              <Link href="/forgot-password" className="underline">
                {t("account.askNewLink")}
              </Link>
            </div>
          )}
          <FormField id="password" label={t("account.newPassword")} error={errors.password?.message} className="space-y-2" labelClassName="text-white" errorClassName="text-red-300">
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} className={authInputClass} />
          </FormField>
          <FormField id="confirm" label={t("account.confirmPassword")} error={errors.confirm?.message} className="space-y-2" labelClassName="text-white" errorClassName="text-red-300">
            <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} className={authInputClass} />
          </FormField>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
            {t("account.setPassword")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href={linkBroken && !done ? "/forgot-password" : "/"} className={authLinkClass}>
          {linkBroken && !done ? t("account.askNewLink") : t("account.backToLogin")}
        </Link>
      </p>
    </AuthLayout>
  );
}
