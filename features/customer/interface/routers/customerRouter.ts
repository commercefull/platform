/**
 * Customer Router
 * Defines API routes for customer operations
 */

import express from 'express';
import * as customerController from '../controllers/CustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// ============================================================================
// Public Routes
// ============================================================================

/**
 * Register a new customer
 * POST /api/customers/register
 */
router.post('/register', customerController.registerCustomer);

// ============================================================================
// Protected Routes
// ============================================================================

// Apply authentication middleware for remaining routes
router.use(isCustomerLoggedIn);

/**
 * Get my profile
 * GET /api/customers/me
 */
router.get('/me', customerController.getMyProfile);

/**
 * Update my profile
 * PUT /api/customers/me
 */
router.put('/me', customerController.updateMyProfile);

/**
 * Get my addresses
 * GET /api/customers/me/addresses
 */
router.get('/me/addresses', customerController.getAddresses);

/**
 * Add a new address
 * POST /api/customers/me/addresses
 */
router.post('/me/addresses', customerController.addAddress);

/**
 * Update an address
 * PUT /api/customers/me/addresses/:addressId
 */
router.put('/me/addresses/:addressId', customerController.updateAddress);

/**
 * Delete an address
 * DELETE /api/customers/me/addresses/:addressId
 */
router.delete('/me/addresses/:addressId', customerController.deleteAddress);

/**
 * Set default address
 * POST /api/customers/me/addresses/:addressId/default
 */
router.post('/me/addresses/:addressId/default', customerController.setDefaultAddress);

export const customerRouter = router;
export default router;
