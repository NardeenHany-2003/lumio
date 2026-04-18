import { Router } from 'express';
import {
  setMe,
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadUserPhoto } from '../middleware/uploadMiddleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// Current user (any authenticated role) 
router.get('/me', setMe, getMe);
router.patch('/update-me', uploadUserPhoto, updateMe);
router.delete('/delete-me', deleteMe);

//  Admin only
router.use(restrictTo('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser); // for admin edits — NOT for password changes
router.delete('/:id', deleteUser);

export default router;
