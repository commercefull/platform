/**
 * Gift Card Repository
 * Handles CRUD operations for gift cards and transactions
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';

// Table name constants
const GIFT_CARD_TABLE = Table.PromotionGiftCard;
const GIFT_CARD_TRANSACTION_TABLE = Table.PromotionGiftCardTransaction;

// ============================================================================
// Types
// ============================================================================

export type GiftCardType = 'standard' | 'promotional' | 'reward' | 'refund';
export type GiftCardStatus = 'pending' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'suspended';
export type DeliveryMethod = 'email' | 'sms' | 'print' | 'physical';
export type TransactionType = 'purchase' | 'reload' | 'redemption' | 'refund' | 'adjustment' | 'expiration';

export interface PromotionGiftCard {
  promotionGiftCardId: string;
  code: string;
  type: GiftCardType;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  status: GiftCardStatus;
  purchasedBy?: string;
  purchaseOrderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  deliveryMethod: DeliveryMethod;
  assignedTo?: string;
  assignedAt?: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  totalRedeemed: number;
  isReloadable: boolean;
  minReloadAmount?: number;
  maxReloadAmount?: number;
  maxBalance?: number;
  restrictions?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Alias for backward compatibility
export type GiftCard = PromotionGiftCard;

export interface PromotionGiftCardTransaction {
  promotionGiftCardTransactionId: string;
  promotionGiftCardId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  performedBy?: string;
  performedByType?: string;
  notes?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Alias for backward compatibility
export type GiftCardTransaction = PromotionGiftCardTransaction;

// ============================================================================
// Gift Cards
// ============================================================================

export async function getGiftCard(giftCardId: string): Promise<PromotionGiftCard | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "${GIFT_CARD_TABLE}" WHERE "promotionGiftCardId" = $1`,
    [giftCardId]
  );
  return row ? mapToGiftCard(row) : null;
}

export async function getGiftCardByCode(code: string): Promise<PromotionGiftCard | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "${GIFT_CARD_TABLE}" WHERE "code" = $1`,
    [code.toUpperCase()]
  );
  return row ? mapToGiftCard(row) : null;
}

export async function getGiftCards(
  filters?: { status?: GiftCardStatus; purchasedBy?: string; assignedTo?: string },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: PromotionGiftCard[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
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

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${GIFT_CARD_TABLE}" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "${GIFT_CARD_TABLE}" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToGiftCard),
    total: parseInt(countResult?.count || '0')
  };
}

export async function createGiftCard(giftCard: {
  type?: GiftCardType;
  initialBalance: number;
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
  restrictions?: Record<string, any>;
}): Promise<PromotionGiftCard> {
  const now = new Date().toISOString();
  const code = generateGiftCardCode();

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "${GIFT_CARD_TABLE}" (
      "code", "type", "initialBalance", "currentBalance", "currency", "status",
      "purchasedBy", "purchaseOrderId", "recipientEmail", "recipientName",
      "personalMessage", "deliveryDate", "deliveryMethod", "expiresAt",
      "isReloadable", "restrictions", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      code, giftCard.type || 'standard', giftCard.initialBalance, giftCard.initialBalance,
      giftCard.currency || 'USD', giftCard.purchasedBy, giftCard.purchaseOrderId,
      giftCard.recipientEmail, giftCard.recipientName, giftCard.personalMessage,
      giftCard.deliveryDate?.toISOString(), giftCard.deliveryMethod || 'email',
      giftCard.expiresAt?.toISOString(), giftCard.isReloadable || false,
      giftCard.restrictions ? JSON.stringify(giftCard.restrictions) : null, now, now
    ]
  );

  return mapToGiftCard(result!);
}

export async function activateGiftCard(giftCardId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'active', "activatedAt" = $1, "updatedAt" = $1
     WHERE "promotionGiftCardId" = $2`,
    [now, giftCardId]
  );
}

export async function assignGiftCard(giftCardId: string, customerId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "assignedTo" = $1, "assignedAt" = $2, "updatedAt" = $2
     WHERE "promotionGiftCardId" = $3`,
    [customerId, now, giftCardId]
  );
}

export async function redeemGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string,
  customerId?: string,
  performedBy?: string
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new Error('Gift card not found');
  if (giftCard.status !== 'active') throw new Error('Gift card is not active');
  if (giftCard.currentBalance < amount) throw new Error('Insufficient balance');
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    throw new Error('Gift card has expired');
  }

  const now = new Date().toISOString();
  const newBalance = giftCard.currentBalance - amount;
  const newStatus = newBalance <= 0 ? 'depleted' : 'active';

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET 
      "currentBalance" = $1, "status" = $2, "lastUsedAt" = $3,
      "usageCount" = "usageCount" + 1, "totalRedeemed" = "totalRedeemed" + $4, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $5`,
    [newBalance, newStatus, now, amount, giftCardId]
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'redemption',
    amount: -amount,
    balanceBefore: giftCard.currentBalance,
    balanceAfter: newBalance,
    currency: giftCard.currency,
    orderId,
    customerId,
    performedBy,
    performedByType: performedBy ? 'customer' : 'system'
  });
}

export async function reloadGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string,
  performedBy?: string
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new Error('Gift card not found');
  if (!giftCard.isReloadable) throw new Error('Gift card is not reloadable');
  if (giftCard.minReloadAmount && amount < giftCard.minReloadAmount) {
    throw new Error(`Minimum reload amount is ${giftCard.minReloadAmount}`);
  }
  if (giftCard.maxReloadAmount && amount > giftCard.maxReloadAmount) {
    throw new Error(`Maximum reload amount is ${giftCard.maxReloadAmount}`);
  }

  const newBalance = giftCard.currentBalance + amount;
  if (giftCard.maxBalance && newBalance > giftCard.maxBalance) {
    throw new Error(`Maximum balance is ${giftCard.maxBalance}`);
  }

  const now = new Date().toISOString();
  const newStatus = giftCard.status === 'depleted' ? 'active' : giftCard.status;

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "currentBalance" = $1, "status" = $2, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $4`,
    [newBalance, newStatus, now, giftCardId]
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'reload',
    amount,
    balanceBefore: giftCard.currentBalance,
    balanceAfter: newBalance,
    currency: giftCard.currency,
    orderId,
    performedBy,
    performedByType: 'customer'
  });
}

export async function refundToGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string,
  performedBy?: string,
  notes?: string
): Promise<PromotionGiftCardTransaction> {
  const giftCard = await getGiftCard(giftCardId);
  if (!giftCard) throw new Error('Gift card not found');

  const now = new Date().toISOString();
  const newBalance = giftCard.currentBalance + amount;
  const newStatus = giftCard.status === 'depleted' ? 'active' : giftCard.status;

  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "currentBalance" = $1, "status" = $2, "updatedAt" = $3
     WHERE "promotionGiftCardId" = $4`,
    [newBalance, newStatus, now, giftCardId]
  );

  return createTransaction({
    promotionGiftCardId: giftCardId,
    type: 'refund',
    amount,
    balanceBefore: giftCard.currentBalance,
    balanceAfter: newBalance,
    currency: giftCard.currency,
    orderId,
    performedBy,
    performedByType: 'admin',
    notes
  });
}

export async function cancelGiftCard(giftCardId: string): Promise<void> {
  await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'cancelled', "updatedAt" = $1
     WHERE "promotionGiftCardId" = $2`,
    [new Date().toISOString(), giftCardId]
  );
}

export async function expireGiftCards(): Promise<number> {
  const result = await query(
    `UPDATE "${GIFT_CARD_TABLE}" SET "status" = 'expired', "updatedAt" = $1
     WHERE "status" = 'active' AND "expiresAt" < NOW()`,
    [new Date().toISOString()]
  );
  return (result as any)?.rowCount || 0;
}

// ============================================================================
// Transactions
// ============================================================================

async function createTransaction(transaction: {
  promotionGiftCardId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  performedBy?: string;
  performedByType?: string;
  notes?: string;
}): Promise<PromotionGiftCardTransaction> {
  const now = new Date().toISOString();
  const referenceNumber = `GCT${Date.now()}`;

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "${GIFT_CARD_TRANSACTION_TABLE}" (
      "promotionGiftCardId", "type", "amount", "balanceBefore", "balanceAfter", "currency",
      "orderId", "customerId", "performedBy", "performedByType", "notes",
      "referenceNumber", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      transaction.promotionGiftCardId, transaction.type, transaction.amount,
      transaction.balanceBefore, transaction.balanceAfter, transaction.currency,
      transaction.orderId, transaction.customerId, transaction.performedBy,
      transaction.performedByType, transaction.notes, referenceNumber, now
    ]
  );

  return mapToTransaction(result!);
}

export async function getTransactions(giftCardId: string): Promise<PromotionGiftCardTransaction[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "${GIFT_CARD_TRANSACTION_TABLE}" WHERE "promotionGiftCardId" = $1 ORDER BY "createdAt" DESC`,
    [giftCardId]
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

function mapToGiftCard(row: Record<string, any>): PromotionGiftCard {
  return {
    promotionGiftCardId: row.promotionGiftCardId,
    code: row.code,
    type: row.type,
    initialBalance: parseFloat(row.initialBalance) || 0,
    currentBalance: parseFloat(row.currentBalance) || 0,
    currency: row.currency || 'USD',
    status: row.status,
    purchasedBy: row.purchasedBy,
    purchaseOrderId: row.purchaseOrderId,
    recipientEmail: row.recipientEmail,
    recipientName: row.recipientName,
    personalMessage: row.personalMessage,
    deliveryDate: row.deliveryDate ? new Date(row.deliveryDate) : undefined,
    isDelivered: Boolean(row.isDelivered),
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
    deliveryMethod: row.deliveryMethod,
    assignedTo: row.assignedTo,
    assignedAt: row.assignedAt ? new Date(row.assignedAt) : undefined,
    activatedAt: row.activatedAt ? new Date(row.activatedAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : undefined,
    usageCount: parseInt(row.usageCount) || 0,
    totalRedeemed: parseFloat(row.totalRedeemed) || 0,
    isReloadable: Boolean(row.isReloadable),
    minReloadAmount: row.minReloadAmount ? parseFloat(row.minReloadAmount) : undefined,
    maxReloadAmount: row.maxReloadAmount ? parseFloat(row.maxReloadAmount) : undefined,
    maxBalance: row.maxBalance ? parseFloat(row.maxBalance) : undefined,
    restrictions: row.restrictions,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToTransaction(row: Record<string, any>): PromotionGiftCardTransaction {
  return {
    promotionGiftCardTransactionId: row.promotionGiftCardTransactionId,
    promotionGiftCardId: row.promotionGiftCardId,
    type: row.type,
    amount: parseFloat(row.amount) || 0,
    balanceBefore: parseFloat(row.balanceBefore) || 0,
    balanceAfter: parseFloat(row.balanceAfter) || 0,
    currency: row.currency || 'USD',
    orderId: row.orderId,
    customerId: row.customerId,
    performedBy: row.performedBy,
    performedByType: row.performedByType,
    notes: row.notes,
    referenceNumber: row.referenceNumber,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt)
  };
}
