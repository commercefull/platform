/**
 * Distribution Pre-Order Repository
 * Handles CRUD operations for pre-orders and reservations
 */

import { query, queryOne } from '../../../libs/db';

// Table names
const PRE_ORDER_TABLE = 'distributionPreOrder';
const RESERVATION_TABLE = 'distributionPreOrderReservation';

// ============================================================================
// Types
// ============================================================================

export type PreOrderStatus = 'active' | 'paused' | 'fulfilled' | 'cancelled';
export type PreOrderType = 'pre_order' | 'backorder' | 'coming_soon';
export type ReservationStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled' | 'refunded';

export interface PreOrder {
  distributionPreOrderId: string;
  productId: string;
  productVariantId?: string;
  status: PreOrderStatus;
  preOrderType: PreOrderType;
  releaseDate?: Date;
  estimatedShipDate?: Date;
  estimatedShipText?: string;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPercent?: number;
  isDepositRefundable: boolean;
  maxQuantity?: number;
  reservedQuantity: number;
  orderedQuantity: number;
  allowOversell: boolean;
  oversellLimit?: number;
  preOrderPrice?: number;
  regularPrice?: number;
  discountPercent?: number;
  currency: string;
  chargeOnRelease: boolean;
  notifyOnRelease: boolean;
  preOrderMessage?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreOrderReservation {
  distributionPreOrderReservationId: string;
  distributionPreOrderId: string;
  customerId: string;
  orderId?: string;
  reservationNumber?: string;
  status: ReservationStatus;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  depositPaid: number;
  balanceDue?: number;
  currency: string;
  depositPaidAt?: Date;
  balancePaidAt?: Date;
  paymentIntentId?: string;
  estimatedFulfillmentAt?: Date;
  fulfilledAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notificationSent: boolean;
  notificationSentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Pre-Orders
// ============================================================================

export async function getPreOrder(preOrderId: string): Promise<PreOrder | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "distributionPreOrder" WHERE "distributionPreOrderId" = $1',
    [preOrderId]
  );
  return row ? mapToPreOrder(row) : null;
}

export async function getPreOrderByProduct(productId: string, productVariantId?: string): Promise<PreOrder | null> {
  let whereClause = '"productId" = $1';
  const params: any[] = [productId];

  if (productVariantId) {
    whereClause += ' AND "productVariantId" = $2';
    params.push(productVariantId);
  } else {
    whereClause += ' AND "productVariantId" IS NULL';
  }

  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "distributionPreOrder" WHERE ${whereClause} AND "status" = 'active'`,
    params
  );
  return row ? mapToPreOrder(row) : null;
}

export async function getPreOrders(
  filters?: { status?: PreOrderStatus; preOrderType?: PreOrderType },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: PreOrder[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.preOrderType) {
    whereClause += ` AND "preOrderType" = $${paramIndex++}`;
    params.push(filters.preOrderType);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "distributionPreOrder" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "distributionPreOrder" WHERE ${whereClause} 
     ORDER BY "releaseDate" ASC NULLS LAST, "createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToPreOrder),
    total: parseInt(countResult?.count || '0')
  };
}

export async function savePreOrder(preOrder: Partial<PreOrder> & { productId: string }): Promise<PreOrder> {
  const now = new Date().toISOString();

  if (preOrder.distributionPreOrderId) {
    await query(
      `UPDATE "distributionPreOrder" SET
        "productVariantId" = $1, "status" = $2, "preOrderType" = $3,
        "releaseDate" = $4, "estimatedShipDate" = $5, "estimatedShipText" = $6,
        "requiresDeposit" = $7, "depositAmount" = $8, "depositPercent" = $9,
        "isDepositRefundable" = $10, "maxQuantity" = $11, "allowOversell" = $12,
        "oversellLimit" = $13, "preOrderPrice" = $14, "regularPrice" = $15,
        "discountPercent" = $16, "currency" = $17, "chargeOnRelease" = $18,
        "notifyOnRelease" = $19, "preOrderMessage" = $20, "termsAndConditions" = $21,
        "metadata" = $22, "updatedAt" = $23
      WHERE "distributionPreOrderId" = $24`,
      [
        preOrder.productVariantId, preOrder.status || 'active',
        preOrder.preOrderType || 'pre_order', preOrder.releaseDate?.toISOString(),
        preOrder.estimatedShipDate?.toISOString(), preOrder.estimatedShipText,
        preOrder.requiresDeposit || false, preOrder.depositAmount, preOrder.depositPercent,
        preOrder.isDepositRefundable !== false, preOrder.maxQuantity,
        preOrder.allowOversell || false, preOrder.oversellLimit,
        preOrder.preOrderPrice, preOrder.regularPrice, preOrder.discountPercent,
        preOrder.currency || 'USD', preOrder.chargeOnRelease || false,
        preOrder.notifyOnRelease !== false, preOrder.preOrderMessage,
        preOrder.termsAndConditions,
        preOrder.metadata ? JSON.stringify(preOrder.metadata) : null,
        now, preOrder.distributionPreOrderId
      ]
    );
    return (await getPreOrder(preOrder.distributionPreOrderId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "distributionPreOrder" (
        "productId", "productVariantId", "status", "preOrderType", "releaseDate",
        "estimatedShipDate", "estimatedShipText", "requiresDeposit", "depositAmount",
        "depositPercent", "isDepositRefundable", "maxQuantity", "allowOversell",
        "oversellLimit", "preOrderPrice", "regularPrice", "discountPercent",
        "currency", "chargeOnRelease", "notifyOnRelease", "preOrderMessage",
        "termsAndConditions", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        preOrder.productId, preOrder.productVariantId,
        preOrder.preOrderType || 'pre_order', preOrder.releaseDate?.toISOString(),
        preOrder.estimatedShipDate?.toISOString(), preOrder.estimatedShipText,
        preOrder.requiresDeposit || false, preOrder.depositAmount, preOrder.depositPercent,
        preOrder.isDepositRefundable !== false, preOrder.maxQuantity,
        preOrder.allowOversell || false, preOrder.oversellLimit,
        preOrder.preOrderPrice, preOrder.regularPrice, preOrder.discountPercent,
        preOrder.currency || 'USD', preOrder.chargeOnRelease || false,
        preOrder.notifyOnRelease !== false, preOrder.preOrderMessage,
        preOrder.termsAndConditions,
        preOrder.metadata ? JSON.stringify(preOrder.metadata) : null, now, now
      ]
    );
    return mapToPreOrder(result!);
  }
}

export async function updatePreOrderQuantities(preOrderId: string): Promise<void> {
  await query(
    `UPDATE "distributionPreOrder" SET 
      "reservedQuantity" = (
        SELECT COALESCE(SUM("quantity"), 0) FROM "distributionPreOrderReservation" 
        WHERE "distributionPreOrderId" = $1 AND "status" IN ('pending', 'confirmed')
      ),
      "orderedQuantity" = (
        SELECT COALESCE(SUM("quantity"), 0) FROM "distributionPreOrderReservation" 
        WHERE "distributionPreOrderId" = $1 AND "status" = 'confirmed'
      ),
      "updatedAt" = $2
     WHERE "distributionPreOrderId" = $1`,
    [preOrderId, new Date().toISOString()]
  );
}

// ============================================================================
// Reservations
// ============================================================================

export async function getReservation(preOrderReservationId: string): Promise<PreOrderReservation | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "distributionPreOrderReservation" WHERE "distributionPreOrderReservationId" = $1',
    [preOrderReservationId]
  );
  return row ? mapToReservation(row) : null;
}

export async function getReservationByNumber(reservationNumber: string): Promise<PreOrderReservation | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "distributionPreOrderReservation" WHERE "reservationNumber" = $1',
    [reservationNumber]
  );
  return row ? mapToReservation(row) : null;
}

export async function getReservations(
  filters?: { preOrderId?: string; customerId?: string; status?: ReservationStatus },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: PreOrderReservation[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.preOrderId) {
    whereClause += ` AND "distributionPreOrderId" = $${paramIndex++}`;
    params.push(filters.preOrderId);
  }
  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "distributionPreOrderReservation" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "distributionPreOrderReservation" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToReservation),
    total: parseInt(countResult?.count || '0')
  };
}

export async function createReservation(reservation: {
  distributionPreOrderId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  depositPaid?: number;
  paymentIntentId?: string;
}): Promise<PreOrderReservation> {
  const preOrder = await getPreOrder(reservation.distributionPreOrderId);
  if (!preOrder) throw new Error('Pre-order not found');
  if (preOrder.status !== 'active') throw new Error('Pre-order is not active');

  // Check availability
  const availableQuantity = preOrder.maxQuantity 
    ? preOrder.maxQuantity - preOrder.reservedQuantity 
    : Infinity;
  
  if (!preOrder.allowOversell && reservation.quantity > availableQuantity) {
    throw new Error('Requested quantity not available');
  }

  const now = new Date().toISOString();
  const reservationNumber = await generateReservationNumber();
  const totalPrice = reservation.unitPrice * reservation.quantity;
  const depositPaid = reservation.depositPaid || 0;
  const balanceDue = totalPrice - depositPaid;

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "distributionPreOrderReservation" (
      "distributionPreOrderId", "customerId", "reservationNumber", "status", "quantity",
      "unitPrice", "totalPrice", "depositPaid", "balanceDue", "currency",
      "depositPaidAt", "paymentIntentId", "estimatedFulfillmentAt",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      reservation.distributionPreOrderId, reservation.customerId, reservationNumber,
      depositPaid > 0 ? 'confirmed' : 'pending', reservation.quantity,
      reservation.unitPrice, totalPrice, depositPaid, balanceDue,
      preOrder.currency, depositPaid > 0 ? now : null,
      reservation.paymentIntentId, preOrder.estimatedShipDate?.toISOString(),
      now, now
    ]
  );

  // Update pre-order quantities
  await updatePreOrderQuantities(reservation.distributionPreOrderId);

  return mapToReservation(result!);
}

export async function confirmReservation(preOrderReservationId: string, paymentIntentId?: string): Promise<void> {
  const reservation = await getReservation(preOrderReservationId);
  if (!reservation) throw new Error('Reservation not found');

  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPreOrderReservation" SET 
      "status" = 'confirmed', "depositPaidAt" = $1, "paymentIntentId" = COALESCE($2, "paymentIntentId"),
      "updatedAt" = $1
     WHERE "distributionPreOrderReservationId" = $3`,
    [now, paymentIntentId, preOrderReservationId]
  );

  await updatePreOrderQuantities(reservation.distributionPreOrderId);
}

export async function fulfillReservation(preOrderReservationId: string, orderId: string): Promise<void> {
  const reservation = await getReservation(preOrderReservationId);
  if (!reservation) throw new Error('Reservation not found');

  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPreOrderReservation" SET 
      "status" = 'fulfilled', "orderId" = $1, "fulfilledAt" = $2,
      "balancePaidAt" = $2, "balanceDue" = 0, "updatedAt" = $2
     WHERE "distributionPreOrderReservationId" = $3`,
    [orderId, now, preOrderReservationId]
  );

  await updatePreOrderQuantities(reservation.distributionPreOrderId);
}

export async function cancelReservation(preOrderReservationId: string, reason?: string): Promise<void> {
  const reservation = await getReservation(preOrderReservationId);
  if (!reservation) throw new Error('Reservation not found');

  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPreOrderReservation" SET 
      "status" = 'cancelled', "cancelledAt" = $1, "cancellationReason" = $2, "updatedAt" = $1
     WHERE "distributionPreOrderReservationId" = $3`,
    [now, reason, preOrderReservationId]
  );

  await updatePreOrderQuantities(reservation.distributionPreOrderId);
}

// ============================================================================
// Helpers
// ============================================================================

async function generateReservationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "distributionPreOrderReservation" WHERE "reservationNumber" LIKE $1`,
    [`PRE${year}%`]
  );
  const count = parseInt(result?.count || '0') + 1;
  return `PRE${year}-${count.toString().padStart(6, '0')}`;
}

function mapToPreOrder(row: Record<string, any>): PreOrder {
  return {
    distributionPreOrderId: row.distributionPreOrderId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    status: row.status,
    preOrderType: row.preOrderType,
    releaseDate: row.releaseDate ? new Date(row.releaseDate) : undefined,
    estimatedShipDate: row.estimatedShipDate ? new Date(row.estimatedShipDate) : undefined,
    estimatedShipText: row.estimatedShipText,
    requiresDeposit: Boolean(row.requiresDeposit),
    depositAmount: row.depositAmount ? parseFloat(row.depositAmount) : undefined,
    depositPercent: row.depositPercent ? parseFloat(row.depositPercent) : undefined,
    isDepositRefundable: Boolean(row.isDepositRefundable),
    maxQuantity: row.maxQuantity ? parseInt(row.maxQuantity) : undefined,
    reservedQuantity: parseInt(row.reservedQuantity) || 0,
    orderedQuantity: parseInt(row.orderedQuantity) || 0,
    allowOversell: Boolean(row.allowOversell),
    oversellLimit: row.oversellLimit ? parseInt(row.oversellLimit) : undefined,
    preOrderPrice: row.preOrderPrice ? parseFloat(row.preOrderPrice) : undefined,
    regularPrice: row.regularPrice ? parseFloat(row.regularPrice) : undefined,
    discountPercent: row.discountPercent ? parseFloat(row.discountPercent) : undefined,
    currency: row.currency || 'USD',
    chargeOnRelease: Boolean(row.chargeOnRelease),
    notifyOnRelease: Boolean(row.notifyOnRelease),
    preOrderMessage: row.preOrderMessage,
    termsAndConditions: row.termsAndConditions,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToReservation(row: Record<string, any>): PreOrderReservation {
  return {
    distributionPreOrderReservationId: row.distributionPreOrderReservationId,
    distributionPreOrderId: row.distributionPreOrderId,
    customerId: row.customerId,
    orderId: row.orderId,
    reservationNumber: row.reservationNumber,
    status: row.status,
    quantity: parseInt(row.quantity) || 1,
    unitPrice: parseFloat(row.unitPrice) || 0,
    totalPrice: parseFloat(row.totalPrice) || 0,
    depositPaid: parseFloat(row.depositPaid) || 0,
    balanceDue: row.balanceDue ? parseFloat(row.balanceDue) : undefined,
    currency: row.currency || 'USD',
    depositPaidAt: row.depositPaidAt ? new Date(row.depositPaidAt) : undefined,
    balancePaidAt: row.balancePaidAt ? new Date(row.balancePaidAt) : undefined,
    paymentIntentId: row.paymentIntentId,
    estimatedFulfillmentAt: row.estimatedFulfillmentAt ? new Date(row.estimatedFulfillmentAt) : undefined,
    fulfilledAt: row.fulfilledAt ? new Date(row.fulfilledAt) : undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
    cancellationReason: row.cancellationReason,
    notificationSent: Boolean(row.notificationSent),
    notificationSentAt: row.notificationSentAt ? new Date(row.notificationSentAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
