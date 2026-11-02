/**
 * Customer Business Router
 * Defines API routes for business/admin customer operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  addCustomerAddress,
  createCustomer,
  deactivateCustomer,
  deleteCustomer,
  getCustomer,
  getCustomerAddresses,
  getCustomerGroup,
  getCustomersInGroup,
  listCustomers,
  reactivateCustomer,
  updateCustomer,
  verifyCustomer,
} from '../controllers/CustomerController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Business/Admin Customer Routes
// ============================================================================

/**
 * List all customers
 * GET /business/customers
 */
router.get('/customers', asyncHandler(listCustomers));

/**
 * Create a new customer
 * POST /business/customers
 */
router.post('/customers', asyncHandler(createCustomer));

/**
 * Get customer by ID
 * GET /business/customers/:customerId
 */
router.get('/customers/:customerId', asyncHandler(getCustomer));

/**
 * Update customer
 * PUT /business/customers/:customerId
 */
router.put('/customers/:customerId', asyncHandler(updateCustomer));

/**
 * Delete customer
 * DELETE /business/customers/:customerId
 */
router.delete('/customers/:customerId', asyncHandler(deleteCustomer));

/**
 * Verify customer
 * POST /business/customers/:customerId/verify
 */
router.post('/customers/:customerId/verify', asyncHandler(verifyCustomer));

/**
 * Deactivate customer
 * POST /business/customers/:customerId/deactivate
 */
router.post('/customers/:customerId/deactivate', asyncHandler(deactivateCustomer));

/**
 * Reactivate customer
 * POST /business/customers/:customerId/reactivate
 */
router.post('/customers/:customerId/reactivate', asyncHandler(reactivateCustomer));

// ============================================================================
// Customer Address Routes (Business)
// ============================================================================

/**
 * Get customer addresses
 * GET /business/customers/:customerId/addresses
 */
router.get('/customers/:customerId/addresses', asyncHandler(getCustomerAddresses));

/**
 * Add customer address
 * POST /business/customers/:customerId/addresses
 */
router.post('/customers/:customerId/addresses', asyncHandler(addCustomerAddress));

// ============================================================================
// Customer Group Routes (Business)
// ============================================================================

router.get('/customer-groups/:customerGroupId', asyncHandler(getCustomerGroup));
router.get('/customer-groups/:customerGroupId/customers', asyncHandler(getCustomersInGroup));

export const customerBusinessRouter = router;
