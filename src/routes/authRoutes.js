import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import {
  signupValidator,
  loginValidator,
  updatePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js';

const router = Router();

// Public 
router.post('/signup', signupValidator, validate, signup);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  validate,
  forgotPassword,
);
router.patch(
  '/reset-password/:token',
  resetPasswordValidator,
  validate,
  resetPassword,
);

// Authenticated 
router.use(protect);
router.post('/logout', logout);
router.patch(
  '/update-password',
  updatePasswordValidator,
  validate,
  updatePassword,
);

export default router;
