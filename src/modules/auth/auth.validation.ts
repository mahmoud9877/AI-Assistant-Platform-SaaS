import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

const credentials = joi
  .object({
    email: generalFields.email,
    password: generalFields.password,
  })
  .required();

export const authSchemas = {
  signup: credentials,
  login: credentials,
};
