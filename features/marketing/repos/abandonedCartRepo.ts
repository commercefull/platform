/**
 * Abandoned Cart Repository
 * Handles CRUD operations for abandoned cart recovery
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type AbandonedCartStatus = 'abandoned' | 'reminded' | 'recovered' | 'expired' | 'opted_out';
export type AbandonedCartEmailStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';

export interface AbandonedCart {
  abandonedCartId: string;
  basketId: string;
  customerId?: string;
  email?: string;
  firstName?: string;
  status: AbandonedCartStatus;
  cartValue: number;
  currency: string;
  itemCount: number;
  cartSnapshot?: Record<string, any>;
  abandonedAt: Date;
  emailSequence: number;
  emailsSent: number;
  lastEmailSentAt?: Date;
  nextEmailScheduledAt?: Date;
  recoveredOrderId?: string;
  recoveredAt?: Date;
  recoveredValue?: number;
  recoverySource?: string;
  discountCode?: string;
  discountAmount?: number;
  optedOut: boolean;
  optedOutAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AbandonedCartEmail {
  abandonedCartEmailId: string;
  abandonedCartId: string;
  emailTemplateId?: string;
  sequenceNumber: number;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  status: AbandonedCartEmailStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  openCount: number;
  clickedAt?: Date;
  clickCount: number;
  messageId?: string;
  failureReason?: string;
  discountCode?: string;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Abandoned Cart CRUD
// ============================================================================

export async function getAbandonedCart(abandonedCartId: string): Promise<AbandonedCart | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "abandonedCart" WHERE "abandonedCartId" = $1',
    [abandonedCartId]
  );
  return row ? mapToAbandonedCart(row) : null;
}

export async function getAbandonedCartByBasket(basketId: string): Promise<AbandonedCart | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "abandonedCart" WHERE "basketId" = $1',
    [basketId]
  );
  return row ? mapToAbandonedCart(row) : null;
}

export async function getAbandonedCarts(
  filters?: {
    status?: AbandonedCartStatus;
    customerId?: string;
    email?: string;
    minValue?: number;
    abandonedAfter?: Date;
    abandonedBefore?: Date;
  },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: AbandonedCart[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.email) {
    whereClause += ` AND "email" = $${paramIndex++}`;
    params.push(filters.email);
  }
  if (filters?.minValue) {
    whereClause += ` AND "cartValue" >= $${paramIndex++}`;
    params.push(filters.minValue);
  }
  if (filters?.abandonedAfter) {
    whereClause += ` AND "abandonedAt" >= $${paramIndex++}`;
    params.push(filters.abandonedAfter.toISOString());
  }
  if (filters?.abandonedBefore) {
    whereClause += ` AND "abandonedAt" <= $${paramIndex++}`;
    params.push(filters.abandonedBefore.toISOString());
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "abandonedCart" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "abandonedCart" WHERE ${whereClause} 
     ORDER BY "abandonedAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToAbandonedCart),
    total: parseInt(countResult?.count || '0')
  };
}

export async function getCartsToRemind(limit: number = 100): Promise<AbandonedCart[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "abandonedCart" 
     WHERE "status" IN ('abandoned', 'reminded')
     AND "optedOut" = false
     AND "nextEmailScheduledAt" IS NOT NULL
     AND "nextEmailScheduledAt" <= NOW()
     ORDER BY "nextEmailScheduledAt" ASC
     LIMIT $1`,
    [limit]
  );
  return (rows || []).map(mapToAbandonedCart);
}

export async function saveAbandonedCart(cart: Partial<AbandonedCart> & { basketId: string }): Promise<AbandonedCart> {
  const now = new Date().toISOString();

  if (cart.abandonedCartId) {
    await query(
      `UPDATE "abandonedCart" SET
        "email" = $1, "firstName" = $2, "status" = $3, "cartValue" = $4, "currency" = $5,
        "itemCount" = $6, "cartSnapshot" = $7, "emailSequence" = $8, "emailsSent" = $9,
        "lastEmailSentAt" = $10, "nextEmailScheduledAt" = $11, "recoveredOrderId" = $12,
        "recoveredAt" = $13, "recoveredValue" = $14, "recoverySource" = $15,
        "discountCode" = $16, "discountAmount" = $17, "optedOut" = $18, "optedOutAt" = $19,
        "updatedAt" = $20
      WHERE "abandonedCartId" = $21`,
      [
        cart.email, cart.firstName, cart.status || 'abandoned', cart.cartValue || 0,
        cart.currency || 'USD', cart.itemCount || 0,
        cart.cartSnapshot ? JSON.stringify(cart.cartSnapshot) : null,
        cart.emailSequence || 0, cart.emailsSent || 0,
        cart.lastEmailSentAt?.toISOString(), cart.nextEmailScheduledAt?.toISOString(),
        cart.recoveredOrderId, cart.recoveredAt?.toISOString(), cart.recoveredValue,
        cart.recoverySource, cart.discountCode, cart.discountAmount,
        cart.optedOut || false, cart.optedOutAt?.toISOString(), now, cart.abandonedCartId
      ]
    );
    return (await getAbandonedCart(cart.abandonedCartId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "abandonedCart" (
        "basketId", "customerId", "email", "firstName", "status", "cartValue", "currency",
        "itemCount", "cartSnapshot", "abandonedAt", "ipAddress", "userAgent", "deviceType",
        "country", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        cart.basketId, cart.customerId, cart.email, cart.firstName, 'abandoned',
        cart.cartValue || 0, cart.currency || 'USD', cart.itemCount || 0,
        cart.cartSnapshot ? JSON.stringify(cart.cartSnapshot) : null,
        cart.abandonedAt?.toISOString() || now, cart.ipAddress, cart.userAgent,
        cart.deviceType, cart.country, cart.metadata ? JSON.stringify(cart.metadata) : null,
        now, now
      ]
    );
    return mapToAbandonedCart(result!);
  }
}

export async function markRecovered(
  abandonedCartId: string,
  orderId: string,
  orderValue: number,
  source?: string
): Promise<void> {
  await query(
    `UPDATE "abandonedCart" SET
      "status" = 'recovered', "recoveredOrderId" = $1, "recoveredAt" = $2,
      "recoveredValue" = $3, "recoverySource" = $4, "updatedAt" = $2
    WHERE "abandonedCartId" = $5`,
    [orderId, new Date().toISOString(), orderValue, source, abandonedCartId]
  );
}

export async function optOut(abandonedCartId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "abandonedCart" SET "optedOut" = true, "optedOutAt" = $1, "status" = 'opted_out', "updatedAt" = $1
     WHERE "abandonedCartId" = $2`,
    [now, abandonedCartId]
  );
}

export async function scheduleNextEmail(
  abandonedCartId: string,
  scheduledAt: Date,
  sequenceNumber: number
): Promise<void> {
  await query(
    `UPDATE "abandonedCart" SET 
      "nextEmailScheduledAt" = $1, "emailSequence" = $2, "updatedAt" = $3
     WHERE "abandonedCartId" = $4`,
    [scheduledAt.toISOString(), sequenceNumber, new Date().toISOString(), abandonedCartId]
  );
}

// ============================================================================
// Abandoned Cart Emails
// ============================================================================

export async function getAbandonedCartEmails(abandonedCartId: string): Promise<AbandonedCartEmail[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "abandonedCartEmail" WHERE "abandonedCartId" = $1 ORDER BY "sequenceNumber" ASC',
    [abandonedCartId]
  );
  return (rows || []).map(mapToAbandonedCartEmail);
}

export async function saveAbandonedCartEmail(email: Partial<AbandonedCartEmail> & {
  abandonedCartId: string;
  sequenceNumber: number;
}): Promise<AbandonedCartEmail> {
  const now = new Date().toISOString();

  if (email.abandonedCartEmailId) {
    await query(
      `UPDATE "abandonedCartEmail" SET
        "status" = $1, "sentAt" = $2, "deliveredAt" = $3, "openedAt" = $4, "openCount" = $5,
        "clickedAt" = $6, "clickCount" = $7, "messageId" = $8, "failureReason" = $9, "updatedAt" = $10
      WHERE "abandonedCartEmailId" = $11`,
      [
        email.status || 'pending', email.sentAt?.toISOString(), email.deliveredAt?.toISOString(),
        email.openedAt?.toISOString(), email.openCount || 0, email.clickedAt?.toISOString(),
        email.clickCount || 0, email.messageId, email.failureReason, now, email.abandonedCartEmailId
      ]
    );
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "abandonedCartEmail" WHERE "abandonedCartEmailId" = $1',
      [email.abandonedCartEmailId]
    );
    return mapToAbandonedCartEmail(result!);
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "abandonedCartEmail" (
        "abandonedCartId", "emailTemplateId", "sequenceNumber", "subject", "bodyHtml", "bodyText",
        "status", "scheduledAt", "discountCode", "discountAmount", "discountType", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        email.abandonedCartId, email.emailTemplateId, email.sequenceNumber, email.subject,
        email.bodyHtml, email.bodyText, 'pending', email.scheduledAt?.toISOString(),
        email.discountCode, email.discountAmount, email.discountType, now, now
      ]
    );
    return mapToAbandonedCartEmail(result!);
  }
}

export async function recordEmailSent(
  abandonedCartId: string,
  abandonedCartEmailId: string,
  messageId?: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await query(
    `UPDATE "abandonedCartEmail" SET "status" = 'sent', "sentAt" = $1, "messageId" = $2, "updatedAt" = $1
     WHERE "abandonedCartEmailId" = $3`,
    [now, messageId, abandonedCartEmailId]
  );

  await query(
    `UPDATE "abandonedCart" SET 
      "emailsSent" = "emailsSent" + 1, "lastEmailSentAt" = $1, "status" = 'reminded', "updatedAt" = $1
     WHERE "abandonedCartId" = $2`,
    [now, abandonedCartId]
  );
}

// ============================================================================
// Statistics
// ============================================================================

export async function getAbandonedCartStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  averageCartValue: number;
}> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    whereClause += ` AND "abandonedAt" >= $${paramIndex++}`;
    params.push(startDate.toISOString());
  }
  if (endDate) {
    whereClause += ` AND "abandonedAt" <= $${paramIndex++}`;
    params.push(endDate.toISOString());
  }

  const result = await queryOne<Record<string, any>>(
    `SELECT 
      COUNT(*) as "totalAbandoned",
      COUNT(*) FILTER (WHERE "status" = 'recovered') as "totalRecovered",
      COALESCE(SUM("cartValue"), 0) as "totalAbandonedValue",
      COALESCE(SUM("recoveredValue"), 0) as "totalRecoveredValue",
      COALESCE(AVG("cartValue"), 0) as "averageCartValue"
    FROM "abandonedCart" WHERE ${whereClause}`,
    params
  );

  const totalAbandoned = parseInt(result?.totalAbandoned || '0');
  const totalRecovered = parseInt(result?.totalRecovered || '0');

  return {
    totalAbandoned,
    totalRecovered,
    recoveryRate: totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0,
    totalAbandonedValue: parseFloat(result?.totalAbandonedValue || '0'),
    totalRecoveredValue: parseFloat(result?.totalRecoveredValue || '0'),
    averageCartValue: parseFloat(result?.averageCartValue || '0')
  };
}

// ============================================================================
// Helpers
// ============================================================================

function mapToAbandonedCart(row: Record<string, any>): AbandonedCart {
  return {
    abandonedCartId: row.abandonedCartId,
    basketId: row.basketId,
    customerId: row.customerId,
    email: row.email,
    firstName: row.firstName,
    status: row.status,
    cartValue: parseFloat(row.cartValue) || 0,
    currency: row.currency || 'USD',
    itemCount: parseInt(row.itemCount) || 0,
    cartSnapshot: row.cartSnapshot,
    abandonedAt: new Date(row.abandonedAt),
    emailSequence: parseInt(row.emailSequence) || 0,
    emailsSent: parseInt(row.emailsSent) || 0,
    lastEmailSentAt: row.lastEmailSentAt ? new Date(row.lastEmailSentAt) : undefined,
    nextEmailScheduledAt: row.nextEmailScheduledAt ? new Date(row.nextEmailScheduledAt) : undefined,
    recoveredOrderId: row.recoveredOrderId,
    recoveredAt: row.recoveredAt ? new Date(row.recoveredAt) : undefined,
    recoveredValue: row.recoveredValue ? parseFloat(row.recoveredValue) : undefined,
    recoverySource: row.recoverySource,
    discountCode: row.discountCode,
    discountAmount: row.discountAmount ? parseFloat(row.discountAmount) : undefined,
    optedOut: Boolean(row.optedOut),
    optedOutAt: row.optedOutAt ? new Date(row.optedOutAt) : undefined,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    deviceType: row.deviceType,
    country: row.country,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToAbandonedCartEmail(row: Record<string, any>): AbandonedCartEmail {
  return {
    abandonedCartEmailId: row.abandonedCartEmailId,
    abandonedCartId: row.abandonedCartId,
    emailTemplateId: row.emailTemplateId,
    sequenceNumber: parseInt(row.sequenceNumber) || 0,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    status: row.status,
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : undefined,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
    openedAt: row.openedAt ? new Date(row.openedAt) : undefined,
    openCount: parseInt(row.openCount) || 0,
    clickedAt: row.clickedAt ? new Date(row.clickedAt) : undefined,
    clickCount: parseInt(row.clickCount) || 0,
    messageId: row.messageId,
    failureReason: row.failureReason,
    discountCode: row.discountCode,
    discountAmount: row.discountAmount ? parseFloat(row.discountAmount) : undefined,
    discountType: row.discountType,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
