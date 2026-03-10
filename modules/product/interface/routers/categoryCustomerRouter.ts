/**
 * Category Customer Router
 * Defines API routes for customer-facing category operations
 */

import express from 'express';
import * as categoryController from '../controllers/CategoryCustomerController';

const router = express.Router();

/**
 * List all active categories
 * GET /customer/categories
 * Query params: ?featured=true | ?menu=true | ?root=true
 */
router.get('/categories', categoryController.listCategories);

/**
 * Get subcategories of a parent category
 * GET /customer/categories/:categoryId/children
 */
router.get('/categories/:categoryId/children', categoryController.getCategoryChildren);

/**
 * Get category by ID or slug
 * GET /customer/categories/:identifier
 */
router.get('/categories/:identifier', categoryController.getCategory);

export const categoryCustomerRouter = router;
