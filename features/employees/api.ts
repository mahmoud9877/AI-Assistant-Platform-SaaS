import type {
  Employee,
  EmployeeCard,
  EmployeeFilters,
  EmployeeSettings,
  EmployeeStatus,
  Pagination,
  ReplyLanguage,
  Tone,
} from "./types";
import { apiRequest } from "@/lib/api-client";

export interface EmployeeUpdate {
  name?: string;
  departmentId?: number | null;
  role?: string;
  status?: EmployeeStatus;
  introduction?: string;
  tone?: Tone;
  replyLanguage?: ReplyLanguage;
  customInstructions?: string | null;
}

export const employeesApi = {
  list: (page: number, limit: number, { search, departmentId }: EmployeeFilters = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search?.trim()) params.set("search", search.trim());
    if (departmentId) params.set("departmentId", String(departmentId));
    return apiRequest<{ employees: Employee[]; pagination: Pagination }>(`/eve-employee?${params}`);
  },

  count: async () => (await apiRequest<{ count: number }>("/eve-employee/all")).count,

  mine: async () => (await apiRequest<{ employees: EmployeeCard[] }>("/eve-employee/my-employee")).employees,

  get: (id: number) => apiRequest<EmployeeCard>(`/eve-employee/${id}`),

  /** `form` holds name, departmentId, introduction and an optional `photoUrl` file. */
  create: (form: FormData) => apiRequest<{ eveEmployee: Employee }>("/eve-employee", { method: "POST", body: form }),

  /** Owner only: everything editable, including the private custom instructions. */
  settings: (id: number) => apiRequest<EmployeeSettings>(`/eve-employee/${id}/settings`),

  /** `changes` as FormData when it carries a new `photoUrl` file. */
  update: (id: number, changes: EmployeeUpdate | FormData) =>
    apiRequest<Employee>(`/eve-employee/${id}`, { method: "PUT", body: changes }),

  /** Deletes the EVE with its conversations, knowledge and photo. */
  remove: (id: number) => apiRequest<void>(`/eve-employee/${id}`, { method: "DELETE" }),
};
