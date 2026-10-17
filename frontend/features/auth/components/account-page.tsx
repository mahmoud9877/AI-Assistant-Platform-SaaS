"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { BackLink } from "@/components/shared/back-link";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/notify";
import { authApi } from "../api";
import { passwordSchema } from "../passwords";
import { useAuthStore } from "../store";
import { LogoutButton } from "./logout-button";

const fieldClass = "bg-white/10 border-white/20 text-white placeholder:text-white/50";

const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, { message: "Enter your current password." }), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** The signed-in user's name and password. */
export default function AccountPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-eve text-white">
      <header className="bg-white/5 p-4 border-b border-white/10 flex items-center gap-4">
        <BackLink href="/home" />
        <h1 className="text-xl font-semibold me-auto">{t("account.title")}</h1>
        <LogoutButton />
      </header>
      <main className="max-w-xl mx-auto p-4 md:p-8 space-y-6">
        {user && <ProfileCard key={user.id} name={user.name ?? ""} email={user.email} />}
        <PasswordCard />
      </main>
    </div>
  );
}

function ProfileCard({ name: savedName, email }: { name: string; email: string }) {
  const { t } = useTranslation();
  const updateSession = useAuthStore((state) => state.updateSession);
  const [name, setName] = useState(savedName);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const invalid = trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 20);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      updateSession({ user: await authApi.updateProfile(trimmed) });
      notifySuccess(t("account.profileSaved"));
    } catch (err) {
      notifyError(t("account.profileFailed"), err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/10 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-lg">{t("account.profile")}</CardTitle>
        <CardDescription className="text-indigo-200">{email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4" noValidate>
          <FormField id="account-name" label={t("account.name")} error={invalid ? t("account.nameError") : undefined}>
            <Input id="account-name" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} autoComplete="name" className={fieldClass} />
          </FormField>
          <Button type="submit" disabled={invalid || saving || trimmed === savedName} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t("manageEve.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const updateSession = useAuthStore((state) => state.updateSession);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", password: "", confirm: "" } });

  const onSubmit = async ({ currentPassword, password }: ChangePasswordValues) => {
    try {
      // Other devices are signed out; this one gets a fresh session.
      updateSession(await authApi.changePassword(currentPassword, password));
      reset();
      notifySuccess(t("account.passwordChanged"), t("account.passwordChangedDesc"));
    } catch (err) {
      notifyError(t("account.passwordFailed"), err);
    }
  };

  const field = (id: keyof ChangePasswordValues, label: string, autoComplete: string) => (
    <FormField id={id} label={label} error={errors[id]?.message}>
      <Input id={id} type="password" autoComplete={autoComplete} aria-invalid={!!errors[id]} {...register(id)} className={fieldClass} />
    </FormField>
  );

  return (
    <Card className="bg-white/10 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-lg">{t("account.changePassword")}</CardTitle>
        <CardDescription className="text-indigo-200">{t("account.changePasswordDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {field("currentPassword", t("account.currentPassword"), "current-password")}
          {field("password", t("account.newPassword"), "new-password")}
          {field("confirm", t("account.confirmPassword"), "new-password")}
          <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t("account.changePassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
