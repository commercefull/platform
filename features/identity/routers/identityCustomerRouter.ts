import express from 'express';
import {
  loginCustomer,
  registerCustomer,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword
} from '../controllers/identityCustomerController';

const router = express.Router();

/**
 * Customer Authentication Routes
 * All routes are publicly accessible except where auth middleware is applied
 */

// Basic login/register (returns simple JWT)
router.post('/login', loginCustomer);
router.post('/register', registerCustomer);

// Token-based authentication (returns access + refresh tokens)
router.post('/token', issueTokenPair);
router.post('/token/refresh', renewAccessToken);
router.post('/token/validate', checkTokenValidity);

// Password reset flow
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/reset', resetPassword);

export const identityCustomerRouter = router;
