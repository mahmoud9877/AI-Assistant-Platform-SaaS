import { apiRequest } from "@/lib/api-client";
import type { Department } from "./types";

export const departmentsApi = {
  list: async () => (await apiRequest<{ departments: Department[] }>("/departments")).departments,

  // Admin only.
  create: async (name: string) =>
    (await apiRequest<{ department: Department }>("/departments", { method: "POST", body: { name } })).department,

  rename: async (id: number, name: string) =>
    (await apiRequest<{ department: Department }>(`/departments/${id}`, { method: "PATCH", body: { name } })).department,

  remove: (id: number) => apiRequest<void>(`/departments/${id}`, { method: "DELETE" }),
};
