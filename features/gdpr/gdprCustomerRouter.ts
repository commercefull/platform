/**
 * GDPR Public Router
 * Routes for customer-facing GDPR operations
 */

import express from 'express';
import {
  createDataRequest,
  getMyDataRequests,
  cancelDataRequest,
  recordCookieConsent,
  getCookieConsent,
  acceptAllCookies,
  rejectAllCookies,
  updateCookieConsent
} from './interface/controllers/GdprController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// ============================================================================
// Cookie Consent Routes (Public - no auth required)
// ============================================================================

// Record cookie consent
router.post('/gdpr/cookies/consent', recordCookieConsent);

// Get current consent
router.get('/gdpr/cookies/consent', getCookieConsent);

// Accept all cookies
router.post('/gdpr/cookies/accept-all', acceptAllCookies);

// Reject all optional cookies
router.post('/gdpr/cookies/reject-all', rejectAllCookies);

// Update cookie preferences
router.put('/gdpr/cookies/consent/:cookieConsentId', updateCookieConsent);

// ============================================================================
// GDPR Data Request Routes (Authenticated customers)
// ============================================================================

// Create a new data request
router.post('/gdpr/requests', isCustomerLoggedIn, createDataRequest);

// Get my data requests
router.get('/gdpr/requests', isCustomerLoggedIn, getMyDataRequests);

// Cancel a request
router.post('/gdpr/requests/:gdprDataRequestId/cancel', isCustomerLoggedIn, cancelDataRequest);

export const gdprCustomerRouter = router;
