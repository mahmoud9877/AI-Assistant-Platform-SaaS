import fs from "fs";
import joi from "joi";

export const generalFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 4,
      tlds: { allow: ["com", "net"] },
    })
    .required(),
  password: joi
    .string()
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    .required(),
  id: joi.number().integer().positive().required(),
};

// Validates body, params and query merged into one object.
export const validation = (schema, sources = ["body", "params", "query"]) => {
  return (req, res, next) => {
    const input = Object.assign({}, ...sources.map((key) => req[key]));
    const { error } = schema.validate(input, { abortEarly: false });

    if (error) {
      // Don't keep an uploaded image for a request that was rejected.
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        message: "validationErr",
        validationErr: error.details,
      });
    }

    return next();
  };
};
