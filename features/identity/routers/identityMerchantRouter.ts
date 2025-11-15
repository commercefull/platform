import express from 'express';
import {
  loginMerchant,
  registerMerchant,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword
} from '../controllers/identityMerchantController';

const router = express.Router();

/**
 * Merchant Authentication Routes
 * All routes are publicly accessible except where auth middleware is applied
 */

// Basic login/register (returns simple JWT)
router.post('/login', loginMerchant);
router.post('/register', registerMerchant);

// Token-based authentication (returns access + refresh tokens)
router.post('/token', issueTokenPair);
router.post('/token/refresh', renewAccessToken);
router.post('/token/validate', checkTokenValidity);

// Password reset flow
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/reset', resetPassword);

export const identityMerchantRouter = router;
