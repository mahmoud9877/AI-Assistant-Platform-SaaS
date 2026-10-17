"use client";

import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { STATUSES, STATUS_LABEL_KEYS, EmployeePicker } from "@/features/employees";
import { DepartmentSelect } from "@/features/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import type { EmployeeCard, EmployeeStatus } from "@/features/employees";
import { useProfileForm } from "./use-profile-form";

const fieldClass = "border-gray-300 focus:ring-2 focus:ring-gray-500 rounded-md";
const labelClass = "text-sm text-gray-800 font-semibold";

interface ProfileTabProps {
  myEmployees: EmployeeCard[];
}

export function ProfileTab({ myEmployees }: ProfileTabProps) {
  const { t } = useTranslation();
  const { values, isSaving, edit, change, submit } = useProfileForm();

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-gray-900 text-xl font-semibold">
              {t("virtualOffice.updateYourEmployeeProfile")}
            </CardTitle>
            <CardDescription className="text-gray-700 text-sm">{t("virtualOffice.lProfile")}</CardDescription>
          </div>
          <EmployeePicker
            employees={myEmployees}
            onSelect={edit}
            title={t("virtualOffice.employeesList")}
            emptyText={t("virtualOffice.noEmployeesFound")}
            trigger={
              <Button size="sm" className="bg-gray-800 text-white hover:bg-gray-900 px-4 py-1 rounded-md shadow">
                {t("virtualOffice.selectEmployee")}
              </Button>
            }
          />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit}>
          <fieldset disabled={!values || isSaving} className="space-y-6 disabled:opacity-70">
            <FormField id="name" label={t("createEve.name")} labelClassName={labelClass}>
              <Input
                id="name"
                required
                minLength={2}
                maxLength={20}
                value={values?.name ?? ""}
                onChange={(e) => change({ name: e.target.value })}
                className={fieldClass}
                placeholder={t("createEve.name")}
              />
            </FormField>

            <FormField id="department" label={t("virtualOffice.department")} labelClassName={labelClass}>
              <DepartmentSelect
                id="department"
                value={values?.departmentId ?? ""}
                onChange={(value) => change({ departmentId: value })}
                placeholder={t("virtualOffice.departmentPlaceholder")}
                className={fieldClass}
              />
            </FormField>

            <FormField id="role" label={t("virtualOffice.role")} labelClassName={labelClass}>
              <Input
                id="role"
                required
                value={values?.role ?? ""}
                onChange={(e) => change({ role: e.target.value })}
                className={fieldClass}
                placeholder={t("virtualOffice.exampleRole")}
              />
            </FormField>

            <FormField id="status" label={t("virtualOffice.status")} labelClassName={labelClass}>
              <Select value={values?.status ?? "online"} onValueChange={(value) => change({ status: value as EmployeeStatus })}>
                <SelectTrigger id="status" className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`virtualOffice.${STATUS_LABEL_KEYS[status]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <Button
              type="submit"
              className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 me-2" />
                  {t("virtualOffice.updatingProfile")}
                </>
              ) : (
                t("virtualOffice.updateProfile")
              )}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
