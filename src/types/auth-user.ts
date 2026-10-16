export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
