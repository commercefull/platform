/**
 * Admin Support Repository
 * Handles admin-specific support ticket queries that join with customer data
 * and use the legacy "ticketId" column alias
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';
import type { SupportTicket, SupportMessage } from 'libs/db/types';

export type SupportTicketWithCustomer = SupportTicket & {
  customerEmail?: string;
  customerName?: string;
};

export async function getSupportStats(): Promise<{ openTickets: number; resolvedToday: number; avgResponseTime: number }> {
  const statsResult = await queryOne<{ openTickets: string; resolvedToday: string }>(
    `SELECT
      COUNT(CASE WHEN "status" IN ('open', 'pending') THEN 1 END) as "openTickets",
      COUNT(CASE WHEN "status" = 'resolved' AND DATE("updatedAt") = CURRENT_DATE THEN 1 END) as "resolvedToday"
     FROM "supportTicket"`,
  );

  const responseTimeResult = await queryOne<{ avgResponseTime: string }>(
    `SELECT AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")) / 3600) as "avgResponseTime"
     FROM "supportTicket"
     WHERE "firstResponseAt" IS NOT NULL`,
  );

  return {
    openTickets: parseInt(statsResult?.openTickets || '0'),
    resolvedToday: parseInt(statsResult?.resolvedToday || '0'),
    avgResponseTime: Math.round(parseFloat(responseTimeResult?.avgResponseTime || '0')),
  };
}

export async function listRecentTickets(limit: number = 20): Promise<SupportTicketWithCustomer[]> {
  const rows = await query<SupportTicketWithCustomer[]>(
    `SELECT st.*, c."email" as "customerEmail",
            COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
     FROM "supportTicket" st
     LEFT JOIN "customer" c ON st."customerId" = c."customerId"
     WHERE st."deletedAt" IS NULL
     ORDER BY st."createdAt" DESC
     LIMIT $1`,
    [limit],
  );
  return rows || [];
}

export async function listTickets(filters: {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<SupportTicketWithCustomer[]> {
  let whereClause = 'st."deletedAt" IS NULL';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.status) {
    whereClause += ` AND st."status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.priority) {
    whereClause += ` AND st."priority" = $${paramIndex++}`;
    params.push(filters.priority);
  }
  if (filters.search) {
    whereClause += ` AND (st."subject" ILIKE $${paramIndex} OR st."description" ILIKE $${paramIndex} OR c."email" ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const rows = await query<SupportTicketWithCustomer[]>(
    `SELECT st.*, c."email" as "customerEmail",
            COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
     FROM "supportTicket" st
     LEFT JOIN "customer" c ON st."customerId" = c."customerId"
     WHERE ${whereClause}
     ORDER BY st."createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );
  return rows || [];
}

export async function findTicketById(ticketId: string): Promise<SupportTicketWithCustomer | null> {
  return queryOne<SupportTicketWithCustomer>(
    `SELECT st.*, c."email" as "customerEmail",
            COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
     FROM "supportTicket" st
     LEFT JOIN "customer" c ON st."customerId" = c."customerId"
     WHERE st."supportTicketId" = $1 AND st."deletedAt" IS NULL`,
    [ticketId],
  );
}

export async function listTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const rows = await query<SupportMessage[]>(
    `SELECT sm.*, 'admin' as "senderType"
     FROM "supportMessage" sm
     WHERE sm."supportTicketId" = $1
     ORDER BY sm."createdAt" ASC`,
    [ticketId],
  );
  return rows || [];
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  await query(`UPDATE "supportTicket" SET "status" = $1, "updatedAt" = NOW() WHERE "supportTicketId" = $2`, [status, ticketId]);
}

export async function addTicketMessage(ticketId: string, message: string, senderId: string): Promise<void> {
  await query(
    `INSERT INTO "supportMessage" ("supportMessageId", "supportTicketId", "message", "senderId", "senderType", "createdAt")
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [uuidv4(), ticketId, message, senderId, 'admin'],
  );

  await query(
    `UPDATE "supportTicket" SET "firstResponseAt" = COALESCE("firstResponseAt", NOW())
     WHERE "supportTicketId" = $1`,
    [ticketId],
  );
}
