import type { Employee, EmployeeCard, EmployeeStatus, Pagination } from "./types";
import { apiRequest } from "@/lib/api-client";

export interface EmployeeUpdate {
  name?: string;
  departmentId?: number | null;
  role?: string;
  status?: EmployeeStatus;
}

export const employeesApi = {
  list: (page: number, limit: number) =>
    apiRequest<{ employees: Employee[]; pagination: Pagination }>(`/eve-employee?page=${page}&limit=${limit}`),

  count: async () => (await apiRequest<{ count: number }>("/eve-employee/all")).count,

  mine: async () => (await apiRequest<{ employees: EmployeeCard[] }>("/eve-employee/my-employee")).employees,

  get: (id: number) => apiRequest<EmployeeCard>(`/eve-employee/${id}`),

  /** `form` holds name, departmentId, introduction and an optional `photoUrl` file. */
  create: (form: FormData) => apiRequest<{ eveEmployee: Employee }>("/eve-employee", { method: "POST", body: form }),

  update: (id: number, changes: EmployeeUpdate) =>
    apiRequest<Employee>(`/eve-employee/${id}`, { method: "PUT", body: changes }),
};
