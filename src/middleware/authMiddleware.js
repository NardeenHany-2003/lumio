import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import User from '../models/userModel.js';

//  protect: verifies access token
export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token from Authorization header OR cookie
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
    );
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new AppError('Your access token has expired. Please refresh it.', 401),
      );
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  // 4) Check if password changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was recently changed. Please log in again.', 401),
    );
  }

  // Attach user to request
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//  isLoggedIn: silent protect for view routes
export const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_ACCESS_SECRET,
    );
    const user = await User.findById(decoded.id);
    if (!user || user.changedPasswordAfter(decoded.iat)) return next();

    res.locals.user = user;
    req.user = user;
  } catch (_) {
    /* silently ignore */
  }
  next();
};

//  restrictTo: role-based access control
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };
