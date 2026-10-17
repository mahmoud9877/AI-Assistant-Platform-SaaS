import { BaseRouter } from "../../core/http.js";
import { employeeSchemas } from "./eve-employee.validation.js";
import type { EmployeeController } from "./eve-employee.controller.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import type { UploadMiddleware } from "../../middleware/upload.middleware.js";
import { Validator } from "../../middleware/validation.middleware.js";

export class EmployeeRouter extends BaseRouter {
  constructor(controller: EmployeeController, auth: AuthMiddleware, upload: UploadMiddleware) {
    super("/eve-employee");
    const r = this.router;

    r.use(auth.authenticate);

    r.get("/", Validator.validate(employeeSchemas.list), controller.list);
    r.get("/all", controller.count);
    r.get("/my-employee", controller.listMine);
    r.get("/:id", Validator.validate(employeeSchemas.byId), controller.getById);
    // Owner only: everything editable about the EVE, including private instructions.
    r.get("/:id/settings", Validator.validate(employeeSchemas.byId, ["params"]), controller.getSettings);
    r.delete("/:id", Validator.validate(employeeSchemas.byId, ["params"]), controller.remove);

    r.post(
      "/",
      upload.image.single("photoUrl"),
      Validator.validate(employeeSchemas.create, ["body"]),
      controller.create
    );

    r.put(
      "/:id",
      upload.image.single("photoUrl"),
      Validator.validate(employeeSchemas.update, ["body", "params"]),
      controller.update
    );
  }
}
