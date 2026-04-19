import Lesson from '../models/lessonModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as factory from '../utils/handlerFactory.js';
import { checkLessonOwnership } from '../middleware/lessonMiddleware.js';

// Helper used by create/update — verify course ownership
const assertCourseOwner = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('No course found with that ID.', 404);
  if (course.instructor._id.toString() !== userId && userRole !== 'admin') {
    throw new AppError(
      'You are not allowed to manage lessons for this course.',
      403,
    );
  }
  return course;
};

// GET ALL LESSONS FOR A COURSE
export const getLessons = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('No course found with that ID.', 404));

  let filter = { course: req.params.courseId };
  const isInstructor =
    req.user &&
    (course.instructor._id.toString() === req.user.id ||
      req.user.role === 'admin');

  if (!isInstructor) {
    const isEnrolled = req.user
      ? await Enrollment.findOne({
          student: req.user.id,
          course: req.params.courseId,
        })
      : null;
    if (!isEnrolled) filter.isFree = true;
  }

  const lessons = await Lesson.find(filter).sort('order');
  res
    .status(200)
    .json({ status: 'success', results: lessons.length, data: { lessons } });
});

// GET ONE LESSON
export const getLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id).populate(
    'course',
    'title instructor isPublished',
  );
  if (!lesson) return next(new AppError('No lesson found with that ID.', 404));

  const isInstructor =
    req.user &&
    (lesson.course.instructor._id.toString() === req.user.id ||
      req.user.role === 'admin');

  if (!lesson.isFree && !isInstructor) {
    const isEnrolled = req.user
      ? await Enrollment.findOne({
          student: req.user.id,
          course: lesson.course._id,
        })
      : null;
    if (!isEnrolled) {
      return next(
        new AppError(
          'Please enroll in this course to access this lesson.',
          403,
        ),
      );
    }
  }

  res.status(200).json({ status: 'success', data: { lesson } });
});

// CREATE LESSON
export const createLesson = catchAsync(async (req, res, next) => {
  await assertCourseOwner(req.body.course, req.user.id, req.user.role);

  if (req.file) req.body.videoPath = `videos/${req.file.filename}`;

  const lastLesson = await Lesson.findOne({ course: req.body.course })
    .sort('-order')
    .select('order');
  const nextOrder = lastLesson ? lastLesson.order + 1 : 1;
  const conflict = req.body.order
    ? await Lesson.findOne({ course: req.body.course, order: req.body.order })
    : null;
  if (!req.body.order || conflict) req.body.order = nextOrder;

  const lesson = await Lesson.create(req.body);
  res.status(201).json({ status: 'success', data: { lesson } });
});

// UPDATE LESSON
export const updateLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new AppError('No lesson found with that ID.', 404));

  await assertCourseOwner(lesson.course, req.user.id, req.user.role);
  delete req.body.course;

  if (req.file) req.body.videoPath = `videos/${req.file.filename}`;
  if (req.body.removeVideo === 'true') req.body.videoPath = '';

  const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'success', data: { lesson: updated } });
});

// DELETE LESSON
export const deleteLesson = factory.deleteOne(Lesson);
