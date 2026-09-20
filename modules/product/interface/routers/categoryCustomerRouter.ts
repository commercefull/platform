/**
 * Category Customer Router
 * Defines API routes for customer-facing category operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as categoryController from '../controllers/CategoryCustomerController';

const router = createHttpRouter();

/**
 * List all active categories
 * GET /customer/categories
 * Query params: ?featured=true | ?menu=true | ?root=true
 */
router.get('/categories', asyncHandler(categoryController.listCategories));

/**
 * Get subcategories of a parent category
 * GET /customer/categories/:categoryId/children
 */
router.get('/categories/:categoryId/children', asyncHandler(categoryController.getCategoryChildren));

/**
 * Get category by ID or slug
 * GET /customer/categories/:identifier
 */
router.get('/categories/:identifier', asyncHandler(categoryController.getCategory));

export const categoryCustomerRouter = router;
