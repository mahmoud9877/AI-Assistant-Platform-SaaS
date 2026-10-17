"use client";

import { useTranslation } from "react-i18next";
import { EmployeeInitial } from "@/features/employees";
import { useDepartments } from "@/features/departments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "@/features/employees";

const AVATARS_SHOWN = 3;

/** One card per department. Counts come from the server; avatars from the employees loaded so far. */
export function DepartmentsTab({ employees, onView }: { employees: Employee[]; onView: (departmentId: string) => void }) {
  const { t } = useTranslation();
  const { data: departments = [] } = useDepartments();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {departments.map((dept) => {
        const members = employees.filter((emp) => emp.departmentId === dept.id);
        const total = dept.employeeCount;

        return (
          <Card
            key={dept.id}
            data-department={dept.name}
            className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md rounded-xl transition hover:shadow-lg"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-800">{dept.name}</CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                {total} {total === 1 ? "employee" : "employees"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                  {members.slice(0, AVATARS_SHOWN).map((emp) => (
                    <EmployeeInitial
                      key={emp.id}
                      name={emp.name}
                      className="w-9 h-9 rounded-full border-2 border-white text-sm shadow"
                    />
                  ))}
                  {total > Math.min(members.length, AVATARS_SHOWN) && (
                    <div className="w-9 h-9 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-sm font-semibold text-white shadow">
                      +{total - Math.min(members.length, AVATARS_SHOWN)}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-sm text-gray-700 hover:text-white hover:bg-gray-800 px-3 py-1 rounded"
                  onClick={() => onView(String(dept.id))}
                >
                  {t("virtualOffice.view")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
