import multer from "multer";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../core/app-error.js";

export class ErrorMiddleware {
  constructor(private readonly isProduction: boolean) {}

  readonly notFound: RequestHandler = (_req, res) => {
    res.status(404).send("Invalid Routing. Please check URL or method.");
  };

  readonly handle: ErrorRequestHandler = (err: Error, _req, res, _next) => {
    const statusCode = ErrorMiddleware.statusFor(err);
    if (statusCode >= 500) console.error("❌", err);

    // AppError messages are written for the client; only unexpected errors are hidden.
    const hideMessage = statusCode >= 500 && this.isProduction && !(err instanceof AppError);
    res.status(statusCode).json({
      message: hideMessage ? "Internal Server Error" : err.message,
      ...(this.isProduction ? {} : { stack: err.stack }),
    });
  };

  private static statusFor(err: Error): number {
    if (err instanceof AppError) return err.statusCode;
    if (err instanceof multer.MulterError) return 400;
    switch (err.name) {
      case "JsonWebTokenError":
      case "TokenExpiredError":
        return 401;
      case "SequelizeUniqueConstraintError":
        return 409;
      case "SequelizeValidationError":
        return 400;
      default:
        return 500;
    }
  }
}
