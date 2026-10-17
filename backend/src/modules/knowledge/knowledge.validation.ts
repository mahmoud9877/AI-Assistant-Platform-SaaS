import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const knowledgeSchemas = {
  list: joi.object({ employeeId: generalFields.id }),

  upload: joi.object({ employeeId: generalFields.id }).required(),

  byId: joi.object({ id: generalFields.id }),
};
