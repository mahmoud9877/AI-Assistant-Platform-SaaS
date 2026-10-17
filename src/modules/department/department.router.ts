import { BaseRouter } from "../../core/http.js";
import { departmentSchemas } from "./department.validation.js";
import type { DepartmentController } from "./department.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class DepartmentRouter extends BaseRouter {
  constructor(controller: DepartmentController, auth: AuthMiddleware) {
    super("/departments");
    const r = this.router;

    r.use(auth.authenticate);

    // Everyone picks from the list; only admins change it.
    r.get("/", controller.list);
    r.post("/", auth.requireAdmin, Validator.validate(departmentSchemas.create, ["body"]), controller.create);
    r.patch("/:id", auth.requireAdmin, Validator.validate(departmentSchemas.rename, ["body", "params"]), controller.rename);
    r.delete("/:id", auth.requireAdmin, Validator.validate(departmentSchemas.byId, ["params"]), controller.remove);
  }
}
