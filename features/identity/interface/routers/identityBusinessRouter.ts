/**
 * Identity Business Router
 * Routes for merchant/admin authentication
 */

import { Router } from 'express';
import {
  loginMerchant,
  registerMerchant,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword
} from '../../controllers/identityBusinessController';

const router = Router();

// -------------------- Public Auth Routes --------------------

// Simple login (returns access token only)
router.post('/auth/login', loginMerchant);

// Register new merchant account
router.post('/auth/register', registerMerchant);

// Token-based auth (returns access + refresh tokens)
router.post('/auth/token', issueTokenPair);

// Refresh access token
router.post('/auth/refresh', renewAccessToken);

// Validate token
router.post('/auth/validate', checkTokenValidity);

// Password reset flow
router.post('/auth/forgot-password', requestPasswordReset);
router.post('/auth/reset-password', resetPassword);

export const identityBusinessRouter = router;
export default router;
