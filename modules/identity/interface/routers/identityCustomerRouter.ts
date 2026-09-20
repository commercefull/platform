/**
 * Identity Customer Router
 * Routes for customer authentication
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import {
  loginCustomer,
  registerCustomer,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestEmailVerification,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  logoutCustomer,
  get2FAStatus,
} from '../controllers/identityCustomerController';

const router = createHttpRouter();

// -------------------- Public Auth Routes --------------------

// Simple login (returns access token only)
router.post('/identity/login', asyncHandler(loginCustomer));

// Register new customer account
router.post('/identity/register', asyncHandler(registerCustomer));

// Token-based auth (returns access + refresh tokens)
router.post('/identity/token', asyncHandler(issueTokenPair));

// Refresh access token
router.post('/identity/refresh', asyncHandler(renewAccessToken));

// Validate token
router.post('/identity/validate', asyncHandler(checkTokenValidity));

router.post('/identity/request-verification', asyncHandler(requestEmailVerification));
router.get('/identity/verify-email', asyncHandler(verifyEmail));

// Password reset flow
router.post('/identity/forgot-password', asyncHandler(requestPasswordReset));
router.post('/identity/reset-password', asyncHandler(resetPassword));

// -------------------- Authenticated Routes --------------------

// Logout (requires auth to blacklist token)
router.post('/identity/logout', isCustomerLoggedIn, asyncHandler(logoutCustomer));

// 2FA status (requires auth)
router.get('/identity/2fa/status', isCustomerLoggedIn, asyncHandler(get2FAStatus));

export const identityCustomerRouter = router;
