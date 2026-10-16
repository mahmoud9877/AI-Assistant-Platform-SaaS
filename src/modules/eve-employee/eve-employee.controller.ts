import { asyncHandler, BaseController } from "../../core/http.js";
import type { EmployeeService } from "./eve-employee.service.js";
import { UploadMiddleware } from "../../middleware/upload.middleware.js";

export class EmployeeController extends BaseController {
  constructor(private readonly employees: EmployeeService) {
    super();
  }

  readonly list = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    res.status(200).json(await this.employees.list(page, limit));
  });

  readonly count = asyncHandler(async (_req, res) => {
    res.status(200).json({ count: await this.employees.count() });
  });

  readonly listMine = asyncHandler(async (req, res) => {
    const employees = await this.employees.listOwnedBy(this.currentUser(req).id);
    res.status(200).json({ message: "Done", employees });
  });

  readonly getById = asyncHandler(async (req, res) => {
    res.status(200).json(await this.employees.getCard(Number(req.params.id)));
  });

  readonly create = asyncHandler(async (req, res) => {
    const eveEmployee = await this.employees.create(
      this.currentUser(req).id,
      req.body,
      UploadMiddleware.photoUrlFor(req.file)
    );
    res.status(201).json({ message: "Done", eveEmployee });
  });

  readonly update = asyncHandler(async (req, res) => {
    const employee = await this.employees.update(
      Number(req.params.id),
      this.currentUser(req).id,
      req.body,
      UploadMiddleware.photoUrlFor(req.file)
    );
    res.status(200).json(employee);
  });
}
