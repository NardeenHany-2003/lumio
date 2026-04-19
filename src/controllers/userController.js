import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as factory from '../utils/handlerFactory.js';
import { uploadUserPhoto } from '../middleware/uploadMiddleware.js';

//  HELPER: filter request body to allowed fields only
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

//  MIDDLEWARE: set req.params.id = logged-in user
export const setMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//  GET ME  — /api/v1/users/me
export const getMe = factory.getOne(User, null, 'user');

//  UPDATE ME  — /api/v1/users/update-me
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Use /api/v1/auth/update-password.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'bio');

  if (req.file) {
    filteredBody.photo = `users/${req.file.filename}`;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

//  DELETE ME: Soft-delete
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

//  ADMIN — DO NOT UPDATE PASSWORDS WITH THESE
export const getAllUsers = factory.getAll(User, 'users');
export const getUser = factory.getOne(User, null, 'user');
export const updateUser = factory.updateOne(User, 'user'); 
export const deleteUser = factory.deleteOne(User);
