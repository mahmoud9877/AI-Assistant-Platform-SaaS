import bcrypt from "bcryptjs";
import env from "../config/env.js";

export const hashPassword = (plaintext) => bcrypt.hash(plaintext, env.saltRounds);

export const comparePassword = (plaintext, hashValue) => bcrypt.compare(plaintext, hashValue);
