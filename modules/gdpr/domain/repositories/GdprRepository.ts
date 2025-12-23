/**
 * GDPR Repository Interface
 * Defines the contract for GDPR-related persistence operations
 */

import { GdprDataRequest, GdprRequestType, GdprRequestStatus } from '../entities/GdprDataRequest';
import { GdprCookieConsent, CookiePreferences } from '../entities/GdprCookieConsent';

// ============================================================================
// Filters and Pagination
// ============================================================================

export interface GdprRequestFilters {
  customerId?: string;
  requestType?: GdprRequestType;
  status?: GdprRequestStatus;
  isOverdue?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  processedBy?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// GDPR Data Request Repository
// ============================================================================

export interface GdprDataRequestRepository {
  // CRUD
  findById(gdprDataRequestId: string): Promise<GdprDataRequest | null>;
  findByCustomerId(customerId: string): Promise<GdprDataRequest[]>;
  findAll(filters?: GdprRequestFilters, pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>>;
  save(request: GdprDataRequest): Promise<GdprDataRequest>;
  delete(gdprDataRequestId: string): Promise<void>;

  // Queries
  findPendingRequests(pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>>;
  findOverdueRequests(): Promise<GdprDataRequest[]>;
  findByStatus(status: GdprRequestStatus, pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>>;

  // Statistics
  countByStatus(): Promise<Record<GdprRequestStatus, number>>;
  countByType(): Promise<Record<GdprRequestType, number>>;
  getAverageProcessingTime(): Promise<number>; // in days
}

// ============================================================================
// GDPR Cookie Consent Repository
// ============================================================================

export interface GdprCookieConsentRepository {
  // CRUD
  findById(gdprCookieConsentId: string): Promise<GdprCookieConsent | null>;
  findByCustomerId(customerId: string): Promise<GdprCookieConsent | null>;
  findBySessionId(sessionId: string): Promise<GdprCookieConsent | null>;
  findByBrowserFingerprint(fingerprint: string): Promise<GdprCookieConsent | null>;
  save(consent: GdprCookieConsent): Promise<GdprCookieConsent>;
  delete(gdprCookieConsentId: string): Promise<void>;

  // Queries
  findExpiredConsents(): Promise<GdprCookieConsent[]>;
  findByCountry(country: string, pagination?: PaginationOptions): Promise<PaginatedResult<GdprCookieConsent>>;

  // Statistics
  getConsentStatistics(): Promise<{
    total: number;
    functional: number;
    analytics: number;
    marketing: number;
    thirdParty: number;
    acceptAll: number;
    rejectAll: number;
  }>;
  getConsentByCountry(): Promise<
    Array<{
      country: string;
      total: number;
      acceptRate: number;
    }>
  >;
}

// ============================================================================
// GDPR Service Interface (combines both repositories)
// ============================================================================

export interface GdprService {
  // Data Request operations
  dataRequests: GdprDataRequestRepository;

  // Cookie Consent operations
  cookieConsents: GdprCookieConsentRepository;

  // Data export helpers
  exportCustomerData(customerId: string): Promise<{
    customer: Record<string, any>;
    orders: Record<string, any>[];
    addresses: Record<string, any>[];
    consents: Record<string, any>[];
    activities: Record<string, any>[];
  }>;

  // Data deletion helpers
  anonymizeCustomerData(customerId: string): Promise<void>;
  deleteCustomerData(customerId: string): Promise<void>;
}
