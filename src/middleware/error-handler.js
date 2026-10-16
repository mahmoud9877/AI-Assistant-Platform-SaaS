import multer from "multer";
import env from "../config/env.js";

const statusFor = (err) => {
  if (err.statusCode) return err.statusCode;
  if (err instanceof multer.MulterError) return 400;
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") return 401;
  if (err.name === "SequelizeUniqueConstraintError") return 409;
  if (err.name === "SequelizeValidationError") return 400;
  return 500;
};

export const notFound = (req, res) => {
  res.status(404).send("Invalid Routing. Please check URL or method.");
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = statusFor(err);
  if (statusCode >= 500) console.error("❌", err);

  res.status(statusCode).json({
    message: statusCode >= 500 && env.isProduction ? "Internal Server Error" : err.message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};
