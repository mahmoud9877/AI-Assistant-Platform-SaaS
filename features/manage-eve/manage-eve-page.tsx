"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2, MessageSquare, Trash2, Upload } from "lucide-react";
import { assetUrl } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/notify";
import { usePhoto } from "@/hooks/use-photo";
import {
  REPLY_LANGUAGES,
  TONES,
  useDeleteEmployee,
  useEmployeeSettings,
  useMyEmployees,
  useUpdateEmployee,
  type EmployeeSettings,
  type ReplyLanguage,
  type Tone,
} from "@/features/employees";
import { DepartmentSelect } from "@/features/departments";
import { BackLink } from "@/components/shared/back-link";
import { FormField } from "@/components/shared/form-field";
import { PageLoader } from "@/components/layout/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fieldClass = "bg-white/10 border-white/20 text-white placeholder:text-white/50";
const INSTRUCTIONS_MAX = 2000;

/** Lets an owner edit, retune or delete one of their EVEs. */
export default function ManageEvePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const requestedId = Number(useSearchParams().get("employeeId"));
  const { data: employees = [], isLoading } = useMyEmployees();
  // The EVE in the URL if it's one of the user's, else their first.
  const employee = employees.find((e) => e.id === requestedId) ?? employees[0] ?? null;

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-eve text-white">
      <header className="bg-white/5 p-4 border-b border-white/10 flex flex-wrap items-center gap-4">
        <BackLink href="/home" />
        <h1 className="text-xl font-semibold me-auto">{t("manageEve.title")}</h1>
        {employees.length > 1 && employee && (
          <Select value={String(employee.id)} onValueChange={(id) => router.replace(`${pathname}?employeeId=${id}`)}>
            <SelectTrigger className={`w-56 ${fieldClass}`} aria-label={t("knowledge.chooseEve")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        {employee ? (
          <EveSettings key={employee.id} employeeId={employee.id} />
        ) : (
          <div className="text-center mt-16 space-y-4">
            <p className="text-indigo-200">{t("knowledge.noEve")}</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/create-eve">{t("home.createEve")}</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function EveSettings({ employeeId }: { employeeId: number }) {
  const { data: settings, isPending } = useEmployeeSettings(employeeId);
  if (isPending || !settings) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16 text-indigo-200" />;
  // Keyed by the loaded data's id so the form starts from the saved values.
  return <SettingsForm key={settings.id} settings={settings} />;
}

function SettingsForm({ settings }: { settings: EmployeeSettings }) {
  const { t } = useTranslation();
  const router = useRouter();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const photo = usePhoto();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(settings.name);
  const [departmentId, setDepartmentId] = useState(settings.departmentId ? String(settings.departmentId) : "");
  const [introduction, setIntroduction] = useState(settings.introduction ?? "");
  const [tone, setTone] = useState<Tone>(settings.tone);
  const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>(settings.replyLanguage);
  const [instructions, setInstructions] = useState(settings.customInstructions ?? "");

  const nameError = name.trim().length < 2 || name.trim().length > 20 ? t("manageEve.nameError") : undefined;
  const introError = introduction.trim().length < 2 ? t("manageEve.introError") : undefined;
  const canSave = !nameError && !introError && !update.isPending;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const savedName = name.trim();
    try {
      await update.mutateAsync({
        id: settings.id,
        changes: {
          name: savedName,
          departmentId: departmentId ? Number(departmentId) : null,
          introduction: introduction.trim(),
          tone,
          replyLanguage,
          customInstructions: instructions.trim() || null,
        },
      });
      // A file has to go as multipart form data, so the photo is sent on its own.
      if (photo.file) {
        const form = new FormData();
        form.append("photoUrl", photo.file);
        await update.mutateAsync({ id: settings.id, changes: form });
        photo.clear();
      }
      notifySuccess(t("manageEve.saved", { name: savedName }));
    } catch (err) {
      notifyError(t("manageEve.saveFailed"), err);
    }
  };

  const deleteEve = () => {
    if (!window.confirm(t("manageEve.confirmDelete", { name: settings.name }))) return;
    remove.mutate(settings.id, {
      onSuccess: () => {
        notifySuccess(t("manageEve.deleted", { name: settings.name }));
        router.replace("/home");
      },
      onError: (err) => notifyError(t("manageEve.deleteFailed"), err),
    });
  };

  const photoSrc = photo.preview || assetUrl(settings.photoUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
          <Link href={`/chat?employeeId=${settings.id}`}>
            <MessageSquare className="h-4 w-4 me-2" />
            {t("home.startChat")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
          <Link href={`/knowledge?employeeId=${settings.id}`}>
            <BookOpen className="h-4 w-4 me-2" />
            {t("home.manageFiles")}
          </Link>
        </Button>
      </div>

      <form onSubmit={save} className="space-y-6" noValidate>
        <Card className="bg-white/10 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">{t("manageEve.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-semibold shrink-0">
                {photoSrc ? (
                  <Image src={photoSrc} alt="" width={80} height={80} unoptimized className="h-full w-full object-cover" />
                ) : (
                  settings.name[0]
                )}
              </div>
              <input ref={photoInputRef} type="file" accept={photo.accept} hidden onChange={photo.choose} />
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/10"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 me-2" />
                  {t("manageEve.changePhoto")}
                </Button>
                {photo.file && <p className="text-xs text-indigo-200">{t("manageEve.photoPending")}</p>}
              </div>
            </div>

            <FormField id="eve-name" label={t("createEve.name")} error={name !== settings.name ? nameError : undefined}>
              <Input id="eve-name" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </FormField>

            <FormField id="eve-department" label={t("createEve.department")}>
              <DepartmentSelect
                id="eve-department"
                value={departmentId}
                onChange={setDepartmentId}
                placeholder={t("createEve.departmentPlaceholder")}
                className={fieldClass}
              />
            </FormField>

            <FormField id="eve-intro" label={t("manageEve.introduction")} error={introError}>
              <Textarea
                id="eve-intro"
                value={introduction}
                maxLength={2000}
                rows={4}
                onChange={(e) => setIntroduction(e.target.value)}
                className={fieldClass}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">{t("manageEve.personality")}</CardTitle>
            <CardDescription className="text-indigo-200">{t("manageEve.personalityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField id="eve-tone" label={t("manageEve.tone")}>
                <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                  <SelectTrigger id="eve-tone" className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`manageEve.tones.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="eve-language" label={t("manageEve.replyLanguage")}>
                <Select value={replyLanguage} onValueChange={(value) => setReplyLanguage(value as ReplyLanguage)}>
                  <SelectTrigger id="eve-language" className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPLY_LANGUAGES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`manageEve.languages.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField id="eve-instructions" label={t("manageEve.instructions")}>
              <Textarea
                id="eve-instructions"
                value={instructions}
                maxLength={INSTRUCTIONS_MAX}
                rows={5}
                placeholder={t("manageEve.instructionsPlaceholder")}
                onChange={(e) => setInstructions(e.target.value)}
                aria-describedby="eve-instructions-help"
                className={fieldClass}
              />
              <p id="eve-instructions-help" className="text-xs text-indigo-200 flex justify-between gap-4">
                <span>{t("manageEve.instructionsHelp")}</span>
                <span className="shrink-0">
                  {instructions.length}/{INSTRUCTIONS_MAX}
                </span>
              </p>
            </FormField>
          </CardContent>
        </Card>

        <Button type="submit" disabled={!canSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          {update.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {t("manageEve.save")}
        </Button>
      </form>

      <Card className="bg-red-950/30 border-red-500/30 text-white">
        <CardHeader>
          <CardTitle className="text-lg">{t("manageEve.dangerZone")}</CardTitle>
          <CardDescription className="text-red-200">{t("manageEve.deleteDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={deleteEve}
            disabled={remove.isPending}
            className="border-red-400 text-red-200 bg-transparent hover:bg-red-700 hover:text-white"
          >
            {remove.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Trash2 className="h-4 w-4 me-2" />}
            {t("manageEve.delete", { name: settings.name })}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
