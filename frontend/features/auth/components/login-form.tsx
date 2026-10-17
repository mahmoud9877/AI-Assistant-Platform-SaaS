"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClass = "bg-white/10 border border-white/20 text-white placeholder:text-white/50";

/** Email + password form. On success the auth guard on the login page redirects. */
export function LoginForm() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async ({ email, password }: LoginValues) => {
    setErrorKey(null);
    const result = await login(email, password);
    if (!result.ok) setErrorKey(result.errorKey);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorKey && (
        <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {t(errorKey)}
        </div>
      )}

      <FormField
        id="email"
        label={t("login.email")}
        error={errors.email?.message}
        className="space-y-2"
        labelClassName="text-white"
        errorClassName="text-red-300"
      >
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
          className={inputClass}
        />
      </FormField>

      <FormField
        id="password"
        label={t("login.password")}
        error={errors.password?.message}
        className="space-y-2"
        labelClassName="text-white"
        errorClassName="text-red-300"
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
          className={inputClass}
        />
      </FormField>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t("login.signingIn")}
          </span>
        ) : (
          t("login.signIn")
        )}
      </Button>
    </form>
  );
}
