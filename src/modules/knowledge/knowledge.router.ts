import { BaseRouter } from "../../core/http.js";
import { knowledgeSchemas } from "./knowledge.validation.js";
import type { KnowledgeController } from "./knowledge.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import type { UploadMiddleware } from "../../middleware/upload.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class KnowledgeRouter extends BaseRouter {
  constructor(controller: KnowledgeController, auth: AuthMiddleware, upload: UploadMiddleware) {
    super("/knowledge");
    const r = this.router;

    r.use(auth.authenticate);

    r.get("/", Validator.validate(knowledgeSchemas.list, ["query"]), controller.list);
    r.post(
      "/",
      upload.document.single("file"),
      Validator.validate(knowledgeSchemas.upload, ["body"]),
      controller.upload
    );
    r.delete("/:id", Validator.validate(knowledgeSchemas.byId, ["params"]), controller.remove);
  }
}
