import Comment from '../models/commentModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Set lesson filter for getAll
export const setLessonFilter = (req, res, next) => {
  req.filterQuery = { lesson: req.params.lessonId };
  next();
};

// Verify caller owns the comment
export const checkCommentOwnership = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment)
    return next(new AppError('No comment found with that ID.', 404));
  if (
    comment.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You can only modify your own comments.', 403));
  }
  next();
});
