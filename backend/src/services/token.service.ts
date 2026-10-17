import jwt from "jsonwebtoken";

export type TokenType = "access" | "refresh";

export interface TokenPayload {
  id: number;
  type: TokenType;
  // The user's tokenVersion when a refresh token was issued; bumping it revokes them.
  ver?: number;
}

const LIFETIMES: Record<TokenType, jwt.SignOptions["expiresIn"]> = {
  access: "15m",
  refresh: "7d",
};

export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export class TokenService {
  constructor(private readonly secret: string) {}

  signAccess(id: number): string {
    return this.sign({ id, type: "access" });
  }

  signRefresh(id: number, ver: number): string {
    return this.sign({ id, type: "refresh", ver });
  }

  /** The payload of a valid token of the given type; throws (→ 401) otherwise. */
  verify(token: string, type: TokenType): Partial<TokenPayload> {
    const decoded = jwt.verify(token, this.secret);
    const payload = typeof decoded === "string" ? {} : (decoded as Partial<TokenPayload>);
    // Stops a refresh token from being used as an access token and vice versa.
    if (payload.type !== type) {
      throw new jwt.JsonWebTokenError(`Expected ${type} token`);
    }
    return payload;
  }

  private sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: LIFETIMES[payload.type] });
  }
}
