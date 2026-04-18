import { Router } from 'express';
import {
  getCourseProgress,
  updateLessonProgress,
  getLessonProgress,
} from '../controllers/progressController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { updateProgressValidator } from '../validators/resourceValidators.js';

const router = Router();

router.use(protect, restrictTo('student'));

router.get('/courses/:courseId', getCourseProgress);
router.get('/lessons/:lessonId', getLessonProgress);
router.patch(
  '/lessons/:lessonId',
  updateProgressValidator,
  validate,
  updateLessonProgress,
);

export default router;
