/**
 * GDPR Admin/Business Router
 * Routes for admin operations on GDPR requests
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
} from '../controllers/GdprController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply merchant authentication to all routes
router.use(isOrganizationLoggedIn);

// ============================================================================
// GDPR Data Request Management (Admin)
// ============================================================================

// List all GDPR requests
router.get('/gdpr/requests', asyncHandler(listDataRequests));

// Get GDPR statistics
router.get('/gdpr/statistics', asyncHandler(getGdprStatistics));

// Get overdue requests
router.get('/gdpr/requests/overdue', asyncHandler(getOverdueRequests));

// Get a specific request
router.get('/gdpr/requests/:gdprDataRequestId', asyncHandler(getDataRequest));

// Verify customer identity
router.post('/gdpr/requests/:gdprDataRequestId/verify', asyncHandler(verifyIdentity));

// Process export request
router.post('/gdpr/requests/:gdprDataRequestId/export', asyncHandler(processExportRequest));

// Process deletion request
router.post('/gdpr/requests/:gdprDataRequestId/delete', asyncHandler(processDeletionRequest));

// Reject a request
router.post('/gdpr/requests/:gdprDataRequestId/reject', asyncHandler(rejectRequest));

// ============================================================================
// Cookie Consent Statistics (Admin)
// ============================================================================

// Get cookie consent statistics
router.get('/gdpr/cookies/statistics', asyncHandler(getCookieConsentStatistics));

export const gdprBusinessRouter = router;
