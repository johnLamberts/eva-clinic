import { Container } from "decorator/di.container";
import { TryCatch } from "decorator/try-catch.decorator";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "~/utils/api-response.utils";
import { AppError } from "~/utils/index";
import { AuthSecurity } from "./auth.security";
import { AuthService } from "./auth.service";

export class AuthController {
  // 1. Dependency Injection resolution
  private authService = Container.resolve(AuthService);

  // 2. Helper to extract IP and UA (DRY)
  private getMeta(req: Request) {
    return {
      ip: AuthSecurity.extractIP(req),
      ua: (req.headers['user-agent'] || 'unknown').slice(0, 255)
    }
  }

  @TryCatch()
  async login(req: Request, res: Response, next: NextFunction) {
    const { ip, ua } = this.getMeta(req)
    const result = await this.authService.login(req.body, ip, ua);
    return ApiResponse.success(res, result, 'Login Successful.');
  }

  @TryCatch()
  async register(req: Request, res: Response, next: NextFunction) {
    const result = await this.authService.register(req.body);
    return ApiResponse.created(res, result, 'User registered successfully');
  }

  @TryCatch()
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const result = await this.authService.refreshToken(refreshToken);
    return ApiResponse.success(res, result, 'Token refreshed');
  }

  @TryCatch()
  async logout(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    return ApiResponse.success(res, null, 'Logged out successfully');
  }

  @TryCatch()
  async logoutAll(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user.userId;
    await this.authService.logoutAll(userId);
    return ApiResponse.success(res, null, 'Logged out from all devices');
  }

  @TryCatch()
  async changePassword(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user.userId;
    await this.authService.changePassword(userId, req.body);
    return ApiResponse.success(res, null, 'Password changed successfully');
  }

  @TryCatch()
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user.userId;
    const user = await this.authService.getCurrentUser(userId);
    return ApiResponse.success(res, user, 'User retrieved');
  }
}
