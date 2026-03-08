import express from 'express';
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import authenticate from '../middlewares/jwtMiddleware.js';

const router = express.Router();

// All category routes are protected (user must be logged in)
router.post('/', authenticate, createCategory);
router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategoryById);
router.patch('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;
