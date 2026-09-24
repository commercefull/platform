/**
 * Gift Card Repository
 * Handles CRUD operations for gift cards and transactions
 */

import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import {
  GiftCardNotFoundError,
  GiftCardNotActiveError,
  GiftCardInsufficientBalanceError,
  GiftCardExpiredError,
  GiftCardNotReloadableError,
  PromotionValidationError,
} from '../../domain/errors/PromotionErrors';

import type {
  GiftCardType,
  GiftCardStatus,
  DeliveryMethod,
  TransactionType,
  PromotionGiftCard,
  PromotionGiftCardTransaction,
} from '../../domain/repositories/GiftCardRepository';

// Re-export domain types for backward compatibility
export type {
  GiftCardType,
  GiftCardStatus,
  DeliveryMethod,
  TransactionType,
  PromotionGiftCard,
  PromotionGiftCardTransaction,
};
export type { GiftCard, GiftCardTransaction } from '../../domain/repositories/GiftCardRepository';

// Table name constants
const GIFT_CARD_TABLE = Table.PromotionGiftCard;
const GIFT_CARD_TRANSACTION_TABLE = Table.PromotionGiftCardTransaction;

// ============================================================================
// Gift Cards
// ============================================================================

export async function getGiftCard(giftCardId: string): Promise<PromotionGiftCard | null> {
  const row = await queryOne<Record<string, unknown>>(`SELECT * FROM "${GIFT_CARD_TABLE}" WHERE "promotionGiftCardId" = $1`, [giftCardId]);
  return row ? mapToGiftCard(row) : null;
}

export async function getGiftCardByCode(code: string): Promise<PromotionGiftCard | null> {
  const row = await queryOne<Record<string, unknown>>(`SELECT * FROM "${GIFT_CARD_TABLE}" WHERE "code" = $1`, [code.toUpperCase()]);
  return row ? mapToGiftCard(row) : null;
}

export async function getGiftCards(
  filters?: { status?: GiftCardStatus; purchasedBy?: string; assignedTo?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: PromotionGiftCard[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.purchasedBy) {
    whereClause += ` AND "purchasedBy" = $${paramIndex++}`;
    params.push(filters.purchasedBy);
  }
  if (filters?.assignedTo) {
    whereClause += ` AND "assignedTo" = $${paramIndex++}`;
    params.push(filters.assignedTo);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${GIFT_CARD_TABLE}" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "${GIFT_CARD_TABLE}" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToGiftCard),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function createGiftCard(giftCard: {
  type?: GiftCardType;
  initialBalanceCents: number;
  currency?: string;
  purchasedBy?: string;
  purchaseOrderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: Date;
  deliveryMethod?: DeliveryMethod;
  expiresAt?: Date;
  isReloadable?: boolean;
  restrictions?: Record<string, unknown>;
}): Promise<PromotionGiftCard> {
  const now = new Date().toISOString();
  const code = generateGiftCardCode();

  const result = await queryOne<Record<string, unknown>>(
    `INSERT INTO "${GIFT_CARD_TABLE}" (
      "code", "type", "initialBalanceCents", "currentBalanceCents", "currency", "status",
      "purchasedBy", "purchaseOrderId", "recipientEmail", "recipientName",
      "personalMessage", "deliveryDate", "deliveryMethod", "expiresAt",
      "isReloadable", "restrictions", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      code,
      giftCard.type || 'standard',
      giftCard.initialBalanceCents,
      giftCard.initialBalanceCents,
      giftCard.currency || 'USD',
      giftCard.purchasedBy,
      giftCard.purchaseOrderId,
      giftCard.recipientEmail,
      giftCard.recipientName,
      giftCard.personalMessage,
      giftCard.deliveryDate?.toISOString(),
      giftCard.deliveryMethod || 'email',
      giftCard.expiresAt?.toISOString(),
      giftCard.isReloadable || false,
      giftCard.restrictions ? JSON.stringify(giftCard.restrictions) : null,
      now,
      now,
    ],
  );

  return mapToGiftCard(result!);
}

export async function activateGiftCard(giftCardId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'active', "activatedAt" = $1, "updatedAt" = $1
     WHERE "promotionGiftCardId" = $2`,
    [now, giftCardId],
  );
}

export async function assignGiftCard(giftCardId: string, customerId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "assignedTo" = $1, "assignedAt" = $2, "updatedAt" = $2
     WHERE "promotionGiftCardId" = $3`,
    [customerId, now, giftCardId],
  );
}

export async function redeemGiftCard(
  giftCardId: string,
  amountCents: number,
  orderId?: string,
  customerId?: string,
  performedBy?: string,
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new GiftCardNotFoundError(giftCardId);
  if (giftCard.status !== 'active') throw new GiftCardNotActiveError(giftCardId);
  if (giftCard.currentBalanceCents < amountCents) throw new GiftCardInsufficientBalanceError(giftCard.currentBalanceCents);
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    throw new GiftCardExpiredError(giftCardId);
  }

  const now = new Date().toISOString();
  const newBalance = giftCard.currentBalanceCents - amountCents;
  const newStatus = newBalance <= 0 ? 'depleted' : 'active';

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET 
      "currentBalanceCents" = $1, "status" = $2, "lastUsedAt" = $3,
      "usageCount" = "usageCount" + 1, "totalRedeemedCents" = "totalRedeemedCents" + $4, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $5`,
    [newBalance, newStatus, now, amountCents, giftCardId],
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'redemption',
    amountCents: -amountCents,
    balanceBeforeCents: giftCard.currentBalanceCents,
    balanceAfterCents: newBalance,
    currency: giftCard.currency,
    orderId,
    customerId,
    performedBy,
    performedByType: performedBy ? 'customer' : 'system',
  });
}

export async function reloadGiftCard(
  giftCardId: string,
  amountCents: number,
  orderId?: string,
  performedBy?: string,
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new GiftCardNotFoundError(giftCardId);
  if (!giftCard.isReloadable) throw new GiftCardNotReloadableError(giftCardId);
  if (giftCard.minReloadAmountCents && amountCents < giftCard.minReloadAmountCents) {
    throw new PromotionValidationError(`Minimum reload amountCents is ${giftCard.minReloadAmountCents}`);
  }
  if (giftCard.maxReloadAmountCents && amountCents > giftCard.maxReloadAmountCents) {
    throw new PromotionValidationError(`Maximum reload amountCents is ${giftCard.maxReloadAmountCents}`);
  }

  const newBalance = giftCard.currentBalanceCents + amountCents;
  if (giftCard.maxBalanceCents && newBalance > giftCard.maxBalanceCents) {
    throw new PromotionValidationError(`Maximum balance is ${giftCard.maxBalanceCents}`);
  }

  const now = new Date().toISOString();
  const newStatus = giftCard.status === 'depleted' ? 'active' : giftCard.status;

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "currentBalanceCents" = $1, "status" = $2, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $4`,
    [newBalance, newStatus, now, giftCardId],
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'reload',
    amountCents,
    balanceBeforeCents: giftCard.currentBalanceCents,
    balanceAfterCents: newBalance,
    currency: giftCard.currency,
    orderId,
    performedBy,
    performedByType: 'customer',
  });
}

export async function refundToGiftCard(
  giftCardId: string,
  amountCents: number,
  orderId?: string,
  performedBy?: string,
  notes?: string,
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new GiftCardNotFoundError(giftCardId);

  const now = new Date().toISOString();
  const newBalance = giftCard.currentBalanceCents + amountCents;
  const newStatus = giftCard.status === 'depleted' ? 'active' : giftCard.status;

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "currentBalanceCents" = $1, "status" = $2, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $4`,
    [newBalance, newStatus, now, giftCardId],
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'refund',
    amountCents,
    balanceBeforeCents: giftCard.currentBalanceCents,
    balanceAfterCents: newBalance,
    currency: giftCard.currency,
    orderId,
    performedBy,
    performedByType: 'admin',
    notes,
  });
}

export async function cancelGiftCard(giftCardId: string): Promise<void> {
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'cancelled', "updatedAt" = $1
     WHERE "promotionGiftCardId" = $2`,
    [new Date().toISOString(), giftCardId],
  );
}

export async function expireGiftCards(): Promise<number> {
  const result = await query<{ rowCount?: number }>(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'expired', "updatedAt" = $1
     WHERE "status" = 'active' AND "expiresAt" < NOW()`,
    [new Date().toISOString()],
  );
  return result?.rowCount || 0;
}

// ============================================================================
// Transactions
// ============================================================================

async function createTransaction(transaction: {
  promotionGiftCardId: string;
  type: TransactionType;
  amountCents: number;
  balanceBeforeCents: number;
  balanceAfterCents: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  performedBy?: string;
  performedByType?: string;
  notes?: string;
}): Promise<PromotionGiftCardTransaction> {
  const now = new Date().toISOString();
  const referenceNumber = `GCT${Date.now()}`;

  const result = await queryOne<Record<string, unknown>>(
    `INSERT INTO "${GIFT_CARD_TRANSACTION_TABLE}" (
      "promotionGiftCardId", "type", "amountCents", "balanceBeforeCents", "balanceAfterCents", "currency",
      "orderId", "customerId", "performedBy", "performedByType", "notes",
      "referenceNumber", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      transaction.promotionGiftCardId,
      transaction.type,
      transaction.amountCents,
      transaction.balanceBeforeCents,
      transaction.balanceAfterCents,
      transaction.currency,
      transaction.orderId,
      transaction.customerId,
      transaction.performedBy,
      transaction.performedByType,
      transaction.notes,
      referenceNumber,
      now,
    ],
  );

  return mapToTransaction(result!);
}

export async function getTransactions(giftCardId: string): Promise<PromotionGiftCardTransaction[]> {
  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "${GIFT_CARD_TRANSACTION_TABLE}" WHERE "promotionGiftCardId" = $1 ORDER BY "createdAt" DESC`,
    [giftCardId],
  );
  return (rows || []).map(mapToTransaction);
}

// ============================================================================
// Helpers
// ============================================================================

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapToGiftCard(row: Record<string, unknown>): PromotionGiftCard {
  return {
    promotionGiftCardId: row.promotionGiftCardId as string,
    code: row.code as string,
    type: row.type as GiftCardType,
    initialBalanceCents: parseFloat(row.initialBalanceCents as string) || 0,
    currentBalanceCents: parseFloat(row.currentBalanceCents as string) || 0,
    currency: (row.currency as string) || 'USD',
    status: row.status as GiftCardStatus,
    purchasedBy: row.purchasedBy as string | undefined,
    purchaseOrderId: row.purchaseOrderId as string | undefined,
    recipientEmail: row.recipientEmail as string | undefined,
    recipientName: row.recipientName as string | undefined,
    personalMessage: row.personalMessage as string | undefined,
    deliveryDate: row.deliveryDate ? new Date(row.deliveryDate as string) : undefined,
    isDelivered: Boolean(row.isDelivered),
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt as string) : undefined,
    deliveryMethod: row.deliveryMethod as DeliveryMethod,
    assignedTo: row.assignedTo as string | undefined,
    assignedAt: row.assignedAt ? new Date(row.assignedAt as string) : undefined,
    activatedAt: row.activatedAt ? new Date(row.activatedAt as string) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : undefined,
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt as string) : undefined,
    usageCount: parseInt(row.usageCount as string) || 0,
    totalRedeemedCents: parseFloat(row.totalRedeemedCents as string) || 0,
    isReloadable: Boolean(row.isReloadable),
    minReloadAmountCents: row.minReloadAmountCents ? parseFloat(row.minReloadAmountCents as string) : undefined,
    maxReloadAmountCents: row.maxReloadAmountCents ? parseFloat(row.maxReloadAmountCents as string) : undefined,
    maxBalanceCents: row.maxBalanceCents ? parseFloat(row.maxBalanceCents as string) : undefined,
    restrictions: row.restrictions as Record<string, unknown> | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function mapToTransaction(row: Record<string, unknown>): PromotionGiftCardTransaction {
  return {
    promotionGiftCardTransactionId: row.promotionGiftCardTransactionId as string,
    promotionGiftCardId: row.promotionGiftCardId as string,
    type: row.type as TransactionType,
    amountCents: parseFloat(row.amountCents as string) || 0,
    balanceBeforeCents: parseFloat(row.balanceBeforeCents as string) || 0,
    balanceAfterCents: parseFloat(row.balanceAfterCents as string) || 0,
    currency: (row.currency as string) || 'USD',
    orderId: row.orderId as string | undefined,
    customerId: row.customerId as string | undefined,
    performedBy: row.performedBy as string | undefined,
    performedByType: row.performedByType as string | undefined,
    notes: row.notes as string | undefined,
    referenceNumber: row.referenceNumber as string | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
  };
}
