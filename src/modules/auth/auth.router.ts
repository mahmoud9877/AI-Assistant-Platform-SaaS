import { BaseRouter } from "../../core/http.js";
import { authSchemas } from "./auth.validation.js";
import type { AuthController } from "./auth.controller.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class AuthRouter extends BaseRouter {
  constructor(controller: AuthController) {
    super("/auth");
    this.router.post("/signup", Validator.validate(authSchemas.signup), controller.signup);
    this.router.post("/login", Validator.validate(authSchemas.login), controller.login);
  }
}
