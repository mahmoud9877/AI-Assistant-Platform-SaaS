import { asyncHandler, BaseController } from "../../core/http.js";
import type { AuthService } from "./auth.service.js";

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  readonly signup = asyncHandler(async (req, res) => {
    const user = await this.authService.signup(req.body);
    res.status(201).json({ message: "Signup successful", userId: user.id });
  });

  readonly login = asyncHandler(async (req, res) => {
    res.status(200).json(await this.authService.login(req.body));
  });
}
