import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

const credentials = joi
  .object({
    email: generalFields.email,
    password: generalFields.password,
  })
  .required();

export const signup = credentials;
export const login = credentials;
