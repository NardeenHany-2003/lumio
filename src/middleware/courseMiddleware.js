import Course from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Verify caller owns the course
export const checkCourseOwnership = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('No course found with that ID.', 404));
  if (
    course.instructor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError('You are not allowed to modify this course.', 403),
    );
  }
  req.course = course;
  next();
});

// Set instructor field before create
export const setInstructor = (req, res, next) => {
  req.body.instructor = req.user.id;
  next();
};

// Inject thumbnail path after multer
export const processThumbnail = (req, res, next) => {
  if (req.file) req.body.thumbnail = `courses/${req.file.filename}`;
  next();
};

// Strip protected fields before update
export const filterCourseUpdate = (req, res, next) => {
  const forbidden = [
    'instructor',
    'ratingsAverage',
    'ratingsQuantity',
    'totalStudents',
  ];
  forbidden.forEach((f) => delete req.body[f]);
  next();
};
