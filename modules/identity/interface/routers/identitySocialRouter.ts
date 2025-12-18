/**
 * Identity Social Login Router
 * 
 * Routes for OAuth/social login authentication.
 */

import { Router } from 'express';
import {
  getOAuthConfig,
  customerSocialLogin,
  merchantSocialLogin,
  linkCustomerSocialAccount,
  unlinkCustomerSocialAccount,
  getCustomerLinkedAccounts,
  getMerchantLinkedAccounts
} from '../../controllers/identitySocialController';

const router = Router();

// ============================================================================
// Public Routes - OAuth Configuration
// ============================================================================

/**
 * GET /identity/social/:provider/config
 * Get OAuth configuration for a provider (client ID, auth URL, scopes)
 */
router.get('/identity/:provider/config', getOAuthConfig);

// ============================================================================
// Customer Social Login Routes
// ============================================================================

/**
 * POST /identity/social/:provider/customer
 * Authenticate or register a customer via social login
 * Body: { accessToken, idToken?, profile: { id, email, name?, ... } }
 */
router.post('/identity/:provider/customer', customerSocialLogin);

/**
 * POST /identity/social/:provider/customer/link
 * Link a social account to an existing customer (requires auth)
 * Body: { accessToken, profile: { id, email?, ... } }
 */
router.post('/identity/:provider/customer/link', linkCustomerSocialAccount);

/**
 * DELETE /identity/social/:provider/customer/unlink
 * Unlink a social account from a customer (requires auth)
 */
router.delete('/identity/:provider/customer/unlink', unlinkCustomerSocialAccount);

/**
 * GET /identity/social/customer/accounts
 * Get all linked social accounts for a customer (requires auth)
 */
router.get('/identity/customer/accounts', getCustomerLinkedAccounts);

// ============================================================================
// Merchant Social Login Routes
// ============================================================================

/**
 * POST /identity/social/:provider/merchant
 * Authenticate or register a merchant via social login
 * Body: { accessToken, idToken?, profile: { id, email, name?, ... } }
 */
router.post('/identity/:provider/merchant', merchantSocialLogin);

/**
 * GET /identity/social/merchant/accounts
 * Get all linked social accounts for a merchant (requires auth)
 */
router.get('/identity/merchant/accounts', getMerchantLinkedAccounts);

export const identitySocialRouter = router;
