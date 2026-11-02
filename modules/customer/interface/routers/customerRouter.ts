/**
 * Customer Router
 * Defines API routes for customer operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getMyProfile,
  setDefaultAddress,
  updateAddress,
  updateMyProfile,
} from '../controllers/CustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// ============================================================================
// Protected Routes
// ============================================================================

// Apply authentication middleware for remaining routes
router.use('/me', isCustomerLoggedIn);

/**
 * Get my profile
 * GET /customers/me
 */
router.get('/me', asyncHandler(getMyProfile));

/**
 * Update my profile
 * PUT /customers/me
 */
router.put('/me', asyncHandler(updateMyProfile));

/**
 * Get my addresses
 * GET /customers/me/addresses
 */
router.get('/me/addresses', asyncHandler(getAddresses));

/**
 * Add a new address
 * POST /customers/me/addresses
 */
router.post('/me/addresses', asyncHandler(addAddress));

/**
 * Update an address
 * PUT /customers/me/addresses/:addressId
 */
router.put('/me/addresses/:addressId', asyncHandler(updateAddress));

/**
 * Delete an address
 * DELETE /customers/me/addresses/:addressId
 */
router.delete('/me/addresses/:addressId', asyncHandler(deleteAddress));

/**
 * Set default address
 * POST /customers/me/addresses/:addressId/default
 */
router.post('/me/addresses/:addressId/default', asyncHandler(setDefaultAddress));

export const customerRouter = router;
