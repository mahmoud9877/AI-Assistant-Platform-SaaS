import type { RequestHandler } from "express";
import { AppError } from "../core/app-error.js";
import { asyncHandler } from "../core/http.js";
import type { AuthService } from "../modules/auth/auth.service.js";
import type { TokenService } from "../services/token.service.js";

// Expects `authorization: <bearerKey><jwt>` and attaches the user to req.user.
export class AuthMiddleware {
  constructor(
    private readonly bearerKey: string,
    private readonly tokens: TokenService,
    private readonly authService: AuthService
  ) {}

  readonly authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
    const { authorization } = req.headers;

    if (!authorization?.startsWith(this.bearerKey)) {
      throw new AppError("Invalid bearer key", 401);
    }

    const token = authorization.slice(this.bearerKey.length);
    if (!token) {
      throw new AppError("Missing token", 401);
    }

    const { id } = this.tokens.verify(token);
    if (!id) {
      throw new AppError("Invalid token payload", 401);
    }

    req.user = await this.authService.findUser(id);
    next();
  });
}
