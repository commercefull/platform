/**
 * GDPR Repository Implementation
 * PostgreSQL implementation of GDPR data persistence
 */

import { query, queryOne } from '../../../../libs/db';
import { GdprDataRequest as GdprDataRequestDb, GdprCookieConsent as GdprCookieConsentDb } from '../../../../libs/db/types';
import {
  GdprDataRequestRepository,
  GdprCookieConsentRepository,
  GdprService,
  GdprRequestFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/GdprRepository';
import { GdprDataRequest, GdprRequestType, GdprRequestStatus } from '../../domain/entities/GdprDataRequest';
import { GdprCookieConsent, CookiePreferences } from '../../domain/entities/GdprCookieConsent';

// Table names
const GDPR_DATA_REQUEST_TABLE = 'gdprDataRequest';
const GDPR_COOKIE_CONSENT_TABLE = 'gdprCookieConsent';

// ============================================================================
// GDPR Data Request Repository Implementation
// ============================================================================

export class GdprDataRequestRepo implements GdprDataRequestRepository {
  async findById(gdprDataRequestId: string): Promise<GdprDataRequest | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "gdprDataRequest" WHERE "gdprDataRequestId" = $1', [gdprDataRequestId]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<GdprDataRequest[]> {
    const rows = await query<Record<string, any>[]>('SELECT * FROM "gdprDataRequest" WHERE "customerId" = $1 ORDER BY "createdAt" DESC', [
      customerId,
    ]);
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findAll(filters?: GdprRequestFilters, pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.customerId) {
      conditions.push(`"customerId" = $${paramIndex++}`);
      params.push(filters.customerId);
    }
    if (filters?.requestType) {
      conditions.push(`"requestType" = $${paramIndex++}`);
      params.push(filters.requestType);
    }
    if (filters?.status) {
      conditions.push(`"status" = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.isOverdue) {
      conditions.push(`"deadlineAt" < NOW() AND "status" IN ('pending', 'processing')`);
    }
    if (filters?.createdAfter) {
      conditions.push(`"createdAt" >= $${paramIndex++}`);
      params.push(filters.createdAfter.toISOString());
    }
    if (filters?.createdBefore) {
      conditions.push(`"createdAt" <= $${paramIndex++}`);
      params.push(filters.createdBefore.toISOString());
    }
    if (filters?.processedBy) {
      conditions.push(`"processedBy" = $${paramIndex++}`);
      params.push(filters.processedBy);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "gdprDataRequest" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "gdprDataRequest" ${whereClause} 
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset],
    );

    return {
      data: (rows || []).map(row => this.mapToEntity(row)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async save(request: GdprDataRequest): Promise<GdprDataRequest> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "gdprDataRequestId" FROM "gdprDataRequest" WHERE "gdprDataRequestId" = $1',
      [request.gdprDataRequestId],
    );

    if (existing) {
      await query(
        `UPDATE "gdprDataRequest" SET
          "status" = $1, "reason" = $2, "requestedData" = $3,
          "downloadUrl" = $4, "downloadExpiresAt" = $5, "downloadFormat" = $6,
          "processedAt" = $7, "processedBy" = $8, "adminNotes" = $9, "rejectionReason" = $10,
          "identityVerified" = $11, "verificationMethod" = $12, "verifiedAt" = $13,
          "deadlineAt" = $14, "extensionRequested" = $15, "extensionReason" = $16, "extendedDeadlineAt" = $17,
          "updatedAt" = $18
        WHERE "gdprDataRequestId" = $19`,
        [
          request.status,
          request.reason,
          JSON.stringify(request.requestedData),
          request.downloadUrl,
          request.downloadExpiresAt?.toISOString(),
          request.downloadFormat,
          request.processedAt?.toISOString(),
          request.processedBy,
          request.adminNotes,
          request.rejectionReason,
          request.identityVerified,
          request.verificationMethod,
          request.verifiedAt?.toISOString(),
          request.deadlineAt.toISOString(),
          request.extensionRequested,
          request.extensionReason,
          request.extendedDeadlineAt?.toISOString(),
          now,
          request.gdprDataRequestId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "gdprDataRequest" (
          "gdprDataRequestId", "customerId", "requestType", "status", "reason", "requestedData",
          "identityVerified", "deadlineAt", "extensionRequested",
          "ipAddress", "userAgent", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          request.gdprDataRequestId,
          request.customerId,
          request.requestType,
          request.status,
          request.reason,
          JSON.stringify(request.requestedData),
          request.identityVerified,
          request.deadlineAt.toISOString(),
          request.extensionRequested,
          request.ipAddress,
          request.userAgent,
          now,
          now,
        ],
      );
    }

    return request;
  }

  async delete(gdprDataRequestId: string): Promise<void> {
    await query('DELETE FROM "gdprDataRequest" WHERE "gdprDataRequestId" = $1', [gdprDataRequestId]);
  }

  async findPendingRequests(pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>> {
    return this.findAll({ status: 'pending' }, pagination);
  }

  async findOverdueRequests(): Promise<GdprDataRequest[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "gdprDataRequest" 
       WHERE ("deadlineAt" < NOW() OR ("extendedDeadlineAt" IS NOT NULL AND "extendedDeadlineAt" < NOW()))
       AND "status" IN ('pending', 'processing')
       ORDER BY "deadlineAt" ASC`,
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findByStatus(status: GdprRequestStatus, pagination?: PaginationOptions): Promise<PaginatedResult<GdprDataRequest>> {
    return this.findAll({ status }, pagination);
  }

  async countByStatus(): Promise<Record<GdprRequestStatus, number>> {
    const rows = await query<Array<{ status: GdprRequestStatus; count: string }>>(
      `SELECT "status", COUNT(*) as count FROM "gdprDataRequest" GROUP BY "status"`,
    );

    const result: Record<GdprRequestStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      failed: 0,
    };

    for (const row of rows || []) {
      result[row.status] = parseInt(row.count, 10);
    }
    return result;
  }

  async countByType(): Promise<Record<GdprRequestType, number>> {
    const rows = await query<Array<{ requestType: GdprRequestType; count: string }>>(
      `SELECT "requestType", COUNT(*) as count FROM "gdprDataRequest" GROUP BY "requestType"`,
    );

    const result: Record<GdprRequestType, number> = {
      export: 0,
      deletion: 0,
      rectification: 0,
      restriction: 0,
      access: 0,
      objection: 0,
    };

    for (const row of rows || []) {
      result[row.requestType] = parseInt(row.count, 10);
    }
    return result;
  }

  async getAverageProcessingTime(): Promise<number> {
    const result = await queryOne<{ avg: string }>(
      `SELECT AVG(EXTRACT(EPOCH FROM ("processedAt" - "createdAt")) / 86400) as avg 
       FROM "gdprDataRequest" 
       WHERE "processedAt" IS NOT NULL`,
    );
    return parseFloat(result?.avg || '0');
  }

  private mapToEntity(row: Record<string, any>): GdprDataRequest {
    return GdprDataRequest.reconstitute({
      gdprDataRequestId: row.gdprDataRequestId,
      customerId: row.customerId,
      requestType: row.requestType,
      status: row.status,
      reason: row.reason,
      requestedData: row.requestedData,
      downloadUrl: row.downloadUrl,
      downloadExpiresAt: row.downloadExpiresAt ? new Date(row.downloadExpiresAt) : undefined,
      downloadFormat: row.downloadFormat,
      processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
      processedBy: row.processedBy,
      adminNotes: row.adminNotes,
      rejectionReason: row.rejectionReason,
      identityVerified: Boolean(row.identityVerified),
      verificationMethod: row.verificationMethod,
      verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : undefined,
      deadlineAt: new Date(row.deadlineAt),
      extensionRequested: Boolean(row.extensionRequested),
      extensionReason: row.extensionReason,
      extendedDeadlineAt: row.extendedDeadlineAt ? new Date(row.extendedDeadlineAt) : undefined,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

// ============================================================================
// GDPR Cookie Consent Repository Implementation
// ============================================================================

export class GdprCookieConsentRepo implements GdprCookieConsentRepository {
  async findById(gdprCookieConsentId: string): Promise<GdprCookieConsent | null> {
    const row = await queryOne<GdprCookieConsentDb>(`SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "gdprCookieConsentId" = $1`, [
      gdprCookieConsentId,
    ]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<GdprCookieConsent | null> {
    const row = await queryOne<GdprCookieConsentDb>(
      `SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "customerId" = $1 ORDER BY "consentedAt" DESC LIMIT 1`,
      [customerId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<GdprCookieConsent | null> {
    const row = await queryOne<GdprCookieConsentDb>(
      `SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "sessionId" = $1 ORDER BY "consentedAt" DESC LIMIT 1`,
      [sessionId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findByBrowserFingerprint(fingerprint: string): Promise<GdprCookieConsent | null> {
    const row = await queryOne<GdprCookieConsentDb>(
      `SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "browserFingerprint" = $1 ORDER BY "consentedAt" DESC LIMIT 1`,
      [fingerprint],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async save(consent: GdprCookieConsent): Promise<GdprCookieConsent> {
    const now = new Date().toISOString();

    const existing = await queryOne<{ gdprCookieConsentId: string }>(
      `SELECT "gdprCookieConsentId" FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "gdprCookieConsentId" = $1`,
      [consent.gdprCookieConsentId],
    );

    if (existing) {
      await query(
        `UPDATE "${GDPR_COOKIE_CONSENT_TABLE}" SET
          "customerId" = $1, "necessary" = $2, "functional" = $3, "analytics" = $4,
          "marketing" = $5, "thirdParty" = $6, "consentedAt" = $7, "expiresAt" = $8,
          "linkedAt" = $9, "updatedAt" = $10
        WHERE "gdprCookieConsentId" = $11`,
        [
          consent.customerId,
          consent.necessary,
          consent.functional,
          consent.analytics,
          consent.marketing,
          consent.thirdParty,
          consent.consentedAt.toISOString(),
          consent.expiresAt?.toISOString(),
          consent.linkedAt?.toISOString(),
          now,
          consent.gdprCookieConsentId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "${GDPR_COOKIE_CONSENT_TABLE}" (
          "gdprCookieConsentId", "customerId", "sessionId", "browserFingerprint",
          "necessary", "functional", "analytics", "marketing", "thirdParty",
          "ipAddress", "userAgent", "country", "region",
          "consentBannerVersion", "consentMethod", "consentedAt", "expiresAt",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          consent.gdprCookieConsentId,
          consent.customerId,
          consent.sessionId,
          consent.browserFingerprint,
          consent.necessary,
          consent.functional,
          consent.analytics,
          consent.marketing,
          consent.thirdParty,
          consent.ipAddress,
          consent.userAgent,
          consent.country,
          consent.region,
          consent.consentBannerVersion,
          consent.consentMethod,
          consent.consentedAt.toISOString(),
          consent.expiresAt?.toISOString(),
          now,
          now,
        ],
      );
    }

    return consent;
  }

  async delete(gdprCookieConsentId: string): Promise<void> {
    await query(`DELETE FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "gdprCookieConsentId" = $1`, [gdprCookieConsentId]);
  }

  async findExpiredConsents(): Promise<GdprCookieConsent[]> {
    const rows = await query<GdprCookieConsentDb[]>(`SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "expiresAt" < NOW()`);
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findByCountry(country: string, pagination?: PaginationOptions): Promise<PaginatedResult<GdprCookieConsent>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "country" = $1`,
      [country],
    );
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<GdprCookieConsentDb[]>(
      `SELECT * FROM "${GDPR_COOKIE_CONSENT_TABLE}" WHERE "country" = $1 
       ORDER BY "consentedAt" DESC LIMIT $2 OFFSET $3`,
      [country, limit, offset],
    );

    return {
      data: (rows || []).map(row => this.mapToEntity(row)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async getConsentStatistics(): Promise<{
    total: number;
    functional: number;
    analytics: number;
    marketing: number;
    thirdParty: number;
    acceptAll: number;
    rejectAll: number;
  }> {
    const result = await queryOne<Record<string, string>>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "functional" = true) as functional,
        COUNT(*) FILTER (WHERE "analytics" = true) as analytics,
        COUNT(*) FILTER (WHERE "marketing" = true) as marketing,
        COUNT(*) FILTER (WHERE "thirdParty" = true) as "thirdParty",
        COUNT(*) FILTER (WHERE "functional" = true AND "analytics" = true AND "marketing" = true AND "thirdParty" = true) as "acceptAll",
        COUNT(*) FILTER (WHERE "functional" = false AND "analytics" = false AND "marketing" = false AND "thirdParty" = false) as "rejectAll"
      FROM "${GDPR_COOKIE_CONSENT_TABLE}"
    `);

    return {
      total: parseInt(result?.total || '0', 10),
      functional: parseInt(result?.functional || '0', 10),
      analytics: parseInt(result?.analytics || '0', 10),
      marketing: parseInt(result?.marketing || '0', 10),
      thirdParty: parseInt(result?.thirdParty || '0', 10),
      acceptAll: parseInt(result?.acceptAll || '0', 10),
      rejectAll: parseInt(result?.rejectAll || '0', 10),
    };
  }

  async getConsentByCountry(): Promise<Array<{ country: string; total: number; acceptRate: number }>> {
    const rows = await query<Array<{ country: string; total: string; acceptAll: string }>>(`
      SELECT 
        "country",
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "functional" = true AND "analytics" = true AND "marketing" = true AND "thirdParty" = true) as "acceptAll"
      FROM "${GDPR_COOKIE_CONSENT_TABLE}"
      WHERE "country" IS NOT NULL
      GROUP BY "country"
      ORDER BY total DESC
    `);

    return (rows || []).map(row => ({
      country: row.country,
      total: parseInt(row.total, 10),
      acceptRate: parseInt(row.total, 10) > 0 ? parseInt(row.acceptAll, 10) / parseInt(row.total, 10) : 0,
    }));
  }

  private mapToEntity(row: GdprCookieConsentDb): GdprCookieConsent {
    return GdprCookieConsent.reconstitute({
      gdprCookieConsentId: row.gdprCookieConsentId,
      customerId: row.customerId ?? undefined,
      sessionId: row.sessionId ?? undefined,
      browserFingerprint: row.browserFingerprint ?? undefined,
      necessary: Boolean(row.necessary),
      functional: Boolean(row.functional),
      analytics: Boolean(row.analytics),
      marketing: Boolean(row.marketing),
      thirdParty: Boolean(row.thirdParty),
      ipAddress: row.ipAddress ?? undefined,
      userAgent: row.userAgent ?? undefined,
      country: row.country ?? undefined,
      region: row.region ?? undefined,
      consentBannerVersion: row.consentBannerVersion ?? undefined,
      consentMethod: (row.consentMethod as 'banner' | 'settings' | 'api') || 'banner',
      consentedAt: new Date(row.consentedAt),
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      linkedAt: row.linkedAt ? new Date(row.linkedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}
