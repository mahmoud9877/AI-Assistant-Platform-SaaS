import joi from "joi";

export const chatMessage = joi.object({
  employeeId: joi.number().integer().positive().required(),
  message: joi.string().allow("", null),
});
