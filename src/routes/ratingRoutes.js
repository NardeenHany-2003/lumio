import { Router } from 'express';
import {
  getCourseRatings,
  createRating,
  updateRating,
  deleteRating,
} from '../controllers/ratingController.js';
import {
  setCourseFilter,
  checkRatingOwnership,
} from '../middleware/ratingMiddleware.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import {
  createRatingValidator,
  updateRatingValidator,
} from '../validators/resourceValidators.js';

const router = Router({ mergeParams: true });

router.get('/', setCourseFilter, getCourseRatings);

router.use(protect);
router.post(
  '/',
  restrictTo('student'),
  createRatingValidator,
  validate,
  createRating,
);
router.patch(
  '/:id',
  restrictTo('student'),
  updateRatingValidator,
  validate,
  updateRating,
);
router.delete('/:id', checkRatingOwnership, deleteRating);

export default router;
