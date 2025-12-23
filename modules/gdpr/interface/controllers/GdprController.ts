/**
 * GDPR Controller
 * Handles HTTP requests for GDPR-related operations
 */

import { logger } from '../../../../libs/logger';
import { Request, Response, NextFunction } from 'express';

// Type for async route handlers
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
import { GdprDataRequestRepo, GdprCookieConsentRepo } from '../../infrastructure/repositories/GdprRepository';
import { CreateDataRequestUseCase, CreateDataRequestCommand } from '../../application/useCases/CreateDataRequest';
import { ProcessDataRequestUseCase, ProcessExportRequestCommand, ProcessDeletionRequestCommand, RejectRequestCommand, VerifyIdentityCommand } from '../../application/useCases/ProcessDataRequest';
import { ManageCookieConsentUseCase, RecordCookieConsentCommand, UpdateCookieConsentCommand, LinkConsentToCustomerCommand } from '../../application/useCases/ManageCookieConsent';

// Repository instances
const gdprDataRequestRepo = new GdprDataRequestRepo();
const gdprCookieConsentRepo = new GdprCookieConsentRepo();

// Use case instances
const createDataRequestUseCase = new CreateDataRequestUseCase(gdprDataRequestRepo);
const manageCookieConsentUseCase = new ManageCookieConsentUseCase(gdprCookieConsentRepo);

// ============================================================================
// GDPR Data Request Controllers
// ============================================================================

/**
 * Create a new GDPR data request (customer endpoint)
 */
export const createDataRequest: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req.user as any)?.id || (req.user as any)?.customerId || (req as any).customerId || req.body.customerId;
    if (!customerId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Validate requestType
    const validTypes = ['access', 'export', 'deletion', 'rectification', 'objection', 'restriction'];
    if (!req.body.requestType || !validTypes.includes(req.body.requestType)) {
      res.status(400).json({ success: false, error: 'Invalid or missing requestType. Valid types: ' + validTypes.join(', ') });
      return;
    }

    const command = new CreateDataRequestCommand(
      customerId,
      req.body.requestType,
      req.body.reason || '',
      req.body.requestedData,
      req.ip,
      req.get('User-Agent')
    );

    const result = await createDataRequestUseCase.execute(command);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get customer's GDPR requests
 */
export const getMyDataRequests: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req.user as any)?.id || (req.user as any)?.customerId || (req as any).customerId;
    if (!customerId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requests = await gdprDataRequestRepo.findByCustomerId(customerId);
    res.json({ success: true, data: requests.map(r => r.toJSON()) });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancel a GDPR request (customer endpoint)
 */
export const cancelDataRequest: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req.user as any)?.id || (req.user as any)?.customerId || (req as any).customerId;
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
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

// ============================================================================
// Admin Controllers
// ============================================================================

/**
 * List all GDPR requests (admin)
 */
export const listDataRequests: AsyncHandler = async (req, res, next) => {
  try {
    const filters = {
      customerId: req.query.customerId as string,
      requestType: req.query.requestType as any,
      status: req.query.status as any,
      isOverdue: req.query.isOverdue === 'true'
    };

    const pagination = {
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
      orderBy: (req.query.orderBy as string) || 'createdAt',
      orderDirection: (req.query.orderDirection as 'asc' | 'desc') || 'desc'
    };

    const result = await gdprDataRequestRepo.findAll(filters, pagination);
    res.json({
      success: true,
      ...result,
      data: result.data.map(r => r.toJSON())
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single GDPR request (admin)
 */
export const getDataRequest: AsyncHandler = async (req, res, next) => {
  try {
    const request = await gdprDataRequestRepo.findById(req.params.gdprDataRequestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    res.json({ success: true, data: request.toJSON() });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get overdue requests (admin)
 */
export const getOverdueRequests: AsyncHandler = async (req, res, next) => {
  try {
    const requests = await gdprDataRequestRepo.findOverdueRequests();
    res.json({ success: true, data: requests.map(r => r.toJSON()), total: requests.length });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get GDPR statistics (admin)
 */
export const getGdprStatistics: AsyncHandler = async (req, res, next) => {
  try {
    const [byStatus, byType, avgProcessingTime] = await Promise.all([
      gdprDataRequestRepo.countByStatus(),
      gdprDataRequestRepo.countByType(),
      gdprDataRequestRepo.getAverageProcessingTime()
    ]);

    res.json({
      success: true,
      data: {
        totalRequests: Object.values(byStatus).reduce((a, b) => a + b, 0),
        pendingRequests: byStatus.pending || 0,
        byStatus,
        byType,
        averageProcessingTimeDays: avgProcessingTime
      }
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify identity for a request (admin)
 */
export const verifyIdentity: AsyncHandler = async (req, res, next) => {
  try {
    const gdprService = {
      dataRequests: gdprDataRequestRepo,
      cookieConsents: gdprCookieConsentRepo,
      exportCustomerData: async () => ({ customer: {}, orders: [], addresses: [], consents: [], activities: [] }),
      anonymizeCustomerData: async () => {},
      deleteCustomerData: async () => {}
    };

    const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
    const command = new VerifyIdentityCommand(
      req.params.gdprDataRequestId,
      req.body.verificationMethod
    );

    const result = await useCase.verifyIdentity(command);
    res.json({ success: true, data: { isVerified: true, ...result } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Process an export request (admin)
 */
export const processExportRequest: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    const gdprService = {
      dataRequests: gdprDataRequestRepo,
      cookieConsents: gdprCookieConsentRepo,
      exportCustomerData: async (customerId: string) => {
        // TODO: Implement actual data export
        return { customer: { customerId }, orders: [], addresses: [], consents: [], activities: [] };
      },
      anonymizeCustomerData: async () => {},
      deleteCustomerData: async () => {}
    };

    const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
    const command = new ProcessExportRequestCommand(
      req.params.gdprDataRequestId,
      adminId,
      req.body.format || 'json'
    );

    const result = await useCase.processExport(command);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Process a deletion request (admin)
 */
export const processDeletionRequest: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    const gdprService = {
      dataRequests: gdprDataRequestRepo,
      cookieConsents: gdprCookieConsentRepo,
      exportCustomerData: async () => ({ customer: {}, orders: [], addresses: [], consents: [], activities: [] }),
      anonymizeCustomerData: async (customerId: string) => {
        // TODO: Implement actual data anonymization
        
      },
      deleteCustomerData: async () => {}
    };

    const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
    const command = new ProcessDeletionRequestCommand(
      req.params.gdprDataRequestId,
      adminId,
      req.body.notes
    );

    const result = await useCase.processDeletion(command);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Reject a request (admin)
 */
export const rejectRequest: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    const gdprService = {
      dataRequests: gdprDataRequestRepo,
      cookieConsents: gdprCookieConsentRepo,
      exportCustomerData: async () => ({ customer: {}, orders: [], addresses: [], consents: [], activities: [] }),
      anonymizeCustomerData: async () => {},
      deleteCustomerData: async () => {}
    };

    const useCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, gdprService);
    const command = new RejectRequestCommand(
      req.params.gdprDataRequestId,
      adminId,
      req.body.reason
    );

    const result = await useCase.reject(command);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

// ============================================================================
// Cookie Consent Controllers
// ============================================================================

/**
 * Record cookie consent (public)
 */
export const recordCookieConsent: AsyncHandler = async (req, res, next) => {
  try {
    const command = new RecordCookieConsentCommand(
      req.body.sessionId || req.sessionID,
      req.body.preferences,
      (req as any).customerId,
      req.body.browserFingerprint,
      req.ip,
      req.get('User-Agent'),
      req.body.country,
      req.body.region,
      req.body.consentBannerVersion,
      req.body.consentMethod
    );

    const result = await manageCookieConsentUseCase.recordConsent(command);
    res.status(200).json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get current cookie consent (public)
 */
export const getCookieConsent: AsyncHandler = async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId as string || req.sessionID;
    const result = await manageCookieConsentUseCase.getConsent(sessionId);
    
    if (!result) {
      res.status(404).json({ success: false, error: 'No consent found' });
      return;
    }
    res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Accept all cookies (public)
 */
export const acceptAllCookies: AsyncHandler = async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId || req.sessionID;
    const result = await manageCookieConsentUseCase.acceptAll(sessionId);
    res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, necessaryCookies: true, analyticsCookies: true, marketingCookies: true, preferenceCookies: true } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Reject all optional cookies (public)
 */
export const rejectAllCookies: AsyncHandler = async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId || req.sessionID;
    const result = await manageCookieConsentUseCase.rejectAll(sessionId);
    res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, necessaryCookies: true, analyticsCookies: false, marketingCookies: false, preferenceCookies: false } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update cookie preferences (public)
 */
export const updateCookieConsent: AsyncHandler = async (req, res, next) => {
  try {
    const command = new UpdateCookieConsentCommand(
      req.params.cookieConsentId,
      req.body.preferences
    );

    const result = await manageCookieConsentUseCase.updateConsent(command);
    res.json({ success: true, data: { cookieConsentId: result.gdprCookieConsentId, ...result.preferences } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get cookie consent statistics (admin)
 */
export const getCookieConsentStatistics: AsyncHandler = async (req, res, next) => {
  try {
    const [stats, byCountry] = await Promise.all([
      gdprCookieConsentRepo.getConsentStatistics(),
      gdprCookieConsentRepo.getConsentByCountry()
    ]);

    res.json({ success: true, data: { totalConsents: stats.total, ...stats, byCountry } });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: error.message });
  }
};
