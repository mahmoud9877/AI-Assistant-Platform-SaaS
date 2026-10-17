import bcrypt from "bcryptjs";

export class PasswordHasher {
  constructor(private readonly saltRounds: number) {}

  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, this.saltRounds);
  }

  compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
