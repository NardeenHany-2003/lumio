import { Router } from 'express';
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  getMyCourses,
  getCourseStats,
  aliasTopCourses,
} from '../controllers/courseController.js';
import {
  checkCourseOwnership,
  setInstructor,
  filterCourseUpdate,
  processThumbnail,
} from '../middleware/resource/courseMiddleware.js';
import {
  protect,
  restrictTo,
  isLoggedIn,
} from '../middleware/authMiddleware.js';
import { uploadCourseThumbnail } from '../middleware/uploadMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import {
  createCourseValidator,
  updateCourseValidator,
  courseQueryValidator,
} from '../validators/courseValidators.js';

// Nested routers
import enrollmentRouter from './enrollmentRoutes.js';
import lessonRouter from './lessonRoutes.js';
import ratingRouter from './ratingRoutes.js';

const router = Router();

// Mount nested routers
router.use('/:courseId/enrollments', enrollmentRouter);
router.use('/:courseId/lessons', lessonRouter);
router.use('/:courseId/ratings', ratingRouter);

// Public
router.get(
  '/top-5',
  aliasTopCourses,
  isLoggedIn,
  courseQueryValidator,
  validate,
  getAllCourses,
);
router.get(
  '/stats',
  protect,
  restrictTo('admin', 'instructor'),
  getCourseStats,
);
router.get('/my', protect, restrictTo('instructor', 'admin'), getMyCourses);
router.get('/', isLoggedIn, courseQueryValidator, validate, getAllCourses);
router.get('/:id', isLoggedIn, getCourse);

// Instructor / Admin only
router.use(protect);

router.post(
  '/',
  restrictTo('instructor', 'admin'),
  uploadCourseThumbnail, 
  createCourseValidator,
  validate,
  setInstructor, 
  processThumbnail, 
  createCourse,
);

router.patch(
  '/:id',
  restrictTo('instructor', 'admin'),
  checkCourseOwnership,
  uploadCourseThumbnail,
  filterCourseUpdate, 
  updateCourseValidator,
  validate,
  processThumbnail, 
  updateCourse, 
);

router.delete(
  '/:id',
  restrictTo('instructor', 'admin'),
  checkCourseOwnership,
  deleteCourse,
);

router.patch(
  '/:id/publish',
  restrictTo('instructor', 'admin'),
  checkCourseOwnership,
  publishCourse,
);
router.patch(
  '/:id/unpublish',
  restrictTo('instructor', 'admin'),
  checkCourseOwnership,
  unpublishCourse,
);

export default router;
