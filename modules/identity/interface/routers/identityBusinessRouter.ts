/**
 * Identity Business Router
 * Routes for merchant/admin authentication
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
router.post('/auth/login', asyncHandler(loginOrganization));

// Register new merchant account
router.post('/auth/register', asyncHandler(registerOrganization));

// Token-based auth (returns access + refresh tokens)
router.post('/auth/token', asyncHandler(issueTokenPair));

// Refresh access token
router.post('/auth/refresh', asyncHandler(renewAccessToken));

// Validate token
router.post('/auth/validate', asyncHandler(checkTokenValidity));

// Password reset flow
router.post('/auth/forgot-password', asyncHandler(requestPasswordReset));
router.post('/auth/reset-password', asyncHandler(resetPassword));

// -------------------- Admin Auth Management Routes (Protected) --------------------

router.use(isOrganizationLoggedIn);

router.get('/auth/user/:userId', asyncHandler(getUserAuthDetails));
router.post('/auth/revoke-tokens', asyncHandler(revokeUserTokens));
router.post('/auth/force-reset', asyncHandler(forceResetPassword));
router.post('/auth/cleanup-tokens', asyncHandler(cleanupExpiredTokens));

router.use(userStoreRouter);

export const identityBusinessRouter = router;
