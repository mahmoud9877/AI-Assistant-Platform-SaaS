import { User } from "../../db/models/index.js";
import { generateToken } from "../../utils/token.js";
import { AppError, asyncHandler } from "../../utils/app-error.js";
import { hashPassword, comparePassword } from "../../utils/password.js";

export const signup = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();

  if (await User.findOne({ where: { email } })) {
    throw new AppError("User already exists", 409);
  }

  const user = await User.create({
    email,
    password: await hashPassword(req.body.password),
  });

  return res.status(201).json({ message: "Signup successful", userId: user.id });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  if (!user) {
    throw new AppError("Email not found", 404);
  }
  if (!(await comparePassword(password, user.password))) {
    throw new AppError("Invalid login credentials", 401);
  }

  return res.status(200).json({
    token: generateToken({ id: user.id }),
    user: { id: user.id, name: user.name, email: user.email },
  });
});
