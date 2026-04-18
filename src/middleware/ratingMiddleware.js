import Rating from '../models/ratingModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Set course filter for getAll
export const setCourseFilter = (req, res, next) => {
  req.filterQuery = { course: req.params.courseId };
  next();
};

// Verify caller owns the rating
export const checkRatingOwnership = catchAsync(async (req, res, next) => {
  const rating = await Rating.findById(req.params.id);
  if (!rating) return next(new AppError('No rating found with that ID.', 404));
  if (rating.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own ratings.', 403));
  }
  next();
});
