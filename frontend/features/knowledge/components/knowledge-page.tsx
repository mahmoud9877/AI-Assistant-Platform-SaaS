"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { FileText, Loader2, MessageSquare, Trash2, Upload } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/notify";
import { useMyEmployees, type EmployeeCard } from "@/features/employees";
import { BackLink } from "@/components/shared/back-link";
import { PageLoader } from "@/components/layout/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKnowledge, useKnowledgeActions } from "../hooks";
import { MAX_KNOWLEDGE_CHARACTERS, type KnowledgeDocument } from "../types";

const ACCEPTED_FILES = ".pdf,.docx";

/** Lets an owner see, add and remove the files one of their EVEs answers from. */
export default function KnowledgePage() {
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
        <h1 className="text-xl font-semibold me-auto">{t("knowledge.title")}</h1>
        {employees.length > 1 && employee && (
          <Select
            value={String(employee.id)}
            onValueChange={(id) => router.replace(`${pathname}?employeeId=${id}`)}
          >
            <SelectTrigger className="w-56 bg-white/10 border-white/20 text-white" aria-label={t("knowledge.chooseEve")}>
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
          // Keyed so an upload in progress doesn't show under another EVE.
          <EmployeeKnowledge key={employee.id} employee={employee} />
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

function EmployeeKnowledge({ employee }: { employee: EmployeeCard }) {
  const { t } = useTranslation();
  const { data: documents = [], isLoading } = useKnowledge(employee.id);
  const { upload: uploadFile } = useKnowledgeActions(employee.id);
  const uploading = uploadFile.isPending ? (uploadFile.variables?.name ?? "") : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const used = documents.reduce((sum, d) => sum + d.characters, 0);
  const usedPercent = Math.min(100, Math.round((used / MAX_KNOWLEDGE_CHARACTERS) * 100));

  const upload = (file: File) =>
    uploadFile.mutate(file, {
      onSuccess: () => notifySuccess(t("knowledge.uploaded", { name: employee.name }), file.name),
      onError: (err) => notifyError(t("knowledge.uploadFailed"), err),
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("knowledge.heading", { name: employee.name })}</h2>
          <p className="text-sm text-indigo-200">{t("knowledge.description", { name: employee.name })}</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
          <Link href={`/chat?employeeId=${employee.id}`}>
            <MessageSquare className="h-4 w-4 me-2" />
            {t("home.startChat")}
          </Link>
        </Button>
      </div>

      <Card className="bg-white/10 border-white/10 text-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium">{t("knowledge.addFile")}</p>
            <p className="text-sm text-indigo-200">{t("knowledge.fileTypes")}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading !== null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {uploading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
            {uploading ? t("knowledge.uploading") : t("knowledge.upload")}
          </Button>
        </CardContent>
        {uploading && (
          <p className="px-6 pb-4 -mt-2 text-xs text-indigo-200 truncate" role="status">
            {t("knowledge.reading", { name: uploading })}
          </p>
        )}
      </Card>

      <section aria-labelledby="files-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 id="files-heading" className="font-semibold">
            {t("knowledge.files", { count: documents.length })}
          </h3>
          <span className="text-xs text-indigo-200">{t("knowledge.usage", { percent: usedPercent })}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden" aria-hidden>
          <div className="h-full bg-indigo-400" style={{ width: `${usedPercent}%` }} />
        </div>

        {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-indigo-200" />}
        {!isLoading && documents.length === 0 && (
          <p className="text-center text-indigo-200 py-8">{t("knowledge.empty", { name: employee.name })}</p>
        )}
        <ul className="space-y-2">
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function DocumentRow({ document }: { document: KnowledgeDocument }) {
  const { t } = useTranslation();
  const { remove: removeFile } = useKnowledgeActions(document.employeeId);
  // Stays on after success: the row disappears once the list refetches.
  const removing = removeFile.isPending || removeFile.isSuccess;

  const remove = () => {
    if (!window.confirm(t("knowledge.confirmDelete", { name: document.fileName }))) return;
    removeFile.mutate(document.id, { onError: (err) => notifyError(t("knowledge.deleteFailed"), err) });
  };

  return (
    <li className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
      <FileText className="h-5 w-5 shrink-0 text-indigo-300" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{document.fileName}</p>
        <p className="text-xs text-indigo-200">
          {format(new Date(document.createdAt), "PP")} · {t("knowledge.characters", { count: document.characters })}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        disabled={removing}
        onClick={remove}
        className="text-red-300 hover:text-red-100 hover:bg-red-700/60"
        aria-label={t("knowledge.delete", { name: document.fileName })}
      >
        {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </li>
  );
}
