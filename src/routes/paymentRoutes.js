import { Router } from 'express';
import { getCheckoutSession } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/checkout-session/:courseId', getCheckoutSession);

export default router;
