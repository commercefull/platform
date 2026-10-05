/**
 * Assortment Customer Router
 * Public storefront collection browsing.
 * Mounted at /customer.
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as controller from '../controllers/AssortmentCustomerController';

const router = createHttpRouter();

/**
 * List published collections
 * GET /customer/assortment/collections
 */
router.get('/assortment/collections', asyncHandler(controller.listCollections));

/**
 * Get collection page by slug (metadata + resolved products)
 * GET /customer/assortment/collections/:slug
 */
router.get('/assortment/collections/:slug', asyncHandler(controller.getCollectionBySlug));

export const assortmentCustomerRouter = router;
