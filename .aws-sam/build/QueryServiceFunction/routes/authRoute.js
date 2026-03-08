import express from 'express';
import { createUser, loginUser, getUser, updateUser, deleteUser } from '../controllers/crud.js';
import authenticate from '../middlewares/jwtMiddleware.js';

const router = express.Router();

// ─── Public routes (no token needed) ───────────────────────────────
router.post('/register', createUser);
router.post('/login', loginUser);

// ─── Protected routes (token required) ─────────────────────────────
router.get('/user', authenticate, getUser);
router.patch('/user', authenticate, updateUser);
router.delete('/user', authenticate, deleteUser);

export default router;