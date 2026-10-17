import { asyncHandler, BaseController } from "../../core/http.js";
import type { DepartmentService } from "./department.service.js";

export class DepartmentController extends BaseController {
  constructor(private readonly departments: DepartmentService) {
    super();
  }

  readonly list = asyncHandler(async (_req, res) => {
    res.status(200).json({ departments: await this.departments.list() });
  });

  readonly create = asyncHandler(async (req, res) => {
    res.status(201).json({ department: await this.departments.create(req.body.name) });
  });

  readonly rename = asyncHandler(async (req, res) => {
    res.status(200).json({ department: await this.departments.rename(Number(req.params.id), req.body.name) });
  });

  readonly remove = asyncHandler(async (req, res) => {
    await this.departments.remove(Number(req.params.id));
    res.status(204).end();
  });
}
