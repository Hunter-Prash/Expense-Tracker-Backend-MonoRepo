import express from 'express';
import { setDailyLimit, setWeeklyLimit, setMonthlyLimit, getLimits, deleteLimits } from '../controllers/limitsController.js';
import authenticate from '../middlewares/jwtMiddleware.js';

const router = express.Router();

// All limit routes are protected
router.get('/', authenticate, getLimits);
router.patch('/daily', authenticate, setDailyLimit);
router.patch('/weekly', authenticate, setWeeklyLimit);
router.patch('/monthly', authenticate, setMonthlyLimit);
router.delete('/', authenticate, deleteLimits);

export default router;
