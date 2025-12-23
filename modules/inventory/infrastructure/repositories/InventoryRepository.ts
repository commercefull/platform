/**
 * Inventory Repository Implementation
 * PostgreSQL implementation for multi-location inventory management
 */

import { query, queryOne } from '../../../../libs/db';
import { Inventory, InventoryMovement, InventoryTransfer, InventoryLocation } from '../../domain/entities/Inventory';

export interface InventoryFilters {
  productId?: string;
  variantId?: string;
  locationId?: string;
  sku?: string;
  isActive?: boolean;
  inStock?: boolean;
  lowStock?: boolean;
  needsReorder?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  length: number;
}

export class InventoryRepository {
  // Inventory CRUD
  async findById(inventoryId: string): Promise<Inventory | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM inventory WHERE "inventoryId" = $1', [inventoryId]);

    if (!row) return null;
    return this.mapToInventory(row);
  }

  async findByProductAndLocation(productId: string, locationId: string, variantId?: string): Promise<Inventory | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM inventory WHERE "productId" = $1 AND "locationId" = $2 AND "variantId" IS NOT DISTINCT FROM $3',
      [productId, locationId, variantId],
    );

    if (!row) return null;
    return this.mapToInventory(row);
  }

  async findBySku(sku: string, locationId?: string): Promise<Inventory[]> {
    let sql = 'SELECT * FROM inventory WHERE sku = $1';
    const params: any[] = [sku];

    if (locationId) {
      sql += ' AND "locationId" = $2';
      params.push(locationId);
    }

    const rows = await query<Record<string, any>[]>(sql, params);
    return (rows || []).map(row => this.mapToInventory(row));
  }

  async findAll(filters?: InventoryFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Inventory>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM inventory ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM inventory ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const inventory = (rows || []).map(row => this.mapToInventory(row));

    return {
      data: inventory,
      total,
      limit,
      offset,
      hasMore: offset + inventory.length < total,
      length: total,
    };
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>('SELECT "inventoryId" FROM inventory WHERE "inventoryId" = $1', [
      inventory.inventoryId,
    ]);

    if (existing) {
      // Update existing inventory
      await query(
        `UPDATE inventory SET
          quantity = $1, "reservedQuantity" = $2, "availableQuantity" = $3,
          "lowStockThreshold" = $4, "reorderPoint" = $5, "reorderQuantity" = $6,
          cost = $7, "supplierId" = $8, "binLocation" = $9, "expiryDate" = $10,
          "batchNumber" = $11, "isActive" = $12, metadata = $13, "updatedAt" = $14
        WHERE "inventoryId" = $15`,
        [
          inventory.quantity,
          inventory.reservedQuantity,
          inventory.availableQuantity,
          inventory.lowStockThreshold,
          inventory.reorderPoint,
          inventory.reorderQuantity,
          inventory.cost,
          inventory.supplierId,
          inventory.binLocation,
          inventory.expiryDate?.toISOString(),
          inventory.batchNumber,
          inventory.isActive,
          inventory.metadata ? JSON.stringify(inventory.metadata) : null,
          now,
          inventory.inventoryId,
        ],
      );
    } else {
      // Create new inventory
      await query(
        `INSERT INTO inventory (
          "inventoryId", "productId", "variantId", "locationId", sku,
          quantity, "reservedQuantity", "availableQuantity", "lowStockThreshold",
          "reorderPoint", "reorderQuantity", cost, "supplierId", "binLocation",
          "expiryDate", "batchNumber", "isActive", metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          inventory.inventoryId,
          inventory.productId,
          inventory.variantId,
          inventory.locationId,
          inventory.sku,
          inventory.quantity,
          inventory.reservedQuantity,
          inventory.availableQuantity,
          inventory.lowStockThreshold,
          inventory.reorderPoint,
          inventory.reorderQuantity,
          inventory.cost,
          inventory.supplierId,
          inventory.binLocation,
          inventory.expiryDate?.toISOString(),
          inventory.batchNumber,
          inventory.isActive,
          inventory.metadata ? JSON.stringify(inventory.metadata) : null,
          now,
          now,
        ],
      );
    }

    return inventory;
  }

  // Inventory Movement tracking
  async recordMovement(movement: Omit<InventoryMovement, 'movementId' | 'createdAt'>): Promise<InventoryMovement> {
    const movementId = generateUUID();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO "inventoryMovement" (
        "movementId", "inventoryId", "productId", "variantId", "locationId",
        type, quantity, "previousQuantity", "newQuantity", reason,
        "referenceId", "referenceType", "performedBy", notes, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        movementId,
        movement.inventoryId,
        movement.productId,
        movement.variantId,
        movement.locationId,
        movement.type,
        movement.quantity,
        movement.previousQuantity,
        movement.newQuantity,
        movement.reason,
        movement.referenceId,
        movement.referenceType,
        movement.performedBy,
        movement.notes,
        now,
      ],
    );

    return {
      ...movement,
      movementId,
      createdAt: new Date(now),
    };
  }

  async getMovements(inventoryId: string, limit: number = 50): Promise<InventoryMovement[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "inventoryMovement" WHERE "inventoryId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [inventoryId, limit],
    );

    return (rows || []).map(row => ({
      movementId: row.movementId,
      inventoryId: row.inventoryId,
      productId: row.productId,
      variantId: row.variantId,
      locationId: row.locationId,
      type: row.type,
      quantity: parseInt(row.quantity),
      previousQuantity: parseInt(row.previousQuantity),
      newQuantity: parseInt(row.newQuantity),
      reason: row.reason,
      referenceId: row.referenceId,
      referenceType: row.referenceType,
      performedBy: row.performedBy,
      notes: row.notes,
      createdAt: new Date(row.createdAt),
    }));
  }

  // Inventory Locations
  async getLocations(): Promise<InventoryLocation[]> {
    const rows = await query<Record<string, any>[]>('SELECT * FROM "inventoryLocation" WHERE "isActive" = true ORDER BY priority ASC');

    return (rows || []).map(row => ({
      locationId: row.locationId,
      name: row.name,
      type: row.type,
      address: row.address ? JSON.parse(row.address) : undefined,
      isActive: Boolean(row.isActive),
      priority: parseInt(row.priority || '0'),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async getLocationById(locationId: string): Promise<InventoryLocation | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "inventoryLocation" WHERE "locationId" = $1', [locationId]);

    if (!row) return null;

    return {
      locationId: row.locationId,
      name: row.name,
      type: row.type,
      address: row.address ? JSON.parse(row.address) : undefined,
      isActive: Boolean(row.isActive),
      priority: parseInt(row.priority || '0'),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  // Stock calculations
  async getTotalStock(
    productId: string,
    variantId?: string,
  ): Promise<{
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    locations: number;
  }> {
    const rows = await query<Record<string, any>[]>(
      `SELECT
        SUM(quantity) as totalQuantity,
        SUM("reservedQuantity") as reservedQuantity,
        SUM("availableQuantity") as availableQuantity,
        COUNT(*) as locations
      FROM inventory
      WHERE "productId" = $1 AND "variantId" IS NOT DISTINCT FROM $2 AND "isActive" = true`,
      [productId, variantId],
    );

    const row = rows?.[0];
    return {
      totalQuantity: parseInt(row?.totalQuantity || '0'),
      reservedQuantity: parseInt(row?.reservedQuantity || '0'),
      availableQuantity: parseInt(row?.availableQuantity || '0'),
      locations: parseInt(row?.locations || '0'),
    };
  }

  async getLowStockAlerts(): Promise<
    Array<{
      inventoryId: string;
      productId: string;
      variantId?: string;
      sku: string;
      locationId: string;
      quantity: number;
      threshold: number;
    }>
  > {
    const rows = await query<Record<string, any>[]>(
      `SELECT "inventoryId", "productId", "variantId", sku, "locationId", "availableQuantity", "lowStockThreshold"
      FROM inventory
      WHERE "isActive" = true AND "availableQuantity" <= "lowStockThreshold" AND "availableQuantity" > 0
      ORDER BY ("lowStockThreshold" - "availableQuantity") DESC`,
    );

    return (rows || []).map(row => ({
      inventoryId: row.inventoryId,
      productId: row.productId,
      variantId: row.variantId,
      sku: row.sku,
      locationId: row.locationId,
      quantity: parseInt(row.availableQuantity),
      threshold: parseInt(row.lowStockThreshold),
    }));
  }

  async getOutOfStockItems(): Promise<
    Array<{
      inventoryId: string;
      productId: string;
      variantId?: string;
      sku: string;
      locationId: string;
    }>
  > {
    const rows = await query<Record<string, any>[]>(
      `SELECT "inventoryId", "productId", "variantId", sku, "locationId"
      FROM inventory
      WHERE "isActive" = true AND "availableQuantity" <= 0
      ORDER BY "updatedAt" DESC`,
    );

    return (rows || []).map(row => ({
      inventoryId: row.inventoryId,
      productId: row.productId,
      variantId: row.variantId,
      sku: row.sku,
      locationId: row.locationId,
    }));
  }

  async getItemsNeedingReorder(): Promise<
    Array<{
      inventoryId: string;
      productId: string;
      variantId?: string;
      sku: string;
      locationId: string;
      quantity: number;
      reorderPoint: number;
    }>
  > {
    const rows = await query<Record<string, any>[]>(
      `SELECT "inventoryId", "productId", "variantId", sku, "locationId", quantity, "reorderPoint"
      FROM inventory
      WHERE "isActive" = true AND quantity <= "reorderPoint"
      ORDER BY (quantity - "reorderPoint") ASC`,
    );

    return (rows || []).map(row => ({
      inventoryId: row.inventoryId,
      productId: row.productId,
      variantId: row.variantId,
      sku: row.sku,
      locationId: row.locationId,
      quantity: parseInt(row.quantity),
      reorderPoint: parseInt(row.reorderPoint),
    }));
  }

  // Helper methods
  private buildWhereClause(filters?: InventoryFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.productId) {
      conditions.push('"productId" = $' + (params.length + 1));
      params.push(filters.productId);
    }

    if (filters?.variantId !== undefined) {
      if (filters.variantId === null) {
        conditions.push('"variantId" IS NULL');
      } else {
        conditions.push('"variantId" = $' + (params.length + 1));
        params.push(filters.variantId);
      }
    }

    if (filters?.locationId) {
      conditions.push('"locationId" = $' + (params.length + 1));
      params.push(filters.locationId);
    }

    if (filters?.sku) {
      conditions.push('sku = $' + (params.length + 1));
      params.push(filters.sku);
    }

    if (filters?.isActive !== undefined) {
      conditions.push('"isActive" = $' + (params.length + 1));
      params.push(filters.isActive);
    }

    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        conditions.push('"availableQuantity" > 0');
      } else {
        conditions.push('"availableQuantity" <= 0');
      }
    }

    if (filters?.lowStock !== undefined) {
      if (filters.lowStock) {
        conditions.push('"availableQuantity" <= "lowStockThreshold"');
      }
    }

    if (filters?.needsReorder !== undefined) {
      if (filters.needsReorder) {
        conditions.push('quantity <= "reorderPoint"');
      }
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToInventory(row: Record<string, any>): Inventory {
    return Inventory.reconstitute({
      inventoryId: row.inventoryId,
      productId: row.productId,
      variantId: row.variantId,
      locationId: row.locationId,
      sku: row.sku,
      quantity: parseInt(row.quantity || '0'),
      reservedQuantity: parseInt(row.reservedQuantity || '0'),
      availableQuantity: parseInt(row.availableQuantity || '0'),
      lowStockThreshold: parseInt(row.lowStockThreshold || '5'),
      reorderPoint: parseInt(row.reorderPoint || '10'),
      reorderQuantity: parseInt(row.reorderQuantity || '50'),
      lastRestockedAt: row.lastRestockedAt ? new Date(row.lastRestockedAt) : undefined,
      lastCountedAt: row.lastCountedAt ? new Date(row.lastCountedAt) : undefined,
      cost: row.cost ? parseFloat(row.cost) : undefined,
      supplierId: row.supplierId,
      binLocation: row.binLocation,
      expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
      batchNumber: row.batchNumber,
      isActive: Boolean(row.isActive),
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new InventoryRepository();

// Helper function (should be imported from uuid lib)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
