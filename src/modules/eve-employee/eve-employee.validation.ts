import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { STATUSES } from "../../db/models/employee.model.js";

const name = joi.string().trim().min(2).max(20);
// Checked against the Departments table by the service.
const departmentId = joi.number().integer().positive();

export const employeeSchemas = {
  list: joi.object({
    page: joi.number().integer().min(1),
    limit: joi.number().integer().min(1).max(100),
  }),

  byId: joi.object({ id: generalFields.id }),

  create: joi
    .object({
      name: name.required(),
      departmentId: departmentId.required(),
      introduction: joi.string().trim().min(2).max(2000).required(),
    })
    .required(),

  update: joi.object({
    id: generalFields.id,
    name: name.allow(null),
    departmentId: departmentId.allow(null),
    role: joi.string().trim().min(1).max(255),
    status: joi.string().valid(...STATUSES),
  }),
};
