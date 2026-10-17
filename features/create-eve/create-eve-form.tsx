"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/shared/back-link";
import { DepartmentSelect } from "@/features/departments";
import { FormField } from "@/components/shared/form-field";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { LogoutButton } from "@/features/auth";
import { useCreateEveForm } from "./use-create-eve-form";

const fieldClass = "bg-white/20 border-white/30 text-white";

export default function CreateEveForm() {
  const { t } = useTranslation();
  const { form, photo, submit } = useCreateEveForm();
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="min-h-screen bg-eve py-12 px-4">
      <div className="flex justify-end items-center gap-3 px-4 py-2">
        <LanguageToggle />
        <LogoutButton />
      </div>

      <div className="container mx-auto max-w-3xl">
        <BackLink href="/home" label={t("common.back")} className="mb-6" />

        <Card className="bg-white/10 text-white border-none backdrop-blur-md">
          <CardHeader>
            <CardTitle>{t("createEve.title")}</CardTitle>
            <CardDescription className="text-blue-200">{t("createEve.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6" noValidate>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <FormField id="name" label={t("createEve.name")} error={errors.name?.message}>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder={t("createEve.namePlaceholder")}
                      className={fieldClass}
                    />
                  </FormField>

                  <FormField id="department" label={t("createEve.department")} error={errors.departmentId?.message}>
                    <Controller
                      name="departmentId"
                      control={control}
                      render={({ field }) => (
                        <DepartmentSelect
                          id="department"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("createEve.departmentPlaceholder")}
                          className={fieldClass}
                        />
                      )}
                    />
                  </FormField>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-white/20">
                    <Image
                      src={photo.preview || "/placeholder.svg"}
                      alt="Employee"
                      width={160}
                      height={160}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                  <Label
                    htmlFor="photo"
                    className="bg-white/20 text-white px-4 py-2 rounded-md cursor-pointer flex items-center hover:bg-white/30"
                  >
                    <Upload className="me-2 h-4 w-4" />
                    {t("createEve.uploadPhoto")}
                  </Label>
                  <Input id="photo" type="file" accept={photo.accept} onChange={photo.choose} className="hidden" />
                  {photo.file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={photo.clear}
                      className="text-red-400 hover:text-red-600"
                    >
                      {t("common.delete")}
                    </Button>
                  )}
                </div>
              </div>

              <FormField id="introduction" label={t("createEve.introduction")} error={errors.introduction?.message}>
                <Textarea
                  id="introduction"
                  {...register("introduction")}
                  placeholder={t("createEve.introductionPlaceholder")}
                  rows={5}
                  className={fieldClass}
                />
              </FormField>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? t("common.submitting") : t("createEve.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
