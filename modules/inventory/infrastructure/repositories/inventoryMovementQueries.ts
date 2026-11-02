/** Inventory movement / transaction write queries. */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { InventoryMovement } from '../../domain/entities/Inventory';
import { InventoryTransaction as DbInventoryTransaction } from '../../../../libs/db/types';

export async function recordMovement(movement: Omit<InventoryMovement, 'movementId' | 'createdAt'>): Promise<InventoryMovement> {
  const movementId = generateUUID();
  const now = new Date().toISOString();

  const typeCodeMap: Record<string, string> = {
    inbound: 'RECEIVE',
    outbound: 'SHIP',
    transfer: 'TRANSFER_OUT',
    adjustment: 'ADJUST_UP',
    count: 'ADJUST_UP',
  };
  const typeCode = typeCodeMap[movement.type] || 'ADJUST_UP';
  const typeRow = await queryOne<{ inventoryTransactionTypeId: string }>(
    `SELECT "inventoryTransactionTypeId" FROM "inventoryTransactionType" WHERE code = $1`,
    [typeCode],
  );
  const typeId = typeRow?.inventoryTransactionTypeId;

  await query(
    `INSERT INTO "inventoryTransaction" (
      "inventoryTransactionId", "typeId", "distributionWarehouseId", "productId", "productVariantId", sku,
      quantity, "previousQuantity", "newQuantity", reason,
      "referenceId", "referenceType", notes, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      movementId,
      typeId,
      movement.locationId,
      movement.productId,
      movement.variantId || null,
      '',
      movement.quantity,
      movement.previousQuantity,
      movement.newQuantity,
      movement.reason || null,
      movement.referenceId || null,
      movement.referenceType || null,
      movement.notes || null,
      now,
      now,
    ],
  );

  return {
    ...movement,
    movementId,
    createdAt: new Date(now),
  };
}

export async function getMovements(inventoryId: string, limit: number = 50): Promise<InventoryMovement[]> {
  const rows = await query<DbInventoryTransaction[]>(
    `SELECT * FROM "inventoryTransaction" WHERE "distributionWarehouseId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [inventoryId, limit],
  );

  return (rows || []).map((row: DbInventoryTransaction) => ({
    movementId: row.inventoryTransactionId,
    inventoryId: row.distributionWarehouseId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    locationId: row.distributionWarehouseId,
    type: 'adjustment' as const,
    quantity: row.quantity,
    previousQuantity: row.previousQuantity ?? 0,
    newQuantity: row.newQuantity ?? 0,
    reason: row.reason ?? undefined,
    referenceId: row.referenceId ?? undefined,
    referenceType: row.referenceType ?? undefined,
    performedBy: 'system',
    notes: row.notes ?? undefined,
    createdAt: new Date(row.createdAt),
  }));
}

export interface RecordTransactionInput {
  transferId: string;
  type: string;
  productId: string;
  variantId?: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  initiatedBy?: string;
}

export async function recordTransaction(input: RecordTransactionInput): Promise<void> {
  const txId = generateUUID();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO "inventoryTransaction" (
      "inventoryTransactionId", "distributionWarehouseId", "productId", "productVariantId", sku,
      quantity, "previousQuantity", "newQuantity", reason,
      "referenceId", "referenceType", notes, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      txId,
      input.fromLocationId,
      input.productId,
      input.variantId || null,
      '',
      input.quantity,
      0,
      input.quantity,
      input.reason || `Transfer: ${input.transferId}`,
      input.transferId,
      'transfer',
      input.notes || null,
      now,
      now,
    ],
  );
}

export interface CreateTransferInput {
  transferId: string;
  sourceStoreId: string;
  targetStoreId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  status: string;
  reason?: string;
  priority?: string;
  requestedBy?: string;
}

export function createTransfer(input: CreateTransferInput): {
  transferId: string;
  sourceStoreId: string;
  targetStoreId: string;
  status: string;
  createdAt: Date;
} {
  return {
    transferId: input.transferId,
    sourceStoreId: input.sourceStoreId,
    targetStoreId: input.targetStoreId,
    status: input.status,
    createdAt: new Date(),
  };
}
