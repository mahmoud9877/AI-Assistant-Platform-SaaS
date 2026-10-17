"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuthStore } from "@/features/auth";
import { notifyError, notifySuccess } from "@/lib/notify";
import { BackLink } from "@/components/shared/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDepartmentActions, useDepartments } from "../hooks";
import type { Department } from "../types";

const inputClass = "bg-white/10 border-white/20 text-white placeholder:text-white/50";

/** Admins add, rename and delete the departments EVEs can belong to. */
export default function DepartmentsPage() {
  const { t } = useTranslation();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  return (
    <div className="min-h-screen bg-eve text-white">
      <header className="bg-white/5 p-4 border-b border-white/10 flex items-center gap-4">
        <BackLink href="/home" />
        <h1 className="text-xl font-semibold">{t("manageDepartments.title")}</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <DepartmentManager />
        ) : (
          <p className="text-center text-indigo-200 mt-16">{t("manageDepartments.adminsOnly")}</p>
        )}
      </main>
    </div>
  );
}

function DepartmentManager() {
  const { t } = useTranslation();
  const { data: departments = [], isPending } = useDepartments();
  const { create } = useDepartmentActions();
  const [name, setName] = useState("");

  const add = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(trimmed, {
      onSuccess: () => {
        setName("");
        notifySuccess(t("manageDepartments.added", { name: trimmed }));
      },
      onError: (err) => notifyError(t("manageDepartments.addFailed"), err),
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-indigo-200">{t("manageDepartments.description")}</p>

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={t("manageDepartments.newPlaceholder")}
          aria-label={t("manageDepartments.newPlaceholder")}
          className={inputClass}
        />
        <Button type="submit" disabled={!name.trim() || create.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {create.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
          {t("manageDepartments.add")}
        </Button>
      </form>

      <section aria-labelledby="departments-heading" className="space-y-2">
        <h2 id="departments-heading" className="font-semibold">
          {t("manageDepartments.count", { count: departments.length })}
        </h2>
        {isPending && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-indigo-200" />}
        <ul className="space-y-2">
          {departments.map((department) => (
            <DepartmentRow key={department.id} department={department} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function DepartmentRow({ department }: { department: Department }) {
  const { t } = useTranslation();
  const { rename, remove } = useDepartmentActions();
  const [draft, setDraft] = useState<string | null>(null);
  const inUse = department.employeeCount > 0;

  const save = () => {
    const name = draft?.trim();
    if (!name || name === department.name) {
      setDraft(null);
      return;
    }
    rename.mutate(
      { id: department.id, name },
      { onSuccess: () => setDraft(null), onError: (err) => notifyError(t("manageDepartments.renameFailed"), err) }
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setDraft(null);
  };

  const confirmRemove = () => {
    if (!window.confirm(t("manageDepartments.confirmDelete", { name: department.name }))) return;
    remove.mutate(department.id, { onError: (err) => notifyError(t("manageDepartments.deleteFailed"), err) });
  };

  return (
    <li className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
      <Building2 className="h-5 w-5 shrink-0 text-indigo-300" />
      {draft !== null ? (
        <>
          <Input
            autoFocus
            value={draft}
            maxLength={100}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t("manageDepartments.nameLabel")}
            className={`h-8 ${inputClass}`}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={save} disabled={rename.isPending} aria-label={t("manageDepartments.save")}>
            {rename.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setDraft(null)} aria-label={t("manageDepartments.cancel")}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{department.name}</p>
            <p className="text-xs text-indigo-200">{t("manageDepartments.employees", { count: department.employeeCount })}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-indigo-200 hover:text-white hover:bg-white/10"
            onClick={() => setDraft(department.name)}
            aria-label={t("manageDepartments.rename", { name: department.name })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-300 hover:text-red-100 hover:bg-red-700/60 disabled:opacity-40"
            onClick={confirmRemove}
            // Only empty departments can go; the server enforces this too.
            disabled={inUse || remove.isPending}
            title={inUse ? t("manageDepartments.inUse") : undefined}
            aria-label={t("manageDepartments.delete", { name: department.name })}
          >
            {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </>
      )}
    </li>
  );
}
