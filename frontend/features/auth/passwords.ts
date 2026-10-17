import { z } from "zod";

// Same rule the backend enforces.
export const passwordSchema = z
  .string()
  .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, {
    message: "At least 8 characters, with an uppercase letter, a lowercase letter and a number.",
  });

/** A new password typed twice. */
export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((values) => values.password === values.confirm, { message: "The passwords don't match.", path: ["confirm"] });
