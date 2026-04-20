import User        from '../models/userModel.js';
import Course      from '../models/courseModel.js';
import Lesson      from '../models/lessonModel.js';
import Enrollment  from '../models/enrollmentModel.js';
import Rating      from '../models/ratingModel.js';
import Comment     from '../models/commentModel.js';
import Progress    from '../models/progressModel.js';
import Booking     from '../models/bookingModel.js';
import catchAsync  from '../utils/catchAsync.js';
import AppError    from '../utils/appError.js';
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
//  Only name, email, bio, photo — NOT password
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Use /api/v1/auth/update-password.', 400),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'bio');

  if (req.file) {
    filteredBody.photo = `users/${req.file.filename}`;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new:           true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

//  DELETE ME: Soft-delete
export const deleteMe = catchAsync(async (req, res, next) => {
  // 1) Soft-delete the user account
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // 2) If instructor — cascade-delete all their content
  if (req.user.role === 'instructor') {
    // Use native driver to bypass Mongoose pre-find hooks (which would try to
    // populate the now-inactive instructor and interfere with the query)
    const mongoose = (await import('mongoose')).default;
    const instructorObjId = new mongoose.Types.ObjectId(req.user.id);

    const courseDocs = await Course.collection
      .find({ instructor: instructorObjId }, { projection: { _id: 1 } })
      .toArray();
    const courseIds = courseDocs.map((c) => c._id);

    if (courseIds.length > 0) {
      // Find all lesson IDs across those courses (needed for comment/progress delete)
      const lessons = await Lesson.find(
        { course: { $in: courseIds } },
        { _id: 1 },
      ).lean();
      const lessonIds = lessons.map((l) => l._id);

      // Delete in dependency order (children before parents)
      await Promise.all([
        Progress.deleteMany({ course: { $in: courseIds } }),
        Comment.deleteMany({ lesson: { $in: lessonIds } }),
        Rating.deleteMany({ course: { $in: courseIds } }),
        Booking.deleteMany({ course: { $in: courseIds } }),
        Enrollment.deleteMany({ course: { $in: courseIds } }),
        Lesson.deleteMany({ course: { $in: courseIds } }),
      ]);

      await Course.deleteMany({ instructor: req.user.id });

      console.log(
        `[deleteMe] ✅ Cascade deleted ${courseIds.length} course(s) and all related data for instructor ${req.user.id}`,
      );
    }
  }

  res.status(204).json({ status: 'success', data: null });
});

//  ADMIN — DO NOT UPDATE PASSWORDS WITH THESE
export const getAllUsers = factory.getAll(User, 'users');
export const getUser = factory.getOne(User, null, 'user');
export const updateUser = factory.updateOne(User, 'user'); 
export const deleteUser = factory.deleteOne(User);
