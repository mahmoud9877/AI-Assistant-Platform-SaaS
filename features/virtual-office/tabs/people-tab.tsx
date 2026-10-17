"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronDown, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInitial } from "@/features/employees";
import { ALL_DEPARTMENTS, DepartmentSelect } from "@/features/departments";
import type { Employee } from "@/features/employees";

interface PeopleTabProps {
  employees: Employee[];
  /** A department id (as a string), or `ALL_DEPARTMENTS`. */
  department: string;
  onDepartmentChange: (department: string) => void;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function PeopleTab({ employees, department, onDepartmentChange, hasMore, isLoading, onLoadMore }: PeopleTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const visible = employees.filter(
    (emp) =>
      (department === ALL_DEPARTMENTS || String(emp.departmentId) === department) &&
      (!query || emp.name.toLowerCase().includes(query) || emp.department?.toLowerCase().includes(query))
  );
  const openChat = (id: number) => router.push(`/chat?employeeId=${id}`);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder={t("virtualOffice.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 bg-white border-gray-300 focus:border-gray-500"
          />
        </div>
        <DepartmentSelect
          value={department}
          onChange={onDepartmentChange}
          allLabel={t("virtualOffice.allDepartments")}
          className="w-full md:w-[200px] bg-white border-gray-300"
        />
      </div>

      <ScrollArea className="h-[600px] pe-2">
        {visible.length === 0 && !isLoading && (
          <p className="text-center text-indigo-200 mt-10">{t("virtualOffice.noEmployeesFound")}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((employee) => (
            <Card
              key={employee.id}
              role="link"
              tabIndex={0}
              className="bg-gradient-to-br from-white to-gray-50 border border-gray-300 shadow-sm rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => openChat(employee.id)}
              onKeyDown={(e) => e.key === "Enter" && openChat(employee.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <EmployeeInitial name={employee.name} className="w-10 h-10 rounded-lg" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm text-gray-800 font-medium truncate">{employee.name}</CardTitle>
                    <CardDescription className="text-gray-600 text-xs truncate">{employee.department}</CardDescription>
                  </div>
                  <MessageSquare className="ms-auto h-4 w-4 text-gray-500" aria-hidden />
                </div>
              </CardHeader>
              {employee.introduction && (
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 break-words">{employee.introduction}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={onLoadMore} variant="outline" className="flex items-center gap-2" disabled={isLoading}>
            {t("virtualOffice.loadMoreEmployees")}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
