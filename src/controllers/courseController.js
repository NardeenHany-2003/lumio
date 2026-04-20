import Course     from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError   from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import * as factory from '../utils/handlerFactory.js';
import {
  checkCourseOwnership,
  setInstructor,
  processThumbnail,
  filterCourseUpdate,
} from '../middleware/courseMiddleware.js';


// ─────────────────────────────────────────────
//  MIDDLEWARE: set instructor before create
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
//  GET ALL COURSES  (with filter/sort/search/paginate)
// ─────────────────────────────────────────────
export const getAllCourses = catchAsync(async (req, res, next) => {
  const baseQuery  = Course.find({ isPublished: true });
  const countQuery = Course.find({ isPublished: true });

  const features = new APIFeatures(baseQuery, req.query)
    .filter()
    .search(['title', 'description', 'tags'])
    .sort()
    .limitFields()
    .paginate();

  const countFeatures = new APIFeatures(countQuery, req.query)
    .filter()
    .search(['title', 'description', 'tags']);

  const [rawCourses, total] = await Promise.all([
    features.query,
    countFeatures.query.countDocuments(),
  ]);

  // Filter out courses whose instructor was deactivated (population returns null)
  const courses = rawCourses.filter((c) => c.instructor !== null);

  res.status(200).json({
    status:  'success',
    results: courses.length,
    pagination: {
      total,
      page:       features.page,
      limit:      features.limit,
      totalPages: Math.ceil(total / features.limit),
    },
    data: { courses },
  });
});

// ─────────────────────────────────────────────
//  GET ONE COURSE  (by id or slug)
// ─────────────────────────────────────────────
export const getCourse = catchAsync(async (req, res, next) => {
  const param    = req.params.id;
  const isObjId  = /^[a-fA-F0-9]{24}$/.test(param);

  const course = await Course.findOne(
    isObjId ? { _id: param } : { slug: param },
  ).populate({ path: 'lessons', options: { sort: { order: 1 } } });

  if (!course) return next(new AppError('No course found with that ID or slug.', 404));

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course:  course._id,
    });
    isEnrolled = !!enrollment;
  }

  res.status(200).json({
    status: 'success',
    data:   { course, isEnrolled },
  });
});

// ─────────────────────────────────────────────
//  CREATE COURSE  — factory (setInstructor runs first in route)
// ─────────────────────────────────────────────
export const createCourse = factory.createOne(Course, 'course');

// ─────────────────────────────────────────────
//  UPDATE COURSE  — factory (checkCourseOwnership + filterCourseUpdate run first)
// ─────────────────────────────────────────────
export const updateCourse = factory.updateOne(Course, 'course');

// ─────────────────────────────────────────────
//  DELETE COURSE  — factory (checkCourseOwnership runs first in route)
// ─────────────────────────────────────────────
export const deleteCourse = factory.deleteOne(Course);

// ─────────────────────────────────────────────
//  PUBLISH / UNPUBLISH  (req.course set by checkCourseOwnership)
// ─────────────────────────────────────────────
export const publishCourse = catchAsync(async (req, res, next) => {
  req.course.isPublished = true;
  await req.course.save({ validateBeforeSave: false });

  res.status(200).json({
    status:  'success',
    message: 'Course published successfully.',
    data:    { course: req.course },
  });
});

export const unpublishCourse = catchAsync(async (req, res, next) => {
  req.course.isPublished = false;
  await req.course.save({ validateBeforeSave: false });

  res.status(200).json({
    status:  'success',
    message: 'Course unpublished.',
    data:    { course: req.course },
  });
});

// ─────────────────────────────────────────────
//  MY COURSES  (instructor)
// ─────────────────────────────────────────────
export const getMyCourses = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Course.find({ instructor: req.user.id }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const courses = await features.query;

  res.status(200).json({
    status:  'success',
    results: courses.length,
    data:    { courses },
  });
});

// ─────────────────────────────────────────────
//  COURSE STATS  (aggregation — admin/instructor)
// ─────────────────────────────────────────────
export const getCourseStats = catchAsync(async (req, res, next) => {
  const stats = await Course.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id:           '$category',
        numCourses:    { $sum: 1 },
        numStudents:   { $sum: '$totalStudents' },
        avgRating:     { $avg: '$ratingsAverage' },
        avgPrice:      { $avg: '$price' },
        minPrice:      { $min: '$price' },
        maxPrice:      { $max: '$price' },
        totalDuration: { $sum: '$totalDuration' },
      },
    },
    { $sort: { numCourses: -1 } },
  ]);

  res.status(200).json({ status: 'success', data: { stats } });
});

// ─────────────────────────────────────────────
//  ALIAS: TOP 5 COURSES
// ─────────────────────────────────────────────
export const aliasTopCourses = (req, res, next) => {
  req.query.limit  = '5';
  req.query.sort   = '-ratingsAverage,-totalStudents';
  req.query.fields = 'title,slug,ratingsAverage,totalStudents,price,thumbnail,instructor';
  next();
};