"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2, MessageSquare, Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInitial, usePagedEmployees } from "@/features/employees";
import { ALL_DEPARTMENTS, DepartmentSelect } from "@/features/departments";

const PAGE_SIZE = 12;

interface PeopleTabProps {
  /** A department id (as a string), or `ALL_DEPARTMENTS`. */
  department: string;
  onDepartmentChange: (department: string) => void;
}

/** Every EVE in the office, searched and filtered by the server, a page at a time. */
export function PeopleTab({ department, onDepartmentChange }: PeopleTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  // Waits for a pause in typing before asking the server.
  const query = useDebouncedValue(search.trim(), 300);
  const { employees: visible, total, isLoading, hasMore, loadMore } = usePagedEmployees(PAGE_SIZE, {
    search: query || undefined,
    departmentId: department === ALL_DEPARTMENTS ? undefined : Number(department),
  });

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

      <p className="text-sm text-indigo-200 mb-3 flex items-center gap-2" role="status">
        {t("virtualOffice.resultsCount", { count: total })}
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label={t("virtualOffice.searching")} />}
      </p>

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
          <Button onClick={loadMore} variant="outline" className="flex items-center gap-2" disabled={isLoading}>
            {t("virtualOffice.loadMoreEmployees")}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
