/**
 * Admin GDPR Repository
 * GDPR data request queries for the admin hub plus consent stats from the customer table
 */

import { query, queryOne } from '../../../../libs/db';
import type { GdprDataRequest as DbGdprDataRequest } from '../../../../libs/db/types';

type GdprRequestWithCustomerRow = DbGdprDataRequest & {
  customerName: string | null;
  customerEmail: string | null;
};
import { generateUUID } from '../../../../libs/uuid';
import { CustomerIdRequiredError } from '../../domain/errors/GdprErrors';

// ============================================================================
// Types
// ============================================================================

interface GdprStats {
  pendingRequests: number;
  completedRequests: number;
  avgProcessingDays: number;
}

interface ConsentStats {
  marketingConsent: number;
  marketingConsentRate: number;
  analyticsConsent: number;
  analyticsConsentRate: number;
}

// ============================================================================
// Functions
// ============================================================================

async function getGdprStats(): Promise<GdprStats> {
  const result = await queryOne<{ pendingRequests: string; completedRequests: string; avgProcessingDays: string }>(
    `SELECT
      COUNT(CASE WHEN "status" = 'pending' THEN 1 END) as "pendingRequests",
      COUNT(CASE WHEN "status" = 'completed' AND "updatedAt" >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "completedRequests",
      AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) as "avgProcessingDays"
     FROM "gdprDataRequest"`,
  );

  return {
    pendingRequests: parseInt(result?.pendingRequests || '0'),
    completedRequests: parseInt(result?.completedRequests || '0'),
    avgProcessingDays: Math.round(parseFloat(result?.avgProcessingDays || '0')),
  };
}

async function getConsentStats(): Promise<ConsentStats> {
  const result = await queryOne<{
    marketingConsent: string;
    marketingConsentRate: string;
    analyticsConsent: string;
    analyticsConsentRate: string;
  }>(
    `SELECT
      COUNT(CASE WHEN "acceptsMarketing" = true THEN 1 END) as "marketingConsent",
      ROUND(100.0 * COUNT(CASE WHEN "acceptsMarketing" = true THEN 1 END) / COUNT(*), 1) as "marketingConsentRate",
      COUNT(CASE WHEN "acceptsAnalytics" = true THEN 1 END) as "analyticsConsent",
      ROUND(100.0 * COUNT(CASE WHEN "acceptsAnalytics" = true THEN 1 END) / COUNT(*), 1) as "analyticsConsentRate"
     FROM "customer"`,
  );

  return {
    marketingConsent: parseInt(result?.marketingConsent || '0'),
    marketingConsentRate: parseFloat(result?.marketingConsentRate || '0'),
    analyticsConsent: parseInt(result?.analyticsConsent || '0'),
    analyticsConsentRate: parseFloat(result?.analyticsConsentRate || '0'),
  };
}

async function findRecentRequests(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<GdprRequestWithCustomerRow[]>(
      `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
       FROM "gdprDataRequest" gr
       LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
       ORDER BY gr."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

async function findRequestById(requestId: string): Promise<unknown | null> {
  return queryOne<GdprRequestWithCustomerRow>(
    `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
     FROM "gdprDataRequest" gr
     LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
     WHERE gr."gdprDataRequestId" = $1`,
    [requestId],
  );
}

async function findCustomerIdByEmail(email: string): Promise<string | null> {
  const result = await queryOne<{ customerId: string }>(`SELECT "customerId" FROM "customer" WHERE "email" = $1 AND "deletedAt" IS NULL`, [
    email,
  ]);
  return result?.customerId || null;
}

async function createRequest(params: {
  customerId?: string | null;
  requestType: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  dueDate: Date;
}): Promise<void> {
  if (!params.customerId) {
    throw new CustomerIdRequiredError();
  }
  await query(
    `INSERT INTO "gdprDataRequest" ("gdprDataRequestId", "customerId", "requestType", "status", "reason", "deadlineAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [generateUUID(), params.customerId, params.requestType, 'pending', params.description || null, params.dueDate],
  );
}

async function updateStatus(requestId: string, status: string): Promise<void> {
  await query(`UPDATE "gdprDataRequest" SET "status" = $1, "updatedAt" = NOW() WHERE "gdprDataRequestId" = $2`, [status, requestId]);
}

async function completeRequest(requestId: string, notes?: string): Promise<void> {
  await query(
    `UPDATE "gdprDataRequest" SET "status" = 'completed', "adminNotes" = $1, "updatedAt" = NOW() WHERE "gdprDataRequestId" = $2`,
    [notes, requestId],
  );
}

export default {
  getGdprStats,
  getConsentStats,
  findRecentRequests,
  findRequestById,
  findCustomerIdByEmail,
  createRequest,
  updateStatus,
  completeRequest,
};
