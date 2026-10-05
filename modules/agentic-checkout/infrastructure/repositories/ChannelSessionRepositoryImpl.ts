/**
 * ChannelSessionRepositoryImpl
 *
 * Maps agenticCheckoutSession rows to domain ChannelSession entities.
 * The internal checkoutSession remains authoritative for totals — this
 * table only stores channel linkage, buyer, attribution, and lifecycle.
 */

import { query, queryOne } from '../../../../libs/db';
import type { AgenticCheckoutSession as DbAgenticCheckoutSession } from '../../../../libs/db/types';
import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import {
  ChannelSession,
  type ChannelBuyer,
  type ChannelFulfillmentDetails,
  type ChannelAttribution,
  type ChannelSessionStatus,
} from '../../domain/entities/ChannelSession';

function mapToEntity(row: DbAgenticCheckoutSession): ChannelSession {
  return ChannelSession.reconstitute({
    channelSessionId: row.agenticCheckoutSessionId,
    integrationId: row.integrationId,
    organizationId: row.organizationId,
    storeId: row.storeId,
    basketId: row.basketId,
    checkoutId: row.checkoutId,
    orderId: row.orderId,
    status: row.status as ChannelSessionStatus,
    buyer: (row.buyer as ChannelBuyer | null) ?? null,
    fulfillmentDetails: (row.fulfillmentDetails as ChannelFulfillmentDetails | null) ?? null,
    attribution: (row.attribution as ChannelAttribution | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  });
}

class ChannelSessionRepositoryImpl implements ChannelSessionRepository {
  async save(session: ChannelSession): Promise<ChannelSession> {
    const row = await queryOne<DbAgenticCheckoutSession>(
      `INSERT INTO "agenticCheckoutSession" (
         "agenticCheckoutSessionId", "integrationId", "organizationId", "storeId",
         "basketId", "checkoutId", "orderId", "status",
         "buyer", "fulfillmentDetails", "attribution", "metadata",
         "createdAt", "updatedAt", "expiresAt"
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT ("agenticCheckoutSessionId") DO UPDATE SET
         "basketId" = EXCLUDED."basketId",
         "checkoutId" = EXCLUDED."checkoutId",
         "orderId" = EXCLUDED."orderId",
         "status" = EXCLUDED."status",
         "buyer" = EXCLUDED."buyer",
         "fulfillmentDetails" = EXCLUDED."fulfillmentDetails",
         "attribution" = EXCLUDED."attribution",
         "metadata" = EXCLUDED."metadata",
         "updatedAt" = EXCLUDED."updatedAt",
         "expiresAt" = EXCLUDED."expiresAt"
       RETURNING *`,
      [
        session.channelSessionId,
        session.integrationId,
        session.organizationId,
        session.storeId,
        session.basketId,
        session.checkoutId,
        session.orderId,
        session.status,
        session.buyer ? JSON.stringify(session.buyer) : null,
        session.fulfillmentDetails ? JSON.stringify(session.fulfillmentDetails) : null,
        session.attribution ? JSON.stringify(session.attribution) : null,
        session.metadata ? JSON.stringify(session.metadata) : null,
        session.createdAt,
        session.updatedAt,
        session.expiresAt,
      ],
    );
    return mapToEntity(row!);
  }

  async findById(channelSessionId: string): Promise<ChannelSession | null> {
    const row = await queryOne<DbAgenticCheckoutSession>(`SELECT * FROM "agenticCheckoutSession" WHERE "agenticCheckoutSessionId" = $1`, [
      channelSessionId,
    ]);
    return row ? mapToEntity(row) : null;
  }

  async findByCheckoutId(checkoutId: string): Promise<ChannelSession | null> {
    const row = await queryOne<DbAgenticCheckoutSession>(`SELECT * FROM "agenticCheckoutSession" WHERE "checkoutId" = $1`, [checkoutId]);
    return row ? mapToEntity(row) : null;
  }

  async findByIntegration(
    integrationId: string,
    filters?: { status?: string; limit?: number; offset?: number },
  ): Promise<ChannelSession[]> {
    const params: unknown[] = [integrationId];
    let sql = `SELECT * FROM "agenticCheckoutSession" WHERE "integrationId" = $1`;
    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND "status" = $${params.length}`;
    }
    sql += ` ORDER BY "createdAt" DESC`;
    if (filters?.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (filters?.offset) {
      params.push(filters.offset);
      sql += ` OFFSET $${params.length}`;
    }
    const rows = await query<DbAgenticCheckoutSession[]>(sql, params);
    return (rows ?? []).map(mapToEntity);
  }
}

export const channelSessionRepository = new ChannelSessionRepositoryImpl();
