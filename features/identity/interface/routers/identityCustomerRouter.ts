/**
 * Identity Customer Router
 * Routes for customer authentication
 */

import { Router } from 'express';
import {
  loginCustomer,
  registerCustomer,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword
} from '../../controllers/identityCustomerController';

const router = Router();

// -------------------- Public Auth Routes --------------------

// Simple login (returns access token only)
router.post('/login', loginCustomer);

// Register new customer account
router.post('/register', registerCustomer);

// Token-based auth (returns access + refresh tokens)
router.post('/token', issueTokenPair);

// Refresh access token
router.post('/refresh', renewAccessToken);

// Validate token
router.post('/validate', checkTokenValidity);

// Password reset flow
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export const identityCustomerRouter = router;
export default router;
