/**
 * GDPR Controller for Admin Hub
 * Handles GDPR compliance features
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import * as adminGdprRepo from '../../../modules/gdpr/infrastructure/repositories/adminGdprRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// GDPR Dashboard
// ============================================================================

export const gdprDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminGdprRepo.getGdprStats();
    const consent = await adminGdprRepo.getConsentStats();
    const requests = await adminGdprRepo.findRecentRequests(20);

    adminRespond(req, res, 'gdpr/index', {
      pageName: 'GDPR Compliance',
      stats: {
        pendingRequests: stats.pendingRequests,
        completedRequests: stats.completedRequests,
        avgProcessingDays: stats.avgProcessingDays,
        consentRate: consent.marketingConsentRate,
      },
      requests,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load GDPR dashboard',
    });
  }
};

// ============================================================================
// GDPR Requests CRUD
// ============================================================================

export const createGdprRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { requestType, customerEmail, customerName, description } = body;

    const customerId = await adminGdprRepo.findCustomerIdByEmail(customerEmail);

    await adminGdprRepo.createRequest({
      customerId: customerId || null,
      requestType,
      description: description || undefined,
      customerEmail,
      customerName: customerName || undefined,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.redirect('/hub/gdpr?success=GDPR request created');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/gdpr?error=' + encodeURIComponent((error as Error).message));
  }
};

export const viewGdprRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await adminGdprRepo.findRequestById(requestId);

    if (!request) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'GDPR request not found',
      });
      return;
    }

    adminRespond(req, res, 'gdpr/view', {
      pageName: `GDPR Request: ${(request as Record<string, unknown>).requestType}`,
      request,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load GDPR request',
    });
  }
};

export const processGdprRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    await adminGdprRepo.updateStatus(requestId, 'processing');

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const completeGdprRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const body = req.body as RequestBody;
    const { notes } = body;

    await adminGdprRepo.completeRequest(requestId, notes);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Consent Management
// ============================================================================

export const consentManagement = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const consentSettings = {
      cookieConsentRequired: true,
      marketingConsentRequired: true,
      analyticsConsentRequired: true,
      consentRetentionDays: 365,
    };

    adminRespond(req, res, 'gdpr/consent', {
      pageName: 'Consent Management',
      consentSettings,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load consent management',
    });
  }
};
