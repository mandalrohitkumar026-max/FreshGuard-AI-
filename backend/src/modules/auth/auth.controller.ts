import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { authService } from './auth.service';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    return ApiResponse.created(res, result, 'User registered successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return ApiResponse.ok(res, result, 'Authentication successful');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return ApiResponse.ok(res, result, 'Token refreshed successfully');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    if (req.userId) {
      await authService.logout(req.userId);
    }
    return ApiResponse.ok(res, { message: 'Logged out successfully' }, 'Logged out successfully');
  });

  getMe = asyncHandler(async (req: Request, res: Response) => {
    return ApiResponse.ok(res, {
      userId: req.userId,
      email: req.userEmail,
      role: req.userRole || 'user',
    }, 'User profile retrieved');
  });
}

export const authController = new AuthController();
