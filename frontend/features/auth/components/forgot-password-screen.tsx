"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { errorMessage } from "@/lib/notify";
import { authApi } from "../api";
import { AuthLayout, authInputClass, authLinkClass } from "./auth-layout";

const schema = z.object({ email: z.string().trim().email({ message: "Enter a valid email address." }) });

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async ({ email }: { email: string }) => {
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout title={t("account.forgotTitle")} description={sentTo ? undefined : t("account.forgotDescription")}>
      {sentTo ? (
        // The same message whether or not the email has an account.
        <p role="status" className="text-white text-center">
          {t("account.forgotSent", { email: sentTo })}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <FormField id="email" label={t("login.email")} error={errors.email?.message} className="space-y-2" labelClassName="text-white" errorClassName="text-red-300">
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} className={authInputClass} />
          </FormField>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
            {t("account.sendLink")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href="/" className={authLinkClass}>
          {t("account.backToLogin")}
        </Link>
      </p>
    </AuthLayout>
  );
}
