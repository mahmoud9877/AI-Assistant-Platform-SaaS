import { AppError } from "../../core/app-error.js";
import { User } from "../../db/models/user.model.js";
import type { AuthUser, UserRole } from "../../types/auth-user.js";
import type { TokenService } from "../../services/token.service.js";
import type { PasswordHasher } from "../../services/password-hasher.js";

export interface Credentials {
  email: string;
  password: string;
}

/** A short-lived access token for the client to keep in memory, and a refresh token for the cookie. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export class AuthService {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly adminEmails: string[] = []
  ) {}

  async signup({ email, password }: Credentials): Promise<User> {
    const normalizedEmail = email.toLowerCase();

    if (await User.findOne({ where: { email: normalizedEmail } })) {
      throw new AppError("User already exists", 409);
    }

    return User.create({ email: normalizedEmail, password: await this.hasher.hash(password) });
  }

  async login({ email, password }: Credentials): Promise<Session> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      throw new AppError("Email not found", 404);
    }
    if (!(await this.hasher.compare(password, user.password))) {
      throw new AppError("Invalid login credentials", 401);
    }

    return this.issueSession(user);
  }

  /** Swaps a valid refresh token for a new session (the refresh token is rotated too). */
  async refresh(refreshToken: string | undefined): Promise<Session> {
    const user = await this.userForRefreshToken(refreshToken);
    if (!user) throw new AppError("Session expired", 401);
    return this.issueSession(user);
  }

  /** Revokes every refresh token issued to the token's user, on every device. */
  async logout(refreshToken: string | undefined): Promise<void> {
    const user = await this.userForRefreshToken(refreshToken).catch(() => null);
    await user?.increment("tokenVersion");
  }

  async findUser(id: number): Promise<AuthUser> {
    const user = await User.findByPk(id, { attributes: ["id", "name", "email"] });
    if (!user) {
      throw new AppError("User not found", 401);
    }
    return this.toAuthUser(user);
  }

  // The token's user, or null when the token is missing or was revoked by a logout.
  private async userForRefreshToken(refreshToken: string | undefined): Promise<User | null> {
    if (!refreshToken) return null;
    const { id, ver } = this.tokens.verify(refreshToken, "refresh");
    if (!id) return null;
    const user = await User.findByPk(id);
    return user && user.tokenVersion === ver ? user : null;
  }

  private issueSession(user: User): Session {
    return {
      accessToken: this.tokens.signAccess(user.id),
      refreshToken: this.tokens.signRefresh(user.id, user.tokenVersion),
      user: this.toAuthUser(user),
    };
  }

  // Admins are whoever ADMIN_EMAILS lists, checked on every request, so adding or
  // removing an email takes effect without touching the database.
  private toAuthUser(user: Pick<User, "id" | "name" | "email">): AuthUser {
    const role: UserRole = this.adminEmails.includes(user.email.toLowerCase()) ? "admin" : "user";
    return { id: user.id, name: user.name, email: user.email, role };
  }
}
