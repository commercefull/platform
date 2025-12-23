/**
 * GDPR Admin/Business Router
 * Routes for admin operations on GDPR requests
 */

import express from 'express';
import {
  listDataRequests,
  getDataRequest,
  getOverdueRequests,
  getGdprStatistics,
  verifyIdentity,
  processExportRequest,
  processDeletionRequest,
  rejectRequest,
  getCookieConsentStatistics,
} from './interface/controllers/GdprController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

// Apply merchant authentication to all routes
router.use(isMerchantLoggedIn);

// ============================================================================
// GDPR Data Request Management (Admin)
// ============================================================================

// List all GDPR requests
router.get('/gdpr/requests', listDataRequests);

// Get GDPR statistics
router.get('/gdpr/statistics', getGdprStatistics);

// Get overdue requests
router.get('/gdpr/requests/overdue', getOverdueRequests);

// Get a specific request
router.get('/gdpr/requests/:gdprDataRequestId', getDataRequest);

// Verify customer identity
router.post('/gdpr/requests/:gdprDataRequestId/verify', verifyIdentity);

// Process export request
router.post('/gdpr/requests/:gdprDataRequestId/export', processExportRequest);

// Process deletion request
router.post('/gdpr/requests/:gdprDataRequestId/delete', processDeletionRequest);

// Reject a request
router.post('/gdpr/requests/:gdprDataRequestId/reject', rejectRequest);

// ============================================================================
// Cookie Consent Statistics (Admin)
// ============================================================================

// Get cookie consent statistics
router.get('/gdpr/cookies/statistics', getCookieConsentStatistics);

export const gdprBusinessRouter = router;
