import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

const name = joi.string().trim().min(1).max(100).required();

export const departmentSchemas = {
  create: joi.object({ name }).required(),

  byId: joi.object({ id: generalFields.id }),

  rename: joi.object({ id: generalFields.id, name }),
};
