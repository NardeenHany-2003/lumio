import Rating from '../models/ratingModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as factory from '../utils/handlerFactory.js';
import {
  setCourseFilter,
  checkRatingOwnership,
} from '../middleware/resource/ratingMiddleware.js';

// GET ALL RATINGS FOR A COURSE — factory
export const getCourseRatings = factory.getAll(Rating, 'ratings');

// CREATE RATING
export const createRating = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('No course found with that ID.', 404));

  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: req.params.courseId,
  });
  if (!enrollment) {
    return next(
      new AppError('You must be enrolled in this course to rate it.', 403),
    );
  }

  const existing = await Rating.findOne({
    user: req.user.id,
    course: req.params.courseId,
  });
  if (existing) {
    return next(
      new AppError(
        'You have already rated this course. Use PATCH to update.',
        400,
      ),
    );
  }

  const rating = await Rating.create({
    user: req.user.id,
    course: req.params.courseId,
    rating: req.body.rating,
    review: req.body.review,
  });

  res.status(201).json({ status: 'success', data: { rating } });
});

// UPDATE RATING
export const updateRating = catchAsync(async (req, res, next) => {
  const rating = await Rating.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!rating)
    return next(
      new AppError('No rating found or you are not the author.', 404),
    );

  if (req.body.rating !== undefined) rating.rating = req.body.rating;
  if (req.body.review !== undefined) rating.review = req.body.review;
  await rating.save();

  res.status(200).json({ status: 'success', data: { rating } });
});

// DELETE RATING — factory
export const deleteRating = factory.deleteOne(Rating);
