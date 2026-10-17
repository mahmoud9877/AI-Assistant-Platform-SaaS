"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "@/features/employees";
import { departmentsApi } from "./api";

export const departmentKeys = {
  all: ["departments"] as const,
};

/** Every department, A–Z, with employee counts. */
export const useDepartments = () =>
  useQuery({
    queryKey: departmentKeys.all,
    queryFn: departmentsApi.list,
    meta: { errorMessage: "Failed to load departments" },
  });

/** Admin changes to departments. Employees show their department's name, so they refresh too. */
export function useDepartmentActions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
    ]);

  return {
    create: useMutation({ mutationFn: departmentsApi.create, onSuccess: refresh }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: number; name: string }) => departmentsApi.rename(id, name),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: departmentsApi.remove, onSuccess: refresh }),
  };
}
