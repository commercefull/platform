/**
 * GDPR Repository Interface
 * Defines the contract for GDPR-related persistence operations
 */

import { GdprDataRequest, GdprRequestType, GdprRequestStatus } from '../entities/GdprDataRequest';
import { GdprCookieConsent } from '../entities/GdprCookieConsent';
import { PaginatedResult, PaginationOptions } from 'libs/types/pagination';

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

// ============================================================================
// Customer Data Export
// ============================================================================

export interface CustomerExportRow {
  customerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderExportRow {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmountCents: number;
  currencyCode: string;
  createdAt: Date;
}

export interface AddressExportRow {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  addressType: 'billing' | 'shipping' | 'both';
}

export interface ConsentExportRow {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  consentedAt: Date;
}

export interface ActivityExportRow {
  eventType: string;
  createdAt: Date;
}

export interface CustomerDataExport {
  customer: CustomerExportRow | { customerId: string };
  orders: OrderExportRow[];
  addresses: AddressExportRow[];
  consents: ConsentExportRow[];
  activities: ActivityExportRow[];
}

export interface GdprService {
  // Data Request operations
  dataRequests: GdprDataRequestRepository;

  // Cookie Consent operations
  cookieConsents: GdprCookieConsentRepository;

  // Data export helpers
  exportCustomerData(customerId: string): Promise<CustomerDataExport>;

  // Data deletion helpers
  anonymizeCustomerData(customerId: string): Promise<void>;
  deleteCustomerData(customerId: string): Promise<void>;
}

// ============================================================================
// Admin GDPR Repository
// ============================================================================

interface AdminGdprStats {
  pendingRequests: number;
  completedRequests: number;
  avgProcessingDays: number;
}

interface AdminConsentStats {
  marketingConsent: number;
  marketingConsentRate: number;
  analyticsConsent: number;
  analyticsConsentRate: number;
}

export interface AdminGdprCreateRequestParams {
  customerId?: string | null;
  requestType: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  dueDate: Date;
}

export interface AdminGdprRepository {
  getGdprStats(): Promise<AdminGdprStats>;
  getConsentStats(): Promise<AdminConsentStats>;
  findRecentRequests(limit?: number): Promise<unknown[]>;
  findRequestById(requestId: string): Promise<unknown | null>;
  findCustomerIdByEmail(email: string): Promise<string | null>;
  createRequest(params: AdminGdprCreateRequestParams): Promise<void>;
  updateStatus(requestId: string, status: string): Promise<void>;
  completeRequest(requestId: string, notes?: string): Promise<void>;
}
