import Lesson from '../models/lessonModel.js';
import Course from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Verify caller owns the lesson's course
export const checkLessonOwnership = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new AppError('No lesson found with that ID.', 404));

  const course = await Course.findById(lesson.course);
  if (!course) return next(new AppError('Parent course not found.', 404));

  if (
    course.instructor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError(
        'You are not allowed to manage lessons for this course.',
        403,
      ),
    );
  }
  next();
});
