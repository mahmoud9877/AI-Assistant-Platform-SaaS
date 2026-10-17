import type { CookieOptions, Response } from "express";
import type { SameSite } from "../../config/env.js";
import { asyncHandler, BaseController } from "../../core/http.js";
import { REFRESH_TOKEN_MAX_AGE_MS } from "../../services/token.service.js";
import type { AuthService, Session } from "./auth.service.js";

const REFRESH_COOKIE = "refreshToken";

export class AuthController extends BaseController {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    { isProduction, sameSite, apiPathPrefix }: { isProduction: boolean; sameSite: SameSite; apiPathPrefix: string }
  ) {
    super();
    // httpOnly keeps the refresh token away from page scripts, and the auth path keeps it
    // off every other request. The path is the one the browser sees, so it includes the
    // proxy's prefix (e.g. /api/auth). SameSite=None (needed when the frontend is on
    // another site) requires Secure.
    this.cookieOptions = {
      httpOnly: true,
      secure: isProduction || sameSite === "none",
      sameSite,
      path: `${apiPathPrefix}/auth`,
    };
  }

  readonly signup = asyncHandler(async (req, res) => {
    const user = await this.authService.signup(req.body);
    res.status(201).json({ message: "Signup successful", userId: user.id });
  });

  readonly forgotPassword = asyncHandler(async (req, res) => {
    await this.authService.requestPasswordReset(req.body.email);
    res.status(200).json({ message: "If an account uses this email, a reset link is on its way." });
  });

  readonly resetPassword = asyncHandler(async (req, res) => {
    await this.authService.resetPassword(req.body.token, req.body.password);
    // Every session was revoked; this browser's cookie is now useless too.
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
    res.status(204).end();
  });

  readonly changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    this.sendSession(res, await this.authService.changePassword(this.currentUser(req).id, currentPassword, newPassword));
  });

  readonly updateProfile = asyncHandler(async (req, res) => {
    res.status(200).json({ user: await this.authService.updateProfile(this.currentUser(req).id, req.body) });
  });

  readonly login = asyncHandler(async (req, res) => {
    this.sendSession(res, await this.authService.login(req.body));
  });

  readonly refresh = asyncHandler(async (req, res) => {
    try {
      this.sendSession(res, await this.authService.refresh(req.cookies[REFRESH_COOKIE]));
    } catch (err) {
      // A dead refresh token is useless; drop it so the browser stops sending it.
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
      throw err;
    }
  });

  readonly logout = asyncHandler(async (req, res) => {
    await this.authService.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
    res.status(204).end();
  });

  // The refresh token goes only in the cookie, never in the body.
  private sendSession(res: Response, { refreshToken, accessToken, user }: Session): void {
    res.cookie(REFRESH_COOKIE, refreshToken, { ...this.cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
    res.status(200).json({ accessToken, user });
  }
}
