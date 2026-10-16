import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: number;
}

export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: jwt.SignOptions["expiresIn"] = "30d"
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): Partial<TokenPayload> {
    const decoded = jwt.verify(token, this.secret);
    return typeof decoded === "string" ? {} : (decoded as Partial<TokenPayload>);
  }
}
