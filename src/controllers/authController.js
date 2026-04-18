import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import {
  createSendTokens,
  signAccessToken,
  signRefreshToken,
} from '../utils/generateTokens.js';
import Email from '../utils/email.js';

//  SIGN UP
export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role, bio } = req.body;

  // Prevent users from assigning themselves admin
  const safeRole = role === 'instructor' ? 'instructor' : 'student';

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role: safeRole,
    bio,
  });

  const dashboardURL = `${req.protocol}://${req.get('host')}/dashboard`;
  // Send welcome email (non-blocking — don't fail signup if email fails)
  new Email(newUser, dashboardURL).sendWelcome().catch(() => {});

  await createSendTokens(newUser, 201, req, res, User);
});

//  LOGIN
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Fetch user with password (select: false by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  await createSendTokens(user, 200, req, res, User);
});

//  REFRESH ACCESS TOKEN
export const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) return next(new AppError('No refresh token provided.', 401));

  let decoded;
  try {
    decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_REFRESH_SECRET,
    );
  } catch {
    return next(
      new AppError(
        'Invalid or expired refresh token. Please log in again.',
        401,
      ),
    );
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    return next(
      new AppError('Refresh token is invalid or has been revoked.', 401),
    );
  }

  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

//  LOGOUT
export const logout = catchAsync(async (req, res, next) => {
  // Revoke refresh token in DB
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

  res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully.' });
});

//  FORGOT PASSWORD
export const forgotPassword = catchAsync(async (req, res, next) => {
  console.log('[forgotPassword] Controller hit — req.body:', req.body);
  const user = await User.findOne({ email: req.body.email });

  // Always return 200 to prevent email enumeration
  if (!user) {
    console.log(
      `[forgotPassword] No user found for email: "${req.body.email}"`,
    );
    return res.status(200).json({
      status: 'success',
      message: 'If that email is registered, a reset token has been sent.',
    });
  }

  console.log(
    `[forgotPassword] User found: ${user.email} — generating reset token...`,
  );

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    console.log(`[forgotPassword] Reset email sent to: ${user.email}`);
  } catch (err) {
    // Rollback token fields if email fails
    console.error('sendPasswordReset failed:', err.message, err.code);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(`Failed to send reset email: ${err.message}`, 500),
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a reset link has been sent.',
  });
});

//  RESET PASSWORD
export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await createSendTokens(user, 200, req, res, User);
});

//  UPDATE PASSWORD (authenticated)
export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  await createSendTokens(user, 200, req, res, User);
});
