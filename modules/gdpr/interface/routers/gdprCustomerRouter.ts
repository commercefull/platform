/**
 * GDPR Public Router
 * Routes for customer-facing GDPR operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  createDataRequest,
  getMyDataRequests,
  cancelDataRequest,
  recordCookieConsent,
  getCookieConsent,
  acceptAllCookies,
  rejectAllCookies,
  updateCookieConsent,
} from '../controllers/GdprController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// ============================================================================
// Cookie Consent Routes (Public - no auth required)
// ============================================================================

// Record cookie consent
router.post('/gdpr/cookies/consent', asyncHandler(recordCookieConsent));

// Get current consent
router.get('/gdpr/cookies/consent', asyncHandler(getCookieConsent));

// Accept all cookies
router.post('/gdpr/cookies/accept-all', asyncHandler(acceptAllCookies));

// Reject all optional cookies
router.post('/gdpr/cookies/reject-all', asyncHandler(rejectAllCookies));

// Update cookie preferences
router.put('/gdpr/cookies/consent/:cookieConsentId', asyncHandler(updateCookieConsent));

// ============================================================================
// GDPR Data Request Routes (Authenticated customers)
// ============================================================================

// Create a new data request
router.post('/gdpr/requests', isCustomerLoggedIn, asyncHandler(createDataRequest));

// Get my data requests
router.get('/gdpr/requests', isCustomerLoggedIn, asyncHandler(getMyDataRequests));

// Cancel a request
router.post('/gdpr/requests/:gdprDataRequestId/cancel', isCustomerLoggedIn, asyncHandler(cancelDataRequest));

export const gdprCustomerRouter = router;
