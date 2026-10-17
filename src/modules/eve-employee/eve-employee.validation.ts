import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { REPLY_LANGUAGES, STATUSES, TONES } from "../../db/models/employee.model.js";

const name = joi.string().trim().min(2).max(20);
// Checked against the Departments table by the service.
const departmentId = joi.number().integer().positive();
const introduction = joi.string().trim().min(2).max(2000);

export const employeeSchemas = {
  list: joi.object({
    page: joi.number().integer().min(1),
    limit: joi.number().integer().min(1).max(100),
    // Matches the employee's or their department's name.
    search: joi.string().trim().max(100).allow(""),
    departmentId,
  }),

  byId: joi.object({ id: generalFields.id }),

  create: joi
    .object({
      name: name.required(),
      departmentId: departmentId.required(),
      introduction: introduction.required(),
    })
    .required(),

  update: joi.object({
    id: generalFields.id,
    name: name.allow(null),
    departmentId: departmentId.allow(null),
    role: joi.string().trim().min(1).max(255),
    status: joi.string().valid(...STATUSES),
    introduction,
    tone: joi.string().valid(...TONES),
    replyLanguage: joi.string().valid(...REPLY_LANGUAGES),
    customInstructions: joi.string().trim().max(2000).allow("", null),
  }),
};
