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
import { passwordSchema } from "../passwords";
import { useAuthStore } from "../store";
import { AuthLayout, authInputClass, authLinkClass } from "./auth-layout";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, { message: "At least 2 characters." }).max(20, { message: "At most 20 characters." }),
    email: z.string().trim().email({ message: "Enter a valid email address." }),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

type SignupValues = z.infer<typeof signupSchema>;

/** Creates an account and signs straight in; the guest guard then moves on to the app. */
export default function SignupScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { name: "", email: "", password: "", confirm: "" } });

  const onSubmit = async ({ name, email, password }: SignupValues) => {
    setError(null);
    try {
      await authApi.signup(email.trim(), password, name.trim());
    } catch (err) {
      setError(errorMessage(err));
      return;
    }
    const result = await login(email, password);
    if (!result.ok) setError(t(result.errorKey));
  };

  const field = (id: keyof SignupValues, label: string, type: string, autoComplete: string) => (
    <FormField id={id} label={label} error={errors[id]?.message} className="space-y-2" labelClassName="text-white" errorClassName="text-red-300">
      <Input id={id} type={type} autoComplete={autoComplete} aria-invalid={!!errors[id]} {...register(id)} className={authInputClass} />
    </FormField>
  );

  return (
    <AuthLayout title={t("account.signupTitle")} description={t("account.signupDescription")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {field("name", t("account.name"), "text", "name")}
        {field("email", t("login.email"), "email", "email")}
        {field("password", t("login.password"), "password", "new-password")}
        {field("confirm", t("account.confirmPassword"), "password", "new-password")}
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
          {isSubmitting ? t("account.creating") : t("account.createAccount")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-white/70">
        {t("account.haveAccount")}{" "}
        <Link href="/" className={authLinkClass}>
          {t("login.signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
