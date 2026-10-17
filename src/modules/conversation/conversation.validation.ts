import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

const title = joi.string().trim().min(1).max(120);

export const conversationSchemas = {
  list: joi.object({ employeeId: generalFields.id }),

  create: joi.object({ employeeId: generalFields.id }).required(),

  byId: joi.object({ id: generalFields.id }),

  rename: joi.object({ id: generalFields.id, title: title.required() }),

  // The text may be empty when a file is attached; the service checks that one is there.
  send: joi.object({
    id: generalFields.id,
    message: joi.string().max(8000).allow("", null),
  }),
};
