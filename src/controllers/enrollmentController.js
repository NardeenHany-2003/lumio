import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

// ENROLL IN COURSE
export const enrollInCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('No course found with that ID.', 404));
  if (!course.isPublished)
    return next(new AppError('This course is not published yet.', 400));

  // Instructors cannot enroll in their own course
  if (course.instructor._id.toString() === req.user.id) {
    return next(
      new AppError('Instructors cannot enroll in their own course.', 400),
    );
  }

  const existing = await Enrollment.findOne({
    student: req.user.id,
    course: course._id,
  });
  if (existing)
    return next(new AppError('You are already enrolled in this course.', 400));

  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: course._id,
  });

  res.status(201).json({
    status: 'success',
    message: `Successfully enrolled in "${course.title}".`,
    data: { enrollment },
  });
});

// UNENROLL FROM COURSE
export const unenrollFromCourse = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findOneAndDelete({
    student: req.user.id,
    course: req.params.courseId,
  });

  if (!enrollment)
    return next(new AppError('You are not enrolled in this course.', 404));

  res.status(200).json({
    status: 'success',
    message: 'Successfully unenrolled from the course.',
  });
});

// MY ENROLLMENTS (student)
export const getMyEnrollments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Enrollment.find({ student: req.user.id }).populate({
      path: 'course',
      select:
        'title slug thumbnail ratingsAverage totalLessons totalDuration instructor category level',
    }),
    req.query,
  )
    .sort()
    .limitFields()
    .paginate();

  const enrollments = await features.query;

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    data: { enrollments },
  });
});

// GET ENROLLED STUDENTS FOR A COURSE (instructor/admin)
export const getCourseEnrollments = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('No course found with that ID.', 404));

  if (
    course.instructor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError(
        'You are not allowed to view enrollments for this course.',
        403,
      ),
    );
  }

  const features = new APIFeatures(
    Enrollment.find({ course: req.params.courseId }).populate({
      path: 'student',
      select: 'name email photo',
    }),
    req.query,
  )
    .sort()
    .paginate();

  const enrollments = await features.query;
  const total = await Enrollment.countDocuments({
    course: req.params.courseId,
  });

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    pagination: {
      total,
      page: features.page,
      limit: features.limit,
      totalPages: Math.ceil(total / features.limit),
    },
    data: { enrollments },
  });
});

// CHECK ENROLLMENT STATUS
export const checkEnrollment = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: req.params.courseId,
  });

  res.status(200).json({
    status: 'success',
    isEnrolled: !!enrollment,
    data: { enrollment: enrollment || null },
  });
});
