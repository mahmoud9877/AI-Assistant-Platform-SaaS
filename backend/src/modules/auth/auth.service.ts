import crypto from "crypto";
import { Op } from "sequelize";
import { AppError } from "../../core/app-error.js";
import { User } from "../../db/models/user.model.js";
import { PasswordReset } from "../../db/models/password-reset.model.js";
import type { Mailer } from "../../services/mailer.js";
import type { AuthUser, UserRole } from "../../types/auth-user.js";
import type { TokenService } from "../../services/token.service.js";
import type { PasswordHasher } from "../../services/password-hasher.js";

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupInput extends Credentials {
  name?: string | null;
}

// A reset link works once, for an hour; a new one is sent at most once a minute per account.
const RESET_LINK_LIFETIME_MS = 60 * 60 * 1000;
const RESET_EMAIL_INTERVAL_MS = 60 * 1000;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

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
    private readonly adminEmails: string[] = [],
    private readonly mail?: { mailer: Mailer; appUrl: string }
  ) {}

  async signup({ email, password, name }: SignupInput): Promise<User> {
    const normalizedEmail = email.toLowerCase();

    if (await User.findOne({ where: { email: normalizedEmail } })) {
      throw new AppError("User already exists", 409);
    }

    return User.create({
      email: normalizedEmail,
      password: await this.hasher.hash(password),
      name: name?.trim() || null,
    });
  }

  async updateProfile(userId: number, { name }: { name: string | null }): Promise<AuthUser> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError("User not found", 401);
    user.name = name?.trim() || null;
    await user.save();
    return this.toAuthUser(user);
  }

  /**
   * Signs the user out everywhere else: the password changes and every refresh token is
   * revoked. Returns a fresh session so the device that made the change stays signed in.
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<Session> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError("User not found", 401);
    if (!(await this.hasher.compare(currentPassword, user.password))) {
      throw new AppError("Your current password is incorrect.", 400);
    }
    user.password = await this.hasher.hash(newPassword);
    user.tokenVersion += 1;
    await user.save();
    return this.issueSession(user);
  }

  /**
   * Emails a reset link if the address belongs to an account. Says nothing either way,
   * so it can't be used to find out who has an account.
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!this.mail) throw new AppError("Password reset is not available.", 503);
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return;

    const recent = await PasswordReset.findOne({
      where: { userId: user.id, createdAt: { [Op.gt]: new Date(Date.now() - RESET_EMAIL_INTERVAL_MS) } },
    });
    if (recent) return;

    // A new link replaces any earlier one.
    await PasswordReset.destroy({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    await PasswordReset.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_LINK_LIFETIME_MS),
    });

    const link = `${this.mail.appUrl}/reset-password?token=${token}`;
    await this.mail.mailer.send({
      to: user.email,
      subject: "Reset your EVE password",
      text: `Someone asked to reset the password for your EVE account.\n\nTo choose a new password, open this link (it works once, for one hour):\n${link}\n\nIf it wasn't you, ignore this email; your password stays the same.`,
      html: `<p>Someone asked to reset the password for your EVE account.</p><p><a href="${link}">Choose a new password</a> (the link works once, for one hour).</p><p>If it wasn't you, ignore this email; your password stays the same.</p>`,
    });
  }

  /** Sets a new password from a reset link, and signs the user out on every device. */
  async resetPassword(token: string, password: string): Promise<void> {
    const reset = await PasswordReset.findOne({ where: { tokenHash: hashToken(token) } });
    if (!reset || reset.expiresAt.getTime() < Date.now()) {
      throw new AppError("This reset link is invalid or has expired. Ask for a new one.", 400);
    }
    const user = await User.findByPk(reset.userId);
    if (!user) throw new AppError("This reset link is invalid or has expired. Ask for a new one.", 400);

    user.password = await this.hasher.hash(password);
    user.tokenVersion += 1;
    await User.sequelize!.transaction(async (transaction) => {
      await user.save({ transaction });
      await PasswordReset.destroy({ where: { userId: user.id }, transaction });
    });
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
