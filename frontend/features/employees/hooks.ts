"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi, type EmployeeUpdate } from "./api";
import type { EmployeeFilters } from "./types";

// Components read and change employee data through these hooks instead of calling the API.

export const employeeKeys = {
  all: ["employees"] as const,
  mine: () => [...employeeKeys.all, "mine"] as const,
  count: () => [...employeeKeys.all, "count"] as const,
  paged: (pageSize: number, filters: EmployeeFilters = {}) => [...employeeKeys.all, "paged", pageSize, filters] as const,
  detail: (id: number) => [...employeeKeys.all, "detail", id] as const,
  settings: (id: number) => [...employeeKeys.all, "settings", id] as const,
};

/** The logged-in user's own EVE employees. */
export const useMyEmployees = () => useQuery({ queryKey: employeeKeys.mine(), queryFn: employeesApi.mine });

/** One employee's public card. */
export const useEmployee = (id: number) =>
  useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => employeesApi.get(id) });

/** How many EVE employees exist in total. */
export const useEmployeeCount = () => useQuery({ queryKey: employeeKeys.count(), queryFn: employeesApi.count });

/** Employees matching `filters` (all by default), a page at a time; `loadMore` appends the next page. */
export function usePagedEmployees(pageSize: number, filters: EmployeeFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: employeeKeys.paged(pageSize, filters),
    queryFn: ({ pageParam }) => employeesApi.list(pageParam, pageSize, filters),
    // Keeps showing the last results while a new search loads, instead of flashing empty.
    placeholderData: (previous) => previous,
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) => (pagination.page < pagination.totalPages ? pagination.page + 1 : undefined),
    meta: { errorMessage: "Failed to fetch employees" },
  });

  return {
    employees: query.data?.pages.flatMap((page) => page.employees) ?? [],
    total: query.data?.pages[0]?.pagination.total ?? 0,
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

/** The owner's full, editable view of one of their EVEs. */
export const useEmployeeSettings = (id: number) =>
  useQuery({
    queryKey: employeeKeys.settings(id),
    queryFn: () => employeesApi.settings(id),
    meta: { errorMessage: "Failed to load this EVE's settings" },
  });

/** Updates one of the user's EVEs; every place showing employees refreshes afterwards. */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: EmployeeUpdate | FormData }) =>
      employeesApi.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

/** Deletes one of the user's EVEs and drops everything cached about it. */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: (_result, id) => {
      // Its chats and files are gone on the server too (keys owned by the chat and knowledge features).
      queryClient.removeQueries({ queryKey: ["chat", "conversations", id] });
      queryClient.removeQueries({ queryKey: ["knowledge", id] });
      // Refresh every list, but not the deleted EVE's own card or settings: a page still
      // showing them would otherwise ask for it again and get a 404.
      const own = [JSON.stringify(employeeKeys.detail(id)), JSON.stringify(employeeKeys.settings(id))];
      return queryClient.invalidateQueries({
        queryKey: employeeKeys.all,
        predicate: (query) => !own.includes(JSON.stringify(query.queryKey)),
      });
    },
  });
}
