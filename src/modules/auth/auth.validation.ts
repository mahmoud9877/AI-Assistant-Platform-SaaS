import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

const name = joi.string().trim().min(2).max(20);

const credentials = joi
  .object({
    email: generalFields.email,
    password: generalFields.password,
  })
  .required();

export const authSchemas = {
  signup: credentials.keys({ name: name.allow("", null) }),
  login: credentials,

  forgotPassword: joi.object({ email: generalFields.email }).required(),

  resetPassword: joi
    .object({
      token: joi.string().hex().length(64).required(),
      password: generalFields.password,
    })
    .required(),

  changePassword: joi
    .object({
      currentPassword: joi.string().required(),
      newPassword: generalFields.password,
    })
    .required(),

  updateProfile: joi.object({ name: name.allow("", null).required() }).required(),
};
