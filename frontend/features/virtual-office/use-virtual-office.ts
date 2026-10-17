"use client";

import { useEmployeeCount, useMyEmployees, usePagedEmployees } from "@/features/employees";

const PAGE_SIZE = 12;

/** Everything the office screen shows: all employees (paged), the total, and the user's own. */
export function useVirtualOffice() {
  const paged = usePagedEmployees(PAGE_SIZE);
  const count = useEmployeeCount();
  const mine = useMyEmployees();

  return {
    employees: paged.employees,
    isLoading: paged.isLoading,
    hasMore: paged.hasMore,
    loadMore: paged.loadMore,
    count: count.data ?? 0,
    myEmployees: mine.data ?? [],
  };
}
