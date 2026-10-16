import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
import { DEPARTMENTS, STATUSES } from "../../db/models/employee.model.js";

const name = joi.string().trim().min(2).max(20);
const department = joi.string().valid(...DEPARTMENTS);

export const list = joi.object({
  page: joi.number().integer().min(1),
  limit: joi.number().integer().min(1).max(100),
});

export const byId = joi.object({ id: generalFields.id });

export const create = joi
  .object({
    name: name.required(),
    department: department.required(),
    introduction: joi.string().trim().min(2).max(2000).required(),
  })
  .required();

export const update = joi.object({
  id: generalFields.id,
  name: name.allow(null),
  department: department.allow(null),
  role: joi.string().trim().min(1).max(255),
  status: joi.string().valid(...STATUSES),
});
