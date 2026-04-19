import { Router } from 'express';
import {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  getCourseEnrollments,
  checkEnrollment,
} from '../controllers/enrollmentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/my', restrictTo('student'), getMyEnrollments);

// /api/v1/courses/:courseId/enrollments
router.get('/', restrictTo('instructor'), getCourseEnrollments);
router.get('/check', checkEnrollment);
router.post('/', restrictTo('student'), enrollInCourse);
router.delete('/', restrictTo('student'), unenrollFromCourse);

export default router;
