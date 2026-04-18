import { Router } from 'express';
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js';
import { checkLessonOwnership } from '../middleware/resource/lessonMiddleware.js';
import {
  protect,
  restrictTo,
  isLoggedIn,
} from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { uploadLessonVideo } from '../middleware/uploadMiddleware.js';
import {
  createLessonValidator,
  updateLessonValidator,
} from '../validators/resourceValidators.js';

const router = Router({ mergeParams: true });

router.get('/', isLoggedIn, getLessons);
router.get('/:id', protect, getLesson);

router.use(protect);

router.post(
  '/',
  restrictTo('instructor', 'admin'),
  uploadLessonVideo,
  createLessonValidator,
  validate,
  createLesson,
);

router.patch(
  '/:id',
  restrictTo('instructor', 'admin'),
  checkLessonOwnership,
  uploadLessonVideo,
  updateLessonValidator,
  validate,
  updateLesson,
);

router.delete(
  '/:id',
  restrictTo('instructor', 'admin'),
  checkLessonOwnership,
  deleteLesson,
);

export default router;
