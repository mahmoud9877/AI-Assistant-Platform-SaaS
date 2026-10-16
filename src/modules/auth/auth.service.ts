import { AppError } from "../../core/app-error.js";
import { User } from "../../db/models/user.model.js";
import type { AuthUser } from "../../types/auth-user.js";
import type { TokenService } from "../../services/token.service.js";
import type { PasswordHasher } from "../../services/password-hasher.js";

export interface Credentials {
  email: string;
  password: string;
}

export class AuthService {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService
  ) {}

  async signup({ email, password }: Credentials): Promise<User> {
    const normalizedEmail = email.toLowerCase();

    if (await User.findOne({ where: { email: normalizedEmail } })) {
      throw new AppError("User already exists", 409);
    }

    return User.create({ email: normalizedEmail, password: await this.hasher.hash(password) });
  }

  async login({ email, password }: Credentials): Promise<{ token: string; user: AuthUser }> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      throw new AppError("Email not found", 404);
    }
    if (!(await this.hasher.compare(password, user.password))) {
      throw new AppError("Invalid login credentials", 401);
    }

    return {
      token: this.tokens.sign({ id: user.id }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async findUser(id: number): Promise<AuthUser> {
    const user = await User.findByPk(id, { attributes: ["id", "name", "email"] });
    if (!user) {
      throw new AppError("User not found", 401);
    }
    return { id: user.id, name: user.name, email: user.email };
  }
}
