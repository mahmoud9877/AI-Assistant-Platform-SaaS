import type { REPLY_LANGUAGES, STATUSES, TONES } from "./constants";

export type Tone = (typeof TONES)[number];
export type ReplyLanguage = (typeof REPLY_LANGUAGES)[number];

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

/** Everything the owner can edit about their EVE (`/eve-employee/:id/settings`). */
export interface EmployeeSettings extends Employee {
  tone: Tone;
  replyLanguage: ReplyLanguage;
  /** Private guidance added to the EVE's prompt. */
  customInstructions: string | null;
}

/** Server-side filters for the paged employee list. */
export interface EmployeeFilters {
  search?: string;
  departmentId?: number;
}
