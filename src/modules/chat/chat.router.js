import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as validators from "./chat.validation.js";
import * as chatController from "./chat.controller.js";
import { uploadDocument } from "../../middleware/upload.js";
import { validation } from "../../middleware/validation.js";

const router = Router();

router.post(
  "/",
  auth(),
  uploadDocument.single("file"),
  validation(validators.chatMessage, ["body"]),
  chatController.uploadAndChat
);

export default router;
