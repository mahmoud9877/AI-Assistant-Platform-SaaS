import cors from "cors";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import type { Config } from "./config/env.js";
import type { BaseRouter } from "./core/http.js";
import { TokenService } from "./services/token.service.js";
import { PasswordHasher } from "./services/password-hasher.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { ErrorMiddleware } from "./middleware/error.middleware.js";
import { UploadMiddleware } from "./middleware/upload.middleware.js";
import { DocumentTextExtractor } from "./services/document-text-extractor.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { ChatRouter } from "./modules/chat/chat.router.js";
import { ChatService } from "./modules/chat/chat.service.js";
import { CohereService } from "./modules/chat/cohere.service.js";
import { ChatController } from "./modules/chat/chat.controller.js";
import { EmployeeRouter } from "./modules/eve-employee/eve-employee.router.js";
import { EmployeeService } from "./modules/eve-employee/eve-employee.service.js";
import { EmployeeController } from "./modules/eve-employee/eve-employee.controller.js";

export class App {
  readonly express: Express = express();

  constructor(private readonly config: Config) {
    this.registerMiddleware();
    this.registerRoutes(this.buildRouters());
  }

  listen(): void {
    this.express.listen(this.config.port, () => {
      console.log(`🚀 Server running on http://localhost:${this.config.port}`);
    });
  }

  // Composition root: every dependency is created and wired here.
  private buildRouters(): BaseRouter[] {
    const { config } = this;

    const tokens = new TokenService(config.tokenSignature);
    const authService = new AuthService(new PasswordHasher(config.saltRounds), tokens);
    const employeeService = new EmployeeService();
    const chatService = new ChatService(
      employeeService,
      new DocumentTextExtractor(),
      new CohereService(config.cohereApiKey)
    );

    const auth = new AuthMiddleware(config.bearerKey, tokens, authService);
    const upload = new UploadMiddleware(config.uploadsDir, config.isVercel);

    return [
      new AuthRouter(new AuthController(authService)),
      new EmployeeRouter(new EmployeeController(employeeService), auth, upload),
      new ChatRouter(new ChatController(chatService), auth, upload),
    ];
  }

  private registerMiddleware(): void {
    const { corsOrigins, uploadsDir } = this.config;

    this.express.use(
      cors({
        // Requests without an Origin (curl, server-to-server) are allowed.
        origin: (origin, callback) => callback(null, !origin || corsOrigins.includes(origin)),
        credentials: true,
      })
    );
    this.express.use(cookieParser());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use("/uploads", express.static(uploadsDir));
  }

  private registerRoutes(routers: BaseRouter[]): void {
    const errors = new ErrorMiddleware(this.config.isProduction);

    this.express.get("/", (_req, res) => {
      res.send("API is working!");
    });
    for (const { path, router } of routers) {
      this.express.use(path, router);
    }
    this.express.all("*", errors.notFound);
    this.express.use(errors.handle);
  }
}
