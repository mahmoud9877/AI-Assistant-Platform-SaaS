import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { AppError } from "./app-error.js";
import type { AuthUser } from "../types/auth-user.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Forwards rejected promises to Express's error handler (Express 4 doesn't).
export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export abstract class BaseController {
  protected currentUser(req: Request): AuthUser {
    if (!req.user) throw new AppError("Unauthorized", 401);
    return req.user;
  }
}

export abstract class BaseRouter {
  readonly router = Router();

  constructor(readonly path: string) {}
}
