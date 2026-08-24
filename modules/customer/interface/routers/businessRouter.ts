/**
 * Customer Business Router
 * Defines API routes for business/admin customer operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as customerController from '../controllers/CustomerController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Business/Admin Customer Routes
// ============================================================================

/**
 * List all customers
 * GET /business/customers
 */
router.get('/customers', asyncHandler(customerController.listCustomers));

/**
 * Create a new customer
 * POST /business/customers
 */
router.post('/customers', asyncHandler(customerController.createCustomer));

/**
 * Get customer by ID
 * GET /business/customers/:customerId
 */
router.get('/customers/:customerId', asyncHandler(customerController.getCustomer));

/**
 * Update customer
 * PUT /business/customers/:customerId
 */
router.put('/customers/:customerId', asyncHandler(customerController.updateCustomer));

/**
 * Delete customer
 * DELETE /business/customers/:customerId
 */
router.delete('/customers/:customerId', asyncHandler(customerController.deleteCustomer));

/**
 * Verify customer
 * POST /business/customers/:customerId/verify
 */
router.post('/customers/:customerId/verify', asyncHandler(customerController.verifyCustomer));

/**
 * Deactivate customer
 * POST /business/customers/:customerId/deactivate
 */
router.post('/customers/:customerId/deactivate', asyncHandler(customerController.deactivateCustomer));

/**
 * Reactivate customer
 * POST /business/customers/:customerId/reactivate
 */
router.post('/customers/:customerId/reactivate', asyncHandler(customerController.reactivateCustomer));

// ============================================================================
// Customer Address Routes (Business)
// ============================================================================

/**
 * Get customer addresses
 * GET /business/customers/:customerId/addresses
 */
router.get('/customers/:customerId/addresses', asyncHandler(customerController.getCustomerAddresses));

/**
 * Add customer address
 * POST /business/customers/:customerId/addresses
 */
router.post('/customers/:customerId/addresses', asyncHandler(customerController.addCustomerAddress));

export const customerBusinessRouter = router;
