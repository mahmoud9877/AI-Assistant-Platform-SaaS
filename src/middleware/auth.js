import env from "../config/env.js";
import { User } from "../db/models/index.js";
import { verifyToken } from "../utils/token.js";
import { AppError, asyncHandler } from "../utils/app-error.js";

// Expects `authorization: <BEARER_KEY><jwt>` and attaches the user to req.user.
export const auth = () =>
  asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization?.startsWith(env.bearerKey)) {
      throw new AppError("Invalid bearer key", 401);
    }

    const token = authorization.slice(env.bearerKey.length);
    if (!token) {
      throw new AppError("Missing token", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      throw new AppError("Invalid token payload", 401);
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email"],
    });
    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = user;
    next();
  });
