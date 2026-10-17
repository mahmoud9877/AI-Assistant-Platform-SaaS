export interface User {
  id: number;
  name: string | null;
  email: string;
  /** Admins manage departments; set by the backend from its ADMIN_EMAILS setting. */
  role: "admin" | "user";
}
