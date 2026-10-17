import { BaseRouter } from "../../core/http.js";
import { conversationSchemas } from "./conversation.validation.js";
import type { ConversationController } from "./conversation.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import type { UploadMiddleware } from "../../middleware/upload.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class ConversationRouter extends BaseRouter {
  constructor(controller: ConversationController, auth: AuthMiddleware, upload: UploadMiddleware) {
    super("/conversations");
    const r = this.router;

    r.use(auth.authenticate);

    r.get("/", Validator.validate(conversationSchemas.list, ["query"]), controller.list);
    r.post("/", Validator.validate(conversationSchemas.create, ["body"]), controller.create);
    r.get("/:id", Validator.validate(conversationSchemas.byId, ["params"]), controller.get);
    r.patch("/:id", Validator.validate(conversationSchemas.rename, ["body", "params"]), controller.rename);
    r.delete("/:id", Validator.validate(conversationSchemas.byId, ["params"]), controller.remove);

    r.post(
      "/:id/messages",
      upload.document.single("file"),
      Validator.validate(conversationSchemas.send, ["body", "params"]),
      controller.send
    );
  }
}
