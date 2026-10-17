import cors from "cors";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import type { Config } from "./config/env.js";
import type { BaseRouter } from "./core/http.js";
import { TokenService } from "./services/token.service.js";
import { PasswordHasher } from "./services/password-hasher.js";
import { Mailer } from "./services/mailer.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { ErrorMiddleware } from "./middleware/error.middleware.js";
import { UploadMiddleware } from "./middleware/upload.middleware.js";
import { DocumentTextExtractor } from "./services/document-text-extractor.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { ChatService } from "./modules/chat/chat.service.js";
import { CohereService } from "./modules/chat/cohere.service.js";
import { DepartmentRouter } from "./modules/department/department.router.js";
import { DepartmentService } from "./modules/department/department.service.js";
import { DepartmentController } from "./modules/department/department.controller.js";
import { KnowledgeRouter } from "./modules/knowledge/knowledge.router.js";
import { KnowledgeService } from "./modules/knowledge/knowledge.service.js";
import { KnowledgeController } from "./modules/knowledge/knowledge.controller.js";
import { ConversationRouter } from "./modules/conversation/conversation.router.js";
import { ConversationService } from "./modules/conversation/conversation.service.js";
import { ConversationController } from "./modules/conversation/conversation.controller.js";
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
    const authService = new AuthService(new PasswordHasher(config.saltRounds), tokens, config.adminEmails, {
      mailer: new Mailer(config.smtpUrl, config.mailFrom),
      appUrl: config.appUrl,
    });
    const employeeService = new EmployeeService(config.isVercel ? undefined : config.uploadsDir);
    const cohere = new CohereService(config.cohereApiKey, config.cohereModel);
    const knowledgeService = new KnowledgeService(employeeService, new DocumentTextExtractor(), cohere);
    const chatService = new ChatService(knowledgeService, cohere);
    const conversationService = new ConversationService(employeeService, chatService);

    const auth = new AuthMiddleware(config.bearerKey, tokens, authService);
    const upload = new UploadMiddleware(config.uploadsDir, config.isVercel);

    return [
      new AuthRouter(
        new AuthController(authService, {
          isProduction: config.isProduction,
          sameSite: config.cookieSameSite,
          apiPathPrefix: config.apiPathPrefix,
        }),
        auth
      ),
      new DepartmentRouter(new DepartmentController(new DepartmentService()), auth),
      new EmployeeRouter(new EmployeeController(employeeService), auth, upload),
      new KnowledgeRouter(new KnowledgeController(knowledgeService), auth, upload),
      new ConversationRouter(new ConversationController(conversationService), auth, upload),
    ];
  }

  private registerMiddleware(): void {
    const { corsOrigins, uploadsDir } = this.config;

    // Requests arrive through a proxy (Caddy, Vercel); trust its X-Forwarded-* headers
    // so req.secure, req.protocol and req.ip describe the real client connection.
    this.express.set("trust proxy", 1);

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
