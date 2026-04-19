import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Lesson from '../models/lessonModel.js';
import Progress from '../models/progressModel.js';
import Booking from '../models/bookingModel.js';
import catchAsync from '../utils/catchAsync.js';
import { CATEGORIES, LEVELS } from '../models/courseModel.js';

//  HOME
export const getHome = catchAsync(async (req, res) => {
  const featuredCourses = await Course.find({ isPublished: true })
    .sort('-ratingsAverage -totalStudents')
    .limit(6)
    .select(
      'title slug thumbnail ratingsAverage totalStudents price category level instructor',
    );

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science & ML',
    'DevOps & Cloud',
    'Cybersecurity',
    'AI & Machine Learning',
  ];

  res.status(200).render('home', {
    title: 'Lumio — Learn Without Limits',
    featuredCourses,
    categories,
  });
});

//  COURSES LISTING
export const getCourses = (req, res) => {
  res.status(200).render('courses', {
    title: 'All Courses — Lumio',
  });
};

//  COURSE DETAIL
export const getCourseDetail = catchAsync(async (req, res, next) => {
  const course = await Course.findOne({
    slug: req.params.slug,
    isPublished: true,
  }).populate({ path: 'lessons', options: { sort: { order: 1 } } });

  if (!course) {
    return res.status(404).render('error', {
      title: 'Course Not Found',
      message: 'No course found with that name.',
    });
  }

  // Post-Stripe redirect: create enrollment + booking then clean the URL
  if (req.query.enrolled === 'true' && req.user) {
    const existing = await Enrollment.findOne({
      student: req.user.id,
      course: course._id,
    });
    if (!existing) {
      // Create enrollment
      await Enrollment.create({ student: req.user.id, course: course._id });

      // Create booking record for audit trail (dev workaround — webhook handles prod)
      const alreadyBooked = await Booking.findOne({
        user: req.user.id,
        course: course._id,
      });
      if (!alreadyBooked) {
        await Booking.create({
          course: course._id,
          user: req.user.id,
          price: course.price,
          paid: true,
        });
      }
    }
    return res.redirect(302, `/courses/${req.params.slug}`);
  }

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course._id,
    });
    isEnrolled = !!enrollment;
  }

  res.status(200).render('courseDetail', {
    title: `${course.title} — Lumio`,
    course,
    isEnrolled,
  });
});

//  EDIT COURSE PAGE
export const getEditCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'lessons',
    options: { sort: { order: 1 } },
  });

  if (!course) {
    return res.status(404).render('error', {
      title: 'Not Found',
      message: 'Course not found.',
    });
  }

  // Only the owner or admin can edit
  if (
    course.instructor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'You are not allowed to edit this course.',
    });
  }

  res.status(200).render('editCourse', {
    title: `Edit: ${course.title} — Lumio`,
    course,
    categories: CATEGORIES,
    levels: LEVELS,
  });
});

//  LESSON PLAYER
export const getLessonPlayer = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id).populate(
    'course',
    'title slug instructor isPublished',
  );

  if (!lesson) {
    return res.status(404).render('error', {
      title: 'Not Found',
      message: 'Lesson not found.',
    });
  }

  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: lesson.course._id,
  });

  if (!lesson.isFree && !enrollment) {
    return res.redirect(`/courses/${lesson.course.slug}`);
  }

  const allLessons = await Lesson.find({ course: lesson.course._id }).sort(
    'order',
  );

  const progressRecords = enrollment
    ? await Progress.find({ student: req.user.id, course: lesson.course._id })
    : [];

  const completedIds = progressRecords
    .filter((p) => p.isCompleted)
    .map((p) => p.lesson.toString());

  const currentIndex = allLessons.findIndex(
    (l) => l._id.toString() === lesson._id.toString(),
  );

  const nextLesson = allLessons[currentIndex + 1] || null;
  const prevLesson = allLessons[currentIndex - 1] || null;

  res.status(200).render('lesson', {
    title: `${lesson.title} — Lumio`,
    lesson,
    allLessons,
    completedIds,
    nextLesson,
    prevLesson,
    enrollment,
    isCompleted: completedIds.includes(lesson._id.toString()),
  });
});

//  LOGIN PAGE
export const getLogin = (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.status(200).render('login', { title: 'Log In — Lumio' });
};

//  SIGNUP PAGE
export const getSignup = (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.status(200).render('signup', { title: 'Create Account — Lumio' });
};

//  DASHBOARD
export const getDashboard = catchAsync(async (req, res) => {
  let data = {};

  if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course', 'title slug thumbnail totalLessons')
      .sort('-enrolledAt')
      .limit(5);
    data.enrollments = enrollments;
  } else if (req.user.role === 'instructor') {
    const courses = await Course.find({ instructor: req.user.id }).sort(
      '-createdAt',
    );
    data.courses = courses;
  }

  res.status(200).render('dashboard', { title: 'Dashboard — Lumio', ...data });
});

//  PROFILE PAGE
export const getProfile = (req, res) => {
  res.status(200).render('profile', { title: 'Profile Settings — Lumio' });
};

//  CREATE COURSE PAGE
export const getCreateCourse = (req, res) => {
  res.status(200).render('createCourse', {
    title: 'New Course — Lumio',
    categories: CATEGORIES,
    levels: LEVELS,
  });
};

//  FORGOT PASSWORD PAGE
export const getForgotPassword = (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res
    .status(200)
    .render('forgotPassword', { title: 'Forgot Password — Lumio' });
};

//  RESET PASSWORD PAGE
export const getResetPassword = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password — Lumio',
    token: req.params.token,
  });
};
