/**
 * GDPR Controller for Admin Hub
 * Handles GDPR compliance features
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageAdminGdprUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// GDPR Dashboard
// ============================================================================

export const gdprDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageAdminGdprUseCase.getGdprStats();
  const consent = await manageAdminGdprUseCase.getConsentStats();
  const requests = await manageAdminGdprUseCase.findRecentRequests(20);

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
};

// ============================================================================
// GDPR Requests CRUD
// ============================================================================

export const createGdprRequest = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { requestType, customerEmail, customerName, description } = body as {
      requestType: string;
      customerEmail: string;
      customerName?: string;
      description?: string;
    };

    const customerId = await manageAdminGdprUseCase.findCustomerIdByEmail(customerEmail);

    await manageAdminGdprUseCase.createRequest({
      customerId: customerId || null,
      requestType,
      description: description || undefined,
      customerEmail,
      customerName: customerName || undefined,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.redirect('/hub/gdpr?success=GDPR request created');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/gdpr?error=' + encodeURIComponent((error as Error).message));
  }
};

export const viewGdprRequest = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { requestId } = req.params;

  const request = await manageAdminGdprUseCase.findRequestById(requestId);

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
};

export const processGdprRequest = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { requestId } = req.params;

  await manageAdminGdprUseCase.updateStatus(requestId, 'processing');

  res.json({ success: true });
};

export const completeGdprRequest = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { requestId } = req.params;
  const body = req.body as HttpRequestBody;
  const { notes } = body as { notes?: string };

  await manageAdminGdprUseCase.completeRequest(requestId, notes);

  res.json({ success: true });
};

// ============================================================================
// Consent Management
// ============================================================================

export const consentManagement = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
};
