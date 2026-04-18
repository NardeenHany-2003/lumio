import Progress from '../models/progressModel.js';
import Lesson from '../models/lessonModel.js';
import Enrollment from '../models/enrollmentModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// GET PROGRESS FOR A COURSE
export const getCourseProgress = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: req.params.courseId,
  });
  if (!enrollment)
    return next(new AppError('You are not enrolled in this course.', 403));

  const progressRecords = await Progress.find({
    student: req.user.id,
    course: req.params.courseId,
  }).populate('lesson', 'title order duration');

  res.status(200).json({
    status: 'success',
    data: {
      progressPercent: enrollment.progressPercent,
      isCompleted: enrollment.isCompleted,
      completedAt: enrollment.completedAt,
      lessons: progressRecords,
    },
  });
});

// UPDATE LESSON PROGRESS (mark complete/incomplete)
export const updateLessonProgress = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) return next(new AppError('No lesson found with that ID.', 404));

  // Must be enrolled
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: lesson.course,
  });
  if (!enrollment)
    return next(new AppError('You are not enrolled in this course.', 403));

  const { isCompleted, watchedDuration } = req.body;

  const progress = await Progress.findOneAndUpdate(
    { student: req.user.id, lesson: req.params.lessonId },
    {
      student: req.user.id,
      lesson: req.params.lessonId,
      course: lesson.course,
      isCompleted: isCompleted ?? false,
      completedAt: isCompleted ? new Date() : undefined,
      watchedDuration: watchedDuration ?? 0,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  res.status(200).json({
    status: 'success',
    data: { progress },
  });
});

// GET SINGLE LESSON PROGRESS
export const getLessonProgress = catchAsync(async (req, res, next) => {
  const progress = await Progress.findOne({
    student: req.user.id,
    lesson: req.params.lessonId,
  });

  res.status(200).json({
    status: 'success',
    data: {
      progress: progress || { isCompleted: false, watchedDuration: 0 },
    },
  });
});
