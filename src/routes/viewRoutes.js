import { Router } from 'express';
import {
  isLoggedIn,
  protect,
  restrictTo,
} from '../middleware/authMiddleware.js';
import {
  getHome,
  getCourses,
  getCourseDetail,
  getLessonPlayer,
  getLogin,
  getSignup,
  getDashboard,
  getProfile,
  getCreateCourse,
  getEditCourse,
  getForgotPassword,
  getResetPassword,
} from '../controllers/viewController.js';

const router = Router();

router.get('/', isLoggedIn, getHome);
router.get('/courses', isLoggedIn, getCourses);
router.get(
  '/courses/new',
  protect,
  restrictTo('instructor', 'admin'),
  getCreateCourse,
);
router.get('/courses/:slug', isLoggedIn, getCourseDetail);
router.get(
  '/courses/:id/edit',
  protect,
  restrictTo('instructor', 'admin'),
  getEditCourse,
);

router.get('/lessons/:id', protect, getLessonPlayer);
router.get('/login', getLogin);
router.get('/signup', getSignup);
router.get('/forgot-password', getForgotPassword);
router.get('/reset-password/:token', getResetPassword);
router.get('/dashboard', protect, getDashboard);
router.get('/profile', protect, getProfile);

export default router;
