/**
 * GDPR Public Router
 * Routes for customer-facing GDPR operations
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
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

// Wrapper for async handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => 
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ============================================================================
// Cookie Consent Routes (Public - no auth required)
// ============================================================================

// Record cookie consent
router.post('/cookies/consent', recordCookieConsent);

// Get current consent
router.get('/cookies/consent', getCookieConsent);

// Accept all cookies
router.post('/cookies/accept-all', acceptAllCookies);

// Reject all optional cookies
router.post('/cookies/reject-all', rejectAllCookies);

// Update cookie preferences
router.put('/cookies/consent/:cookieConsentId', updateCookieConsent);

// ============================================================================
// GDPR Data Request Routes (Authenticated customers)
// ============================================================================

// Create a new data request
router.post('/requests', isCustomerLoggedIn, createDataRequest);

// Get my data requests
router.get('/requests', isCustomerLoggedIn, getMyDataRequests);

// Cancel a request
router.post('/requests/:gdprDataRequestId/cancel', isCustomerLoggedIn, cancelDataRequest);

export default router;
