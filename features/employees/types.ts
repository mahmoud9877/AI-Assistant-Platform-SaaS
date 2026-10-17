import type { STATUSES } from "./constants";

export type EmployeeStatus = (typeof STATUSES)[number];

/** Fields returned by `/eve-employee/my-employee` and `/eve-employee/:id`. */
export interface EmployeeCard {
  id: number;
  name: string;
  role: string;
  departmentId: number | null;
  /** The department's name. */
  department: string | null;
  photoUrl: string | null;
  status: EmployeeStatus;
}

/** Fields returned by the paginated `/eve-employee` list. */
export interface Employee extends EmployeeCard {
  introduction: string | null;
  createdBy: number | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
