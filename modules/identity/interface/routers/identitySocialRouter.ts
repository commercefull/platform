/**
 * Identity Social Login Router
 *
 * Routes for OAuth/social login authentication.
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn, isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  getOAuthConfig,
  customerSocialLogin,
  merchantSocialLogin,
  linkCustomerSocialAccount,
  unlinkCustomerSocialAccount,
  getCustomerLinkedAccounts,
  getOrganizationLinkedAccounts,
} from '../controllers/identitySocialController';

const router = Router();

// ============================================================================
// Public Routes - OAuth Configuration
// ============================================================================

/**
 * GET /identity/social/:provider/config
 * Get OAuth configuration for a provider (client ID, auth URL, scopes)
 */
router.get('/identity/:provider/config', asyncHandler(getOAuthConfig));

// ============================================================================
// Customer Social Login Routes
// ============================================================================

/**
 * POST /identity/social/:provider/customer
 * Authenticate or register a customer via social login
 * Body: { accessToken, idToken?, profile: { id, email, name?, ... } }
 */
router.post('/identity/:provider/customer', asyncHandler(customerSocialLogin));

/**
 * POST /identity/social/:provider/customer/link
 * Link a social account to an existing customer (requires auth)
 * Body: { accessToken, profile: { id, email?, ... } }
 */
router.post('/identity/:provider/customer/link', isCustomerLoggedIn, asyncHandler(linkCustomerSocialAccount));

/**
 * DELETE /identity/social/:provider/customer/unlink
 * Unlink a social account from a customer (requires auth)
 */
router.delete('/identity/:provider/customer/unlink', isCustomerLoggedIn, asyncHandler(unlinkCustomerSocialAccount));

/**
 * GET /identity/social/customer/accounts
 * Get all linked social accounts for a customer (requires auth)
 */
router.get('/identity/customer/accounts', isCustomerLoggedIn, asyncHandler(getCustomerLinkedAccounts));

// ============================================================================
// Merchant Social Login Routes
// ============================================================================

/**
 * POST /identity/social/:provider/merchant
 * Authenticate or register a merchant via social login
 * Body: { accessToken, idToken?, profile: { id, email, name?, ... } }
 */
router.post('/identity/:provider/merchant', asyncHandler(merchantSocialLogin));
router.post('/identity/:provider/organization', asyncHandler(merchantSocialLogin));

/**
 * GET /identity/social/merchant/accounts
 * Get all linked social accounts for a merchant (requires auth)
 */
router.get('/identity/merchant/accounts', isOrganizationLoggedIn, asyncHandler(getOrganizationLinkedAccounts));
router.get('/identity/organization/accounts', isOrganizationLoggedIn, asyncHandler(getOrganizationLinkedAccounts));

export const identitySocialRouter = router;
