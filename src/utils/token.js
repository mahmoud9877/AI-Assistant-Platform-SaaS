import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateToken = (payload, expiresIn = "30d") =>
  jwt.sign(payload, env.tokenSignature, { expiresIn });

export const verifyToken = (token) => jwt.verify(token, env.tokenSignature);
