import { BaseRouter } from "../../core/http.js";
import { authSchemas } from "./auth.validation.js";
import type { AuthController } from "./auth.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class AuthRouter extends BaseRouter {
  constructor(controller: AuthController, auth: AuthMiddleware) {
    super("/auth");
    const r = this.router;

    r.post("/signup", Validator.validate(authSchemas.signup), controller.signup);
    r.post("/login", Validator.validate(authSchemas.login), controller.login);
    r.post("/refresh", controller.refresh);
    r.post("/logout", controller.logout);

    r.post("/forgot-password", Validator.validate(authSchemas.forgotPassword, ["body"]), controller.forgotPassword);
    r.post("/reset-password", Validator.validate(authSchemas.resetPassword, ["body"]), controller.resetPassword);

    // Signed-in account settings.
    r.post(
      "/change-password",
      auth.authenticate,
      Validator.validate(authSchemas.changePassword, ["body"]),
      controller.changePassword
    );
    r.patch("/me", auth.authenticate, Validator.validate(authSchemas.updateProfile, ["body"]), controller.updateProfile);
  }
}
