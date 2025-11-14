import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

// TypeScript interfaces with camelCase properties
export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'fulfillment_center' | 'supplier' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  transactionType: 'restock' | 'sale' | 'return' | 'adjustment' | 'transfer' | 'reservation' | 'release';
  quantity: number;
  sourceLocationId?: string;
  destinationLocationId?: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface InventoryReservation {
  id: string;
  inventoryId: string;
  quantity: number;
  orderId?: string;
  cartId?: string;
  expiresAt: string;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

type InventoryItemCreateParams = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>;
type InventoryItemUpdateParams = Partial<Omit<InventoryItem, 'id' | 'productId' | 'sku' | 'locationId' | 'createdAt' | 'updatedAt'>>;
type InventoryLocationCreateParams = Omit<InventoryLocation, 'id' | 'createdAt' | 'updatedAt'>;
type InventoryLocationUpdateParams = Partial<Omit<InventoryLocation, 'id' | 'createdAt' | 'updatedAt'>>;
type InventoryTransactionCreateParams = Omit<InventoryTransaction, 'id' | 'createdAt'>;
type InventoryReservationCreateParams = Omit<InventoryReservation, 'id' | 'createdAt' | 'updatedAt'>;

// Field mapping dictionaries: TypeScript camelCase -> Database snake_case
const inventoryItemFields: Record<string, string> = {
  id: 'id',
  productId: 'product_id',
  sku: 'sku',
  locationId: 'location_id',
  quantity: 'quantity',
  reservedQuantity: 'reserved_quantity',
  availableQuantity: 'available_quantity',
  lowStockThreshold: 'low_stock_threshold',
  reorderPoint: 'reorder_point',
  reorderQuantity: 'reorder_quantity',
  lastRestockDate: 'last_restock_date',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const inventoryLocationFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  type: 'type',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  postalCode: 'postal_code',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const inventoryTransactionFields: Record<string, string> = {
  id: 'id',
  inventoryId: 'inventory_id',
  transactionType: 'transaction_type',
  quantity: 'quantity',
  sourceLocationId: 'source_location_id',
  destinationLocationId: 'destination_location_id',
  reference: 'reference',
  notes: 'notes',
  createdBy: 'created_by',
  createdAt: 'created_at'
};

const inventoryReservationFields: Record<string, string> = {
  id: 'id',
  inventoryId: 'inventory_id',
  quantity: 'quantity',
  orderId: 'order_id',
  cartId: 'cart_id',
  expiresAt: 'expires_at',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

// Transformation helper functions
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T | null {
  if (!dbRecord) return null;
  
  const result: any = {};
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap)).filter(Boolean) as T[];
}

function generateSelectFields(fieldMap: Record<string, string>): string {
  return Object.entries(fieldMap)
    .map(([tsKey, dbKey]) => `"${dbKey}" AS "${tsKey}"`)
    .join(', ');
}

function tsToDbField(tsKey: string, fieldMap: Record<string, string>): string {
  return fieldMap[tsKey] || tsKey;
}

export class InventoryRepo {
  // =============== Inventory Item Methods ===============
  
  async findInventoryItemById(id: string): Promise<InventoryItem | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" WHERE "id" = $1`,
      [id]
    );
    return transformDbToTs<InventoryItem>(result, inventoryItemFields);
  }

  async findInventoryItemBySku(sku: string, locationId?: string): Promise<InventoryItem | null> {
    let sql = `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" WHERE "sku" = $1`;
    const params: any[] = [sku];
    
    if (locationId) {
      sql += ' AND "location_id" = $2';
      params.push(locationId);
    }
    
    const result = await queryOne<Record<string, any>>(sql, params);
    return transformDbToTs<InventoryItem>(result, inventoryItemFields);
  }

  async findInventoryItemsByProductId(productId: string): Promise<InventoryItem[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" WHERE "productId" = $1`,
      [productId]
    );
    return transformArrayDbToTs<InventoryItem>(results || [], inventoryItemFields);
  }

  async findInventoryItemsByLocationId(locationId: string): Promise<InventoryItem[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" WHERE "location_id" = $1`,
      [locationId]
    );
    return transformArrayDbToTs<InventoryItem>(results || [], inventoryItemFields);
  }

  async findLowStockItems(): Promise<InventoryItem[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" 
       WHERE "available_quantity" <= "low_stock_threshold"`,
      []
    );
    return transformArrayDbToTs<InventoryItem>(results || [], inventoryItemFields);
  }

  async findOutOfStockItems(): Promise<InventoryItem[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" 
       WHERE "available_quantity" <= 0`,
      []
    );
    return transformArrayDbToTs<InventoryItem>(results || [], inventoryItemFields);
  }

  async findInventoryItems(
    limit: number = 50,
    offset: number = 0,
    filter?: {
      locationId?: string;
      lowStock?: boolean;
      outOfStock?: boolean;
    }
  ): Promise<InventoryItem[]> {
    let sql = `SELECT ${generateSelectFields(inventoryItemFields)} FROM "public"."inventory_item" WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filter?.locationId) {
      sql += ` AND "location_id" = $${paramIndex}`;
      params.push(filter.locationId);
      paramIndex++;
    }
    
    if (filter?.lowStock) {
      sql += ` AND "available_quantity" <= "low_stock_threshold"`;
    }
    
    if (filter?.outOfStock) {
      sql += ` AND "available_quantity" <= 0`;
    }
    
    sql += ' ORDER BY "updatedAt" DESC';
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const results = await query<Record<string, any>[]>(sql, params);
    return transformArrayDbToTs<InventoryItem>(results || [], inventoryItemFields);
  }

  async createInventoryItem(params: InventoryItemCreateParams): Promise<InventoryItem> {
    const now = unixTimestamp();
    
    // Check if item already exists
    const existingItem = await this.findInventoryItemBySku(params.sku, params.locationId);
    if (existingItem) {
      throw new Error(`Inventory item with SKU ${params.sku} already exists at location ${params.locationId}`);
    }

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."inventory_item" 
      ("productId", "sku", "location_id", "quantity", "reserved_quantity", "available_quantity", 
      "low_stock_threshold", "reorder_point", "reorder_quantity", "last_restock_date", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING ${generateSelectFields(inventoryItemFields)}`,
      [
        params.productId,
        params.sku,
        params.locationId,
        params.quantity,
        params.reservedQuantity,
        params.availableQuantity,
        params.lowStockThreshold,
        params.reorderPoint,
        params.reorderQuantity,
        params.lastRestockDate,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory item');
    }

    return transformDbToTs<InventoryItem>(result, inventoryItemFields)!;
  }

  async updateInventoryItem(id: string, params: InventoryItemUpdateParams): Promise<InventoryItem> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = tsToDbField(key, inventoryItemFields);
        updateFields.push(`"${dbField}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;
    values.push(id);

    const sql = `
      UPDATE "public"."inventory_item" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING ${generateSelectFields(inventoryItemFields)}
    `;

    const result = await queryOne<Record<string, any>>(sql, values);
    if (!result) {
      throw new Error(`Failed to update inventory item with ID ${id}`);
    }

    return transformDbToTs<InventoryItem>(result, inventoryItemFields)!;
  }

  // =============== Inventory Location Methods ===============
  
  async findLocationById(id: string): Promise<InventoryLocation | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields(inventoryLocationFields)} FROM "public"."inventory_location" WHERE "id" = $1`,
      [id]
    );
    return transformDbToTs<InventoryLocation>(result, inventoryLocationFields);
  }

  async findAllLocations(): Promise<InventoryLocation[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryLocationFields)} FROM "public"."inventory_location" 
       ORDER BY "name" ASC`,
      []
    );
    return transformArrayDbToTs<InventoryLocation>(results || [], inventoryLocationFields);
  }

  async findActiveLocations(): Promise<InventoryLocation[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryLocationFields)} FROM "public"."inventory_location" 
       WHERE "isActive" = true ORDER BY "name" ASC`,
      []
    );
    return transformArrayDbToTs<InventoryLocation>(results || [], inventoryLocationFields);
  }

  async createLocation(params: InventoryLocationCreateParams): Promise<InventoryLocation> {
    const now = unixTimestamp();

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."inventory_location" 
      ("name", "type", "address", "city", "state", "country", "postalCode", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING ${generateSelectFields(inventoryLocationFields)}`,
      [
        params.name,
        params.type,
        params.address || null,
        params.city || null,
        params.state || null,
        params.country || null,
        params.postalCode || null,
        params.isActive,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory location');
    }

    return transformDbToTs<InventoryLocation>(result, inventoryLocationFields)!;
  }

  // =============== Inventory Transaction Methods ===============
  
  async findTransactionById(id: string): Promise<InventoryTransaction | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields(inventoryTransactionFields)} FROM "public"."inventory_transaction" WHERE "id" = $1`,
      [id]
    );
    return transformDbToTs<InventoryTransaction>(result, inventoryTransactionFields);
  }

  async findTransactionsByInventoryId(inventoryId: string): Promise<InventoryTransaction[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryTransactionFields)} FROM "public"."inventory_transaction" 
       WHERE "inventory_id" = $1 ORDER BY "createdAt" DESC`,
      [inventoryId]
    );
    return transformArrayDbToTs<InventoryTransaction>(results || [], inventoryTransactionFields);
  }

  async createTransaction(params: InventoryTransactionCreateParams): Promise<InventoryTransaction> {
    const now = unixTimestamp();

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."inventory_transaction" 
      ("inventory_id", "transaction_type", "quantity", "source_location_id", "destination_location_id", 
       "reference", "notes", "created_by", "createdAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING ${generateSelectFields(inventoryTransactionFields)}`,
      [
        params.inventoryId,
        params.transactionType,
        params.quantity,
        params.sourceLocationId || null,
        params.destinationLocationId || null,
        params.reference || null,
        params.notes || null,
        params.createdBy,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory transaction');
    }

    return transformDbToTs<InventoryTransaction>(result, inventoryTransactionFields)!;
  }

  // =============== Inventory Reservation Methods ===============
  
  async findReservationById(id: string): Promise<InventoryReservation | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields(inventoryReservationFields)} FROM "public"."inventory_reservation" WHERE "id" = $1`,
      [id]
    );
    return transformDbToTs<InventoryReservation>(result, inventoryReservationFields);
  }

  async findActiveReservationsByInventoryId(inventoryId: string): Promise<InventoryReservation[]> {
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields(inventoryReservationFields)} FROM "public"."inventory_reservation" 
       WHERE "inventory_id" = $1 AND "status" = 'active'`,
      [inventoryId]
    );
    return transformArrayDbToTs<InventoryReservation>(results || [], inventoryReservationFields);
  }

  async createReservation(params: InventoryReservationCreateParams): Promise<InventoryReservation> {
    const now = unixTimestamp();

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."inventory_reservation" 
      ("inventory_id", "quantity", "orderId", "cart_id", "expiresAt", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, 'active', $6, $7) 
      RETURNING ${generateSelectFields(inventoryReservationFields)}`,
      [
        params.inventoryId,
        params.quantity,
        params.orderId || null,
        params.cartId || null,
        params.expiresAt,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory reservation');
    }

    return transformDbToTs<InventoryReservation>(result, inventoryReservationFields)!;
  }

  async updateReservationStatus(id: string, status: 'active' | 'fulfilled' | 'expired' | 'cancelled'): Promise<InventoryReservation> {
    const now = unixTimestamp();

    const result = await queryOne<Record<string, any>>(
      `UPDATE "public"."inventory_reservation" 
       SET "status" = $1, "updatedAt" = $2 
       WHERE "id" = $3 
       RETURNING ${generateSelectFields(inventoryReservationFields)}`,
      [status, now, id]
    );

    if (!result) {
      throw new Error(`Failed to update reservation ${id}`);
    }

    return transformDbToTs<InventoryReservation>(result, inventoryReservationFields)!;
  }
}

export default new InventoryRepo();
