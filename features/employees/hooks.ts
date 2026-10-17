"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi, type EmployeeUpdate } from "./api";

// Components read and change employee data through these hooks instead of calling the API.

export const employeeKeys = {
  all: ["employees"] as const,
  mine: () => [...employeeKeys.all, "mine"] as const,
  count: () => [...employeeKeys.all, "count"] as const,
  paged: (pageSize: number) => [...employeeKeys.all, "paged", pageSize] as const,
  detail: (id: number) => [...employeeKeys.all, "detail", id] as const,
};

/** The logged-in user's own EVE employees. */
export const useMyEmployees = () => useQuery({ queryKey: employeeKeys.mine(), queryFn: employeesApi.mine });

/** One employee's public card. */
export const useEmployee = (id: number) =>
  useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => employeesApi.get(id) });

/** How many EVE employees exist in total. */
export const useEmployeeCount = () => useQuery({ queryKey: employeeKeys.count(), queryFn: employeesApi.count });

/** All employees, fetched a page at a time; `loadMore` appends the next page. */
export function usePagedEmployees(pageSize: number) {
  const query = useInfiniteQuery({
    queryKey: employeeKeys.paged(pageSize),
    queryFn: ({ pageParam }) => employeesApi.list(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) => (pagination.page < pagination.totalPages ? pagination.page + 1 : undefined),
    meta: { errorMessage: "Failed to fetch employees" },
  });

  return {
    employees: query.data?.pages.flatMap((page) => page.employees) ?? [],
    isLoading: query.isFetching,
    hasMore: query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
  };
}

/** Creates an EVE; every employee list and count refreshes afterwards. */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => employeesApi.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

/** Updates one of the user's EVEs; every place showing employees refreshes afterwards. */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: EmployeeUpdate }) => employeesApi.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
