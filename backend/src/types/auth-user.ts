export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
