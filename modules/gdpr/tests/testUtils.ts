/**
 * Shared test utilities for gdpr unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus, uuid) before the use cases under test are evaluated.
 * Tests use real domain objects — only the ports are mocked.
 */

import { GdprDataRequest, GdprDataRequestProps, GdprRequestStatus, GdprRequestType } from '../domain/entities/GdprDataRequest';
import { GdprCookieConsent, GdprCookieConsentProps } from '../domain/entities/GdprCookieConsent';
import { eventBus } from '../../../libs/events/eventBus';
import type {
  GdprDataRequestRepository,
  GdprCookieConsentRepository,
  GdprService,
  AdminGdprRepository,
} from '../domain/repositories/GdprRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

export function createDataRequest(overrides: Partial<GdprDataRequestProps> = {}): GdprDataRequest {
  return GdprDataRequest.reconstitute({
    gdprDataRequestId: 'req-1',
    customerId: 'customer-1',
    requestType: 'access',
    status: 'pending',
    identityVerified: false,
    deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    extensionRequested: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

export function createConsent(overrides: Partial<GdprCookieConsentProps> = {}): GdprCookieConsent {
  return GdprCookieConsent.reconstitute({
    gdprCookieConsentId: 'consent-1',
    sessionId: 'sess-1',
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    thirdParty: false,
    consentMethod: 'banner',
    consentedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

export function createGdprDataRequestRepository(
  request: GdprDataRequest | null = createDataRequest(),
): jest.Mocked<GdprDataRequestRepository> {
  const repository: jest.Mocked<GdprDataRequestRepository> = {
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findPendingRequests: jest.fn(),
    findOverdueRequests: jest.fn(),
    findByStatus: jest.fn(),
    countByStatus: jest.fn(),
    countByType: jest.fn(),
    getAverageProcessingTime: jest.fn(),
  };
  repository.findById.mockResolvedValue(request);
  repository.findByCustomerId.mockResolvedValue([]);
  repository.findAll.mockResolvedValue({ data: request ? [request] : [], total: request ? 1 : 0, limit: 50, offset: 0, hasMore: false, length: request ? 1 : 0 });
  repository.save.mockImplementation(r => Promise.resolve(r));
  repository.delete.mockResolvedValue(undefined);
  repository.findPendingRequests.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.findOverdueRequests.mockResolvedValue([]);
  repository.findByStatus.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.countByStatus.mockResolvedValue({} as Record<GdprRequestStatus, number> | Promise<Record<GdprRequestStatus, number>>);
  repository.countByType.mockResolvedValue({} as Record<GdprRequestType, number> | Promise<Record<GdprRequestType, number>>);
  repository.getAverageProcessingTime.mockResolvedValue(0);
  return repository;
}

export function createConsentRepository(consent: GdprCookieConsent | null = null): jest.Mocked<GdprCookieConsentRepository> {
  const repository: jest.Mocked<GdprCookieConsentRepository> = {
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    findBySessionId: jest.fn(),
    findByBrowserFingerprint: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findExpiredConsents: jest.fn(),
    findByCountry: jest.fn(),
    getConsentStatistics: jest.fn(),
    getConsentByCountry: jest.fn(),
  };
  repository.findById.mockResolvedValue(consent);
  repository.findByCustomerId.mockResolvedValue(null);
  repository.findBySessionId.mockResolvedValue(consent);
  repository.findByBrowserFingerprint.mockResolvedValue(null);
  repository.save.mockImplementation(c => Promise.resolve(c));
  repository.delete.mockResolvedValue(undefined);
  repository.findExpiredConsents.mockResolvedValue([]);
  repository.findByCountry.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.getConsentStatistics.mockResolvedValue({
    total: 0,
    functional: 0,
    analytics: 0,
    marketing: 0,
    thirdParty: 0,
    acceptAll: 0,
    rejectAll: 0,
  });
  repository.getConsentByCountry.mockResolvedValue([]);
  return repository;
}

export function createGdprService(): jest.Mocked<GdprService> {
  return {
    dataRequests: createGdprDataRequestRepository(),
    cookieConsents: createConsentRepository(),
    exportCustomerData: jest.fn().mockResolvedValue({
      customer: {},
      orders: [],
      addresses: [],
      consents: [],
      activities: [],
    }),
    anonymizeCustomerData: jest.fn().mockResolvedValue(undefined),
    deleteCustomerData: jest.fn().mockResolvedValue(undefined),
  };
}

export function createAdminGdprRepository(): jest.Mocked<AdminGdprRepository> {
  const repository: jest.Mocked<AdminGdprRepository> = {
    getGdprStats: jest.fn(),
    getConsentStats: jest.fn(),
    findRecentRequests: jest.fn(),
    findRequestById: jest.fn(),
    findCustomerIdByEmail: jest.fn(),
    createRequest: jest.fn(),
    updateStatus: jest.fn(),
    completeRequest: jest.fn(),
  };
  repository.getGdprStats.mockResolvedValue({ pendingRequests: 10, completedRequests: 5, avgProcessingDays: 3 });
  repository.getConsentStats.mockResolvedValue({
    marketingConsent: 50,
    marketingConsentRate: 0.5,
    analyticsConsent: 60,
    analyticsConsentRate: 0.6,
  });
  repository.findRecentRequests.mockResolvedValue([{ requestId: 'r1' }]);
  repository.findRequestById.mockResolvedValue({ requestId: 'r1' });
  repository.findCustomerIdByEmail.mockResolvedValue('customer-1');
  repository.createRequest.mockResolvedValue(undefined);
  repository.updateStatus.mockResolvedValue(undefined);
  repository.completeRequest.mockResolvedValue(undefined);
  return repository;
}
