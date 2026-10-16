import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import authRouter from "./modules/auth/auth.router.js";
import chatRouter from "./modules/chat/chat.router.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import eveEmployeeRouter from "./modules/eve-employee/eve-employee.router.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without an Origin (curl, server-to-server) are allowed.
        callback(null, !origin || env.corsOrigins.includes(origin));
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(env.uploadsDir));

  app.get("/", (req, res) => res.send("API is working!"));
  app.use("/auth", authRouter);
  app.use("/eve-employee", eveEmployeeRouter);
  app.use("/chat", chatRouter);

  app.all("*", notFound);
  app.use(errorHandler);

  return app;
};
