/**
 * Admin GDPR Repository
 * Handles legacy GDPR queries for the admin hub that use the older gdprRequest table
 * with customer email/name columns and consent stats from the customer table
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';

// ============================================================================
// Types
// ============================================================================

export interface AdminGdprRequest {
  requestId: string;
  customerId?: string;
  requestType: string;
  status: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface GdprStats {
  pendingRequests: number;
  completedRequests: number;
  avgProcessingDays: number;
}

export interface ConsentStats {
  marketingConsent: number;
  marketingConsentRate: number;
  analyticsConsent: number;
  analyticsConsentRate: number;
}

// ============================================================================
// Functions
// ============================================================================

export async function getGdprStats(): Promise<GdprStats> {
  const result = await queryOne<{ pendingRequests: string; completedRequests: string; avgProcessingDays: string }>(
    `SELECT
      COUNT(CASE WHEN "status" = 'pending' THEN 1 END) as "pendingRequests",
      COUNT(CASE WHEN "status" = 'completed' AND "updatedAt" >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "completedRequests",
      AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) as "avgProcessingDays"
     FROM "gdprRequest"`,
  );

  return {
    pendingRequests: parseInt(result?.pendingRequests || '0'),
    completedRequests: parseInt(result?.completedRequests || '0'),
    avgProcessingDays: Math.round(parseFloat(result?.avgProcessingDays || '0')),
  };
}

export async function getConsentStats(): Promise<ConsentStats> {
  const result = await queryOne<{ marketingConsent: string; marketingConsentRate: string; analyticsConsent: string; analyticsConsentRate: string }>(
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

export async function findRecentRequests(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
       FROM "gdprRequest" gr
       LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
       WHERE gr."deletedAt" IS NULL
       ORDER BY gr."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

export async function findRequestById(requestId: string): Promise<unknown | null> {
  return queryOne<unknown>(
    `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
     FROM "gdprRequest" gr
     LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
     WHERE gr."requestId" = $1 AND gr."deletedAt" IS NULL`,
    [requestId],
  );
}

export async function findCustomerIdByEmail(email: string): Promise<string | null> {
  const result = await queryOne<{ customerId: string }>(
    `SELECT "customerId" FROM "customer" WHERE "email" = $1 AND "deletedAt" IS NULL`,
    [email],
  );
  return result?.customerId || null;
}

export async function createRequest(params: {
  customerId?: string | null;
  requestType: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  dueDate: Date;
}): Promise<void> {
  await query(
    `INSERT INTO "gdprRequest" ("requestId", "customerId", "requestType", "status", "description", "customerEmail", "customerName", "dueDate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      generateUUID(),
      params.customerId || null,
      params.requestType,
      'pending',
      params.description || null,
      params.customerEmail,
      params.customerName || null,
      params.dueDate,
    ],
  );
}

export async function updateStatus(requestId: string, status: string): Promise<void> {
  await query(`UPDATE "gdprRequest" SET "status" = $1, "updatedAt" = NOW() WHERE "requestId" = $2`, [status, requestId]);
}

export async function completeRequest(requestId: string, notes?: string): Promise<void> {
  await query(`UPDATE "gdprRequest" SET "status" = 'completed', "notes" = $1, "updatedAt" = NOW() WHERE "requestId" = $2`, [
    notes,
    requestId,
  ]);
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
