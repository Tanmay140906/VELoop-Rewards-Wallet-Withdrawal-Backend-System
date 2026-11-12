import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.validated.body);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.validated.body);

  res.status(200).json({ success: true, token, user });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json({ success: true, user });
});
