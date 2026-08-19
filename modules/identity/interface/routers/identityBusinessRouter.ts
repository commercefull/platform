/**
 * Identity Business Router
 * Routes for merchant/admin authentication
 */

import { Router } from 'express';
import {
  loginOrganization,
  registerOrganization,
  issueTokenPair,
  renewAccessToken,
  checkTokenValidity,
  requestPasswordReset,
  resetPassword,
  getUserAuthDetails,
  revokeUserTokens,
  forceResetPassword,
  cleanupExpiredTokens,
} from '../controllers/identityBusinessController';
import { userStoreRouter } from './userStoreRouter';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();

// -------------------- Public Auth Routes --------------------

// Simple login (returns access token only)
router.post('/auth/login', loginOrganization);

// Register new merchant account
router.post('/auth/register', registerOrganization);

// Token-based auth (returns access + refresh tokens)
router.post('/auth/token', issueTokenPair);

// Refresh access token
router.post('/auth/refresh', renewAccessToken);

// Validate token
router.post('/auth/validate', checkTokenValidity);

// Password reset flow
router.post('/auth/forgot-password', requestPasswordReset);
router.post('/auth/reset-password', resetPassword);

// -------------------- Admin Auth Management Routes (Protected) --------------------

router.use(isOrganizationLoggedIn);

router.get('/auth/user/:userId', getUserAuthDetails);
router.post('/auth/revoke-tokens', revokeUserTokens);
router.post('/auth/force-reset', forceResetPassword);
router.post('/auth/cleanup-tokens', cleanupExpiredTokens);

router.use(userStoreRouter);

export const identityBusinessRouter = router;
