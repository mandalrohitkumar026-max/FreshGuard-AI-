import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../services/authService';
import { ApiResponse } from '../types/verification.types';

export const register = asyncWrapper(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await registerUser(name, email, password);

  const response: ApiResponse = {
    success: true,
    data: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      accessToken,
      refreshToken,
      expiresIn: 900,
    },
  };
  res.status(201).json(response);
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser(email, password);

  res.json({
    success: true,
    data: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      accessToken,
      refreshToken,
      expiresIn: 900,
    },
  });
});

export const refresh = asyncWrapper(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await refreshAccessToken(refreshToken);
  res.json({ success: true, data: { ...tokens, expiresIn: 900 } });
});

export const logout = asyncWrapper(async (req: Request, res: Response) => {
  await logoutUser(req.userId!);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

export const getMe = asyncWrapper(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { userId: req.userId, email: req.userEmail },
  });
});
