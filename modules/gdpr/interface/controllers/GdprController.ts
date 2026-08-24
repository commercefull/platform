/**
 * GDPR Controller
 * Handles HTTP requests for GDPR-related operations
 */

import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import { query, queryOne } from '../../../../libs/db';
import { GdprRequestType, GdprRequestStatus } from '../../domain/entities/GdprDataRequest';
import { CookiePreferences } from '../../domain/entities/GdprCookieConsent';

// Type for async route handlers
type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;
import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';
import { CreateDataRequestUseCase, CreateDataRequestCommand } from '../../application/useCases/CreateDataRequest';
import {
  ProcessDataRequestUseCase,
  ProcessExportRequestCommand,
  ProcessDeletionRequestCommand,
  RejectRequestCommand,
  VerifyIdentityCommand,
} from '../../application/useCases/ProcessDataRequest';
import { ManageCookieConsentUseCase, RecordCookieConsentCommand, UpdateCookieConsentCommand } from '../../application/useCases/ManageCookieConsent';
import { GdprService } from '../../domain/repositories/GdprRepository';

// ============================================================================
// GDPR Service Factory
// ============================================================================

const gdprDataRequestRepo = gdprDataRepository.dataRequests;
const gdprCookieConsentRepo = gdprDataRepository.cookieConsent;

function createGdprService(): GdprService {
  return {
    dataRequests: gdprDataRequestRepo,
    cookieConsents: gdprCookieConsentRepo,

    exportCustomerData: async (customerId: string) => {
      const customer = await queryOne<Record<string, unknown>>(
        'SELECT "customerId", "email", "firstName", "lastName", "phone", "createdAt", "updatedAt" FROM "customer" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
        [customerId],
      );

      const orders = await query<Record<string, unknown>[]>(
        'SELECT "orderId", "orderNumber", status, "totalAmount", "currency", "createdAt" FROM "order" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
        [customerId],
      );

      const addresses = await query<Record<string, unknown>[]>(
        'SELECT "addressLine1", "addressLine2", city, state, "postalCode", country, "addressType" FROM "customerAddress" WHERE "customerId" = $1',
        [customerId],
      );

      const consents = await query<Record<string, unknown>[]>(
        'SELECT "cookieCategory", "consentGiven", "consentDate" FROM "gdprCookieConsent" WHERE "customerId" = $1 ORDER BY "consentDate" DESC',
        [customerId],
      );

      const activities = await query<Record<string, unknown>[]>(
        'SELECT "eventType", "createdAt" FROM "analyticsReportEvent" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 100',
        [customerId],
      );

      return {
        customer: customer || { customerId },
        orders: orders || [],
        addresses: addresses || [],
        consents: consents || [],
        activities: activities || [],
      };
    },

    anonymizeCustomerData: async (customerId: string) => {
      await query(
        `UPDATE "customer" SET
          "email" = 'anonymized_' || "customerId" || '@deleted.local',
          "firstName" = 'Anonymized',
          "lastName" = 'User',
          "phone" = NULL,
          "dateOfBirth" = NULL,
          "updatedAt" = now()
        WHERE "customerId" = $1`,
        [customerId],
      );

      await query(
        `UPDATE "customerAddress" SET
          "addressLine1" = 'Anonymized',
          "addressLine2" = NULL,
          city = 'Anonymized',
          state = 'Anonymized',
          "postalCode" = '00000'
        WHERE "customerId" = $1`,
        [customerId],
      );
    },

    deleteCustomerData: async (customerId: string) => {
      await query('DELETE FROM "customerAddress" WHERE "customerId" = $1', [customerId]);
      await query('UPDATE "customer" SET "deletedAt" = now(), "email" = \'deleted_\' || "customerId" || \'@deleted.local\', "firstName" = \'Deleted\', "lastName" = \'User\', "phone" = NULL, "dateOfBirth" = NULL, "updatedAt" = now() WHERE "customerId" = $1', [customerId]);
    },
  };
}

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface CreateDataRequestBody {
  customerId?: string;
  requestType: string;
  reason?: string;
  requestedData?: string[];
}

interface _ListDataRequestsQuery {
  customerId?: string;
  requestType?: string;
  status?: string;
  isOverdue?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface VerifyIdentityBody {
  verificationMethod: string;
}

interface ProcessExportBody {
  format?: 'json' | 'csv' | 'xml';
}

interface ProcessDeletionBody {
  notes?: string;
}

interface RejectRequestBody {
  reason: string;
}

interface RecordCookieConsentBody {
  sessionId?: string;
  preferences: CookiePreferences;
  browserFingerprint?: string;
  country?: string;
  region?: string;
  consentBannerVersion?: string;
  consentMethod?: 'banner' | 'settings' | 'api';
}

interface UpdateCookieConsentBody {
  preferences: CookiePreferences;
}

interface AcceptRejectCookieBody {
  sessionId?: string;
}

// Use case instances
const createDataRequestUseCase = new CreateDataRequestUseCase(gdprDataRequestRepo);
const manageCookieConsentUseCase = new ManageCookieConsentUseCase(gdprCookieConsentRepo);

// ============================================================================
// GDPR Data Request Controllers
// ============================================================================

/**
 * Create a new GDPR data request (customer endpoint)
 */
export const createDataRequest: AsyncHandler = async (req, res, _next) => {
  const body = req.body as CreateDataRequestBody;
  const customerId = req.user?.id || req.user?.customerId || req.user?.customerId || body.customerId;
  if (!customerId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Validate requestType
  const validTypes = ['access', 'export', 'deletion', 'rectification', 'objection', 'restriction'];
  if (!body.requestType || !validTypes.includes(body.requestType)) {
    res.status(400).json({ success: false, error: 'Invalid or missing requestType. Valid types: ' + validTypes.join(', ') });
    return;
  }

  const command = new CreateDataRequestCommand(
    customerId,
    body.requestType as GdprRequestType,
    body.reason || '',
    body.requestedData,
    req.ip,
    req.get('User-Agent'),
  );

  const result = await createDataRequestUseCase.execute(command);
  res.status(201).json({ success: true, data: result });
  
};

/**
 * Get customer's GDPR requests
 */
export const getMyDataRequests: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.id || req.user?.customerId || req.user?.customerId;
  if (!customerId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const requests = await gdprDataRequestRepo.findByCustomerId(customerId);
  res.json({ success: true, data: requests.map(r => r.toJSON()) });
  
};

/**
 * Cancel a GDPR request (customer endpoint)
 */
export const cancelDataRequest: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.id || req.user?.customerId || req.user?.customerId;
  const { gdprDataRequestId } = req.params;

  const request = await gdprDataRequestRepo.findById(gdprDataRequestId);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  if (request.customerId !== customerId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  request.cancel();
  await gdprDataRequestRepo.save(request);

  res.json({ success: true, data: { status: request.status }, message: 'Request cancelled' });
  
};

// ============================================================================
// Admin Controllers
// ============================================================================

/**
 * List all GDPR requests (admin)
 */
export const listDataRequests: AsyncHandler = async (req, res, _next) => {
  const filters = {
    customerId: req.query.customerId as string | undefined,
    requestType: req.query.requestType as GdprRequestType | undefined,
    status: req.query.status as GdprRequestStatus | undefined,
    isOverdue: req.query.isOverdue === 'true',
  };

  const pagination = {
    limit: parseInt(req.query.limit as string) || 20,
    offset: parseInt(req.query.offset as string) || 0,
    orderBy: (req.query.orderBy as string) || 'createdAt',
    orderDirection: (req.query.orderDirection as 'asc' | 'desc') || 'desc',
  };

  const result = await gdprDataRequestRepo.findAll(filters, pagination);
  res.json({
    success: true,
    ...result,
    data: result.data.map(r => r.toJSON()),
  });
  
};

/**
 * Get a single GDPR request (admin)
 */
export const getDataRequest: AsyncHandler = async (req, res, _next) => {
  const request = await gdprDataRequestRepo.findById(req.params.gdprDataRequestId);
  if (!request) {
    res.status(404).json({ success: false, error: 'Request not found' });
    return;
  }
  res.json({ success: true, data: request.toJSON() });
  
};

/**
 * Get overdue requests (admin)
 */
export const getOverdueRequests: AsyncHandler = async (req, res, _next) => {
  const requests = await gdprDataRequestRepo.findOverdueRequests();
  res.json({ success: true, data: requests.map(r => r.toJSON()), total: requests.length });
  
};

/**
 * Get GDPR statistics (admin)
 */
export const getGdprStatistics: AsyncHandler = async (req, res, _next) => {
  const [byStatus, byType, avgProcessingTime] = await Promise.all([
    gdprDataRequestRepo.countByStatus(),
    gdprDataRequestRepo.countByType(),
    gdprDataRequestRepo.getAverageProcessingTime(),
  ]);

  res.json({
    success: true,
    data: {
      totalRequests: Object.values(byStatus).reduce((a, b) => a + b, 0),
      pendingRequests: byStatus.pending || 0,
      byStatus,
      byType,
      averageProcessingTimeDays: avgProcessingTime,
    },
  });
  
};

/**
 * Verify identity for a request (admin)
 */
export const verifyIdentity: AsyncHandler = async (req, res, _next) => {
  const gdprService = createGdprService();

  const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
  const command = new VerifyIdentityCommand(req.params.gdprDataRequestId, (req.body as VerifyIdentityBody).verificationMethod);

  const result = await useCase.verifyIdentity(command);
  res.json({ success: true, data: { isVerified: true, ...result } });
  
};

/**
 * Process an export request (admin)
 */
export const processExportRequest: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.id || "";
  const gdprService = createGdprService();

  const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
  const command = new ProcessExportRequestCommand(req.params.gdprDataRequestId, adminId || '', (req.body as ProcessExportBody).format || 'json');

  const result = await useCase.processExport(command);
  res.json({ success: true, data: result });
  
};

/**
 * Process a deletion request (admin)
 */
export const processDeletionRequest: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.id || "";
  const gdprService = createGdprService();

  const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
  const command = new ProcessDeletionRequestCommand(req.params.gdprDataRequestId, adminId || '', (req.body as ProcessDeletionBody).notes);

  const result = await useCase.processDeletion(command);
  res.json({ success: true, data: result });
  
};

/**
 * Reject a request (admin)
 */
export const rejectRequest: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.id || "";
  const gdprService = createGdprService();

  const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
  const command = new RejectRequestCommand(req.params.gdprDataRequestId, adminId || '', (req.body as RejectRequestBody).reason);

  const result = await useCase.reject(command);
  res.json({ success: true, data: result });
  
};

// ============================================================================
// Cookie Consent Controllers
// ============================================================================

/**
 * Record cookie consent (public)
 */
export const recordCookieConsent: AsyncHandler = async (req, res, _next) => {
  const body = req.body as RecordCookieConsentBody;
  const command = new RecordCookieConsentCommand(
    body.sessionId || req.sessionID,
    body.preferences,
    req.user?.customerId,
    body.browserFingerprint,
    req.ip,
    req.get('User-Agent'),
    body.country,
    body.region,
    body.consentBannerVersion,
    body.consentMethod,
  );

  const result = await manageCookieConsentUseCase.recordConsent(command);
  res.status(200).json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  
};

/**
 * Get current cookie consent (public)
 */
export const getCookieConsent: AsyncHandler = async (req, res, _next) => {
  const sessionId = (req.query.sessionId as string) || req.sessionID;
  const result = await manageCookieConsentUseCase.getConsent(sessionId);

  if (!result) {
    res.status(404).json({ success: false, error: 'No consent found' });
    return;
  }
  res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  
};

/**
 * Accept all cookies (public)
 */
export const acceptAllCookies: AsyncHandler = async (req, res, _next) => {
  const body = req.body as AcceptRejectCookieBody;
  const sessionId = body.sessionId || req.sessionID;
  const result = await manageCookieConsentUseCase.acceptAll(sessionId);
  res.json({
    success: true,
    data: {
      cookieConsentId: result.gdprCookieConsentId,
      necessaryCookies: true,
      analyticsCookies: true,
      marketingCookies: true,
      preferenceCookies: true,
    },
  });
  
};

/**
 * Reject all optional cookies (public)
 */
export const rejectAllCookies: AsyncHandler = async (req, res, _next) => {
  const body = req.body as AcceptRejectCookieBody;
  const sessionId = body.sessionId || req.sessionID;
  const result = await manageCookieConsentUseCase.rejectAll(sessionId);
  res.json({
    success: true,
    data: {
      cookieConsentId: result.gdprCookieConsentId,
      necessaryCookies: true,
      analyticsCookies: false,
      marketingCookies: false,
      preferenceCookies: false,
    },
  });
  
};

/**
 * Update cookie preferences (public)
 */
export const updateCookieConsent: AsyncHandler = async (req, res, _next) => {
  const body = req.body as UpdateCookieConsentBody;
  const command = new UpdateCookieConsentCommand(req.params.cookieConsentId, body.preferences);

  const result = await manageCookieConsentUseCase.updateConsent(command);
  res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  
};

/**
 * Get cookie consent statistics (admin)
 */
export const getCookieConsentStatistics: AsyncHandler = async (req, res, _next) => {
  const [stats, byCountry] = await Promise.all([
    gdprCookieConsentRepo.getConsentStatistics(),
    gdprCookieConsentRepo.getConsentByCountry(),
  ]);

  res.json({ success: true, data: { totalConsents: stats.total, ...stats, byCountry } });
  
};
