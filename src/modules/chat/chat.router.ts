import joi from "joi";
import { BaseRouter } from "../../core/http.js";
import type { ChatController } from "./chat.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import type { UploadMiddleware } from "../../middleware/upload.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

const chatMessage = joi.object({
  employeeId: joi.number().integer().positive().required(),
  message: joi.string().allow("", null),
});

export class ChatRouter extends BaseRouter {
  constructor(controller: ChatController, auth: AuthMiddleware, upload: UploadMiddleware) {
    super("/chat");
    this.router.post(
      "/",
      auth.authenticate,
      upload.document.single("file"),
      Validator.validate(chatMessage, ["body"]),
      controller.send
    );
  }
}
