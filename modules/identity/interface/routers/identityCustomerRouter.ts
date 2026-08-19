/**
 * Identity Customer Router
 * Routes for customer authentication
 */

import { Router } from 'express';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import {
  loginCustomer,
  registerCustomer,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword,
  logoutCustomer,
  get2FAStatus,
} from '../controllers/identityCustomerController';

const router = Router();

// -------------------- Public Auth Routes --------------------

// Simple login (returns access token only)
router.post('/identity/login', loginCustomer);

// Register new customer account
router.post('/identity/register', registerCustomer);

// Token-based auth (returns access + refresh tokens)
router.post('/identity/token', issueTokenPair);

// Refresh access token
router.post('/identity/refresh', renewAccessToken);

// Validate token
router.post('/identity/validate', checkTokenValidity);

// Password reset flow
router.post('/identity/forgot-password', requestPasswordReset);
router.post('/identity/reset-password', resetPassword);

// -------------------- Authenticated Routes --------------------

// Logout (requires auth to blacklist token)
router.post('/identity/logout', isCustomerLoggedIn, logoutCustomer);

// 2FA status (requires auth)
router.get('/identity/2fa/status', isCustomerLoggedIn, get2FAStatus);

export const identityCustomerRouter = router;
