import { Router } from 'express';
import {
  getLessonComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import {
  setLessonFilter,
  checkCommentOwnership,
} from '../middleware/resource/commentMiddleware.js';
import { protect, isLoggedIn } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import {
  createCommentValidator,
  updateCommentValidator,
} from '../validators/resourceValidators.js';

const router = Router({ mergeParams: true });

router.get(
  '/:lessonId/comments',
  isLoggedIn,
  setLessonFilter,
  getLessonComments,
);

router.use(protect);
router.post('/', createCommentValidator, validate, createComment);
router.patch('/:id', updateCommentValidator, validate, updateComment);
router.delete('/:id', checkCommentOwnership, deleteComment);

export default router;
