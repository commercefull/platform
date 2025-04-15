import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

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
  reference?: string;  // Order ID, Return ID, etc.
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

export class InventoryRepo {
  // Inventory Item Methods
  async findInventoryItemById(id: string): Promise<InventoryItem | null> {
    return await queryOne<InventoryItem>('SELECT * FROM "public"."inventory_item" WHERE "id" = $1', [id]);
  }

  async findInventoryItemBySku(sku: string, locationId?: string): Promise<InventoryItem | null> {
    let sql = 'SELECT * FROM "public"."inventory_item" WHERE "sku" = $1';
    const params: any[] = [sku];
    
    if (locationId) {
      sql += ' AND "location_id" = $2';
      params.push(locationId);
    }
    
    return await queryOne<InventoryItem>(sql, params);
  }

  async findInventoryItemsByProductId(productId: string): Promise<InventoryItem[]> {
    const results = await query<InventoryItem[]>(
      'SELECT * FROM "public"."inventory_item" WHERE "product_id" = $1',
      [productId]
    );
    return results || [];
  }

  async findInventoryItemsByLocationId(locationId: string): Promise<InventoryItem[]> {
    const results = await query<InventoryItem[]>(
      'SELECT * FROM "public"."inventory_item" WHERE "location_id" = $1',
      [locationId]
    );
    return results || [];
  }

  async findLowStockItems(): Promise<InventoryItem[]> {
    const results = await query<InventoryItem[]>(
      'SELECT * FROM "public"."inventory_item" WHERE "available_quantity" <= "low_stock_threshold"',
      []
    );
    return results || [];
  }

  async findOutOfStockItems(): Promise<InventoryItem[]> {
    const results = await query<InventoryItem[]>(
      'SELECT * FROM "public"."inventory_item" WHERE "available_quantity" <= 0',
      []
    );
    return results || [];
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
    let sql = 'SELECT * FROM "public"."inventory_item" WHERE 1=1';
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
    
    sql += ' ORDER BY "updated_at" DESC';
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit.toString(), offset.toString());
    
    const results = await query<InventoryItem[]>(sql, params);
    return results || [];
  }

  async createInventoryItem(params: InventoryItemCreateParams): Promise<InventoryItem> {
    const now = unixTimestamp();
    const {
      productId,
      sku,
      locationId,
      quantity,
      reservedQuantity,
      availableQuantity,
      lowStockThreshold,
      reorderPoint,
      reorderQuantity,
      lastRestockDate
    } = params;

    // Check if item with same SKU and location already exists
    const existingItem = await this.findInventoryItemBySku(sku, locationId);
    if (existingItem) {
      throw new Error(`Inventory item with SKU ${sku} already exists at location ${locationId}`);
    }

    const result = await queryOne<InventoryItem>(
      `INSERT INTO "public"."inventory_item" 
      ("product_id", "sku", "location_id", "quantity", "reserved_quantity", "available_quantity", 
      "low_stock_threshold", "reorder_point", "reorder_quantity", "last_restock_date", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        productId,
        sku,
        locationId,
        quantity,
        reservedQuantity,
        availableQuantity,
        lowStockThreshold,
        reorderPoint,
        reorderQuantity,
        lastRestockDate,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory item');
    }

    return result;
  }

  async updateInventoryItem(id: string, params: InventoryItemUpdateParams): Promise<InventoryItem> {
    const now = unixTimestamp();
    const currentItem = await this.findInventoryItemById(id);
    
    if (!currentItem) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updated_at" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."inventory_item" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<InventoryItem>(sql, values);

    if (!result) {
      throw new Error(`Failed to update inventory item with ID ${id}`);
    }

    return result;
  }

  async updateInventoryQuantity(
    id: string, 
    quantityChange: number, 
    reservedQuantityChange: number = 0
  ): Promise<InventoryItem> {
    const currentItem = await this.findInventoryItemById(id);
    
    if (!currentItem) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    const now = unixTimestamp();
    const newQuantity = Math.max(0, currentItem.quantity + quantityChange);
    const newReservedQuantity = Math.max(0, currentItem.reservedQuantity + reservedQuantityChange);
    const newAvailableQuantity = Math.max(0, newQuantity - newReservedQuantity);

    const result = await queryOne<InventoryItem>(
      `UPDATE "public"."inventory_item" 
      SET "quantity" = $1, "reserved_quantity" = $2, "available_quantity" = $3, "updated_at" = $4 
      WHERE "id" = $5 
      RETURNING *`,
      [newQuantity, newReservedQuantity, newAvailableQuantity, now, id]
    );

    if (!result) {
      throw new Error(`Failed to update inventory quantity for item with ID ${id}`);
    }

    return result;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."inventory_item" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Inventory Location Methods
  async findLocationById(id: string): Promise<InventoryLocation | null> {
    return await queryOne<InventoryLocation>('SELECT * FROM "public"."inventory_location" WHERE "id" = $1', [id]);
  }

  async findAllLocations(includeInactive: boolean = false): Promise<InventoryLocation[]> {
    let sql = 'SELECT * FROM "public"."inventory_location"';
    
    if (!includeInactive) {
      sql += ' WHERE "is_active" = true';
    }
    
    sql += ' ORDER BY "name" ASC';
    
    const results = await query<InventoryLocation[]>(sql, []);
    return results || [];
  }

  async createLocation(params: InventoryLocationCreateParams): Promise<InventoryLocation> {
    const now = unixTimestamp();
    const {
      name,
      type,
      address,
      city,
      state,
      country,
      postalCode,
      isActive
    } = params;

    const result = await queryOne<InventoryLocation>(
      `INSERT INTO "public"."inventory_location" 
      ("name", "type", "address", "city", "state", "country", "postal_code", "is_active", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        name,
        type,
        address || null,
        city || null,
        state || null,
        country || null,
        postalCode || null,
        isActive,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory location');
    }

    return result;
  }

  async updateLocation(id: string, params: InventoryLocationUpdateParams): Promise<InventoryLocation> {
    const now = unixTimestamp();
    const currentLocation = await this.findLocationById(id);
    
    if (!currentLocation) {
      throw new Error(`Inventory location with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updated_at" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."inventory_location" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, values);

    if (!result) {
      throw new Error(`Failed to update inventory location with ID ${id}`);
    }

    return result;
  }

  async deleteLocation(id: string): Promise<boolean> {
    // Check if any inventory items are associated with this location
    const inventoryItems = await this.findInventoryItemsByLocationId(id);
    if (inventoryItems.length > 0) {
      throw new Error(`Cannot delete location with ID ${id} as it has associated inventory items`);
    }

    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."inventory_location" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Inventory Transaction Methods
  async createTransaction(params: InventoryTransactionCreateParams): Promise<InventoryTransaction> {
    const now = unixTimestamp();
    const {
      inventoryId,
      transactionType,
      quantity,
      sourceLocationId,
      destinationLocationId,
      reference,
      notes,
      createdBy
    } = params;

    // Verify inventory item exists
    const inventoryItem = await this.findInventoryItemById(inventoryId);
    if (!inventoryItem) {
      throw new Error(`Inventory item with ID ${inventoryId} not found`);
    }

    // Create transaction
    const result = await queryOne<InventoryTransaction>(
      `INSERT INTO "public"."inventory_transaction" 
      ("inventory_id", "transaction_type", "quantity", "source_location_id", "destination_location_id", 
      "reference", "notes", "created_by", "created_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        inventoryId,
        transactionType,
        quantity,
        sourceLocationId || null,
        destinationLocationId || null,
        reference || null,
        notes || null,
        createdBy,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory transaction');
    }

    // Update inventory quantities based on transaction type
    let quantityChange = 0;
    let reservedQuantityChange = 0;

    switch (transactionType) {
      case 'restock':
        quantityChange = quantity;
        break;
      case 'sale':
        quantityChange = -quantity;
        reservedQuantityChange = -quantity; // Release reservation
        break;
      case 'return':
        quantityChange = quantity;
        break;
      case 'adjustment':
        quantityChange = quantity; // Can be positive or negative
        break;
      case 'reservation':
        reservedQuantityChange = quantity;
        break;
      case 'release':
        reservedQuantityChange = -quantity;
        break;
      case 'transfer':
        // For transfer, we should handle source and destination separately
        if (sourceLocationId) {
          // Reduce quantity at source
          await this.updateInventoryQuantity(inventoryId, -quantity);
        }
        if (destinationLocationId) {
          // Increase quantity at destination (would need to find the inventory ID at destination)
          // This is simplified and might need to be handled differently in a real system
        }
        break;
    }

    // Update inventory quantities if not a transfer (transfers handled separately)
    if (transactionType !== 'transfer') {
      await this.updateInventoryQuantity(inventoryId, quantityChange, reservedQuantityChange);
    }

    return result;
  }

  async findTransactionsByInventoryId(inventoryId: string): Promise<InventoryTransaction[]> {
    const results = await query<InventoryTransaction[]>(
      'SELECT * FROM "public"."inventory_transaction" WHERE "inventory_id" = $1 ORDER BY "created_at" DESC',
      [inventoryId]
    );
    return results || [];
  }

  async findTransactionsByReference(reference: string): Promise<InventoryTransaction[]> {
    const results = await query<InventoryTransaction[]>(
      'SELECT * FROM "public"."inventory_transaction" WHERE "reference" = $1 ORDER BY "created_at" DESC',
      [reference]
    );
    return results || [];
  }

  // Inventory Reservation Methods
  async createReservation(params: InventoryReservationCreateParams): Promise<InventoryReservation> {
    const now = unixTimestamp();
    const {
      inventoryId,
      quantity,
      orderId,
      cartId,
      expiresAt,
      status
    } = params;

    // Verify inventory item exists and has enough available quantity
    const inventoryItem = await this.findInventoryItemById(inventoryId);
    if (!inventoryItem) {
      throw new Error(`Inventory item with ID ${inventoryId} not found`);
    }

    if (inventoryItem.availableQuantity < quantity) {
      throw new Error(`Not enough available inventory for item with ID ${inventoryId}`);
    }

    // Create reservation
    const result = await queryOne<InventoryReservation>(
      `INSERT INTO "public"."inventory_reservation" 
      ("inventory_id", "quantity", "order_id", "cart_id", "expires_at", "status", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        inventoryId,
        quantity,
        orderId || null,
        cartId || null,
        expiresAt,
        status,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create inventory reservation');
    }

    // Update reserved quantity in inventory
    await this.createTransaction({
      inventoryId,
      transactionType: 'reservation',
      quantity,
      reference: result.id,
      createdBy: 'system'
    });

    return result;
  }

  async findReservationById(id: string): Promise<InventoryReservation | null> {
    return await queryOne<InventoryReservation>('SELECT * FROM "public"."inventory_reservation" WHERE "id" = $1', [id]);
  }

  async findReservationsByInventoryId(inventoryId: string): Promise<InventoryReservation[]> {
    const results = await query<InventoryReservation[]>(
      'SELECT * FROM "public"."inventory_reservation" WHERE "inventory_id" = $1 AND "status" = \'active\' ORDER BY "created_at" DESC',
      [inventoryId]
    );
    return results || [];
  }

  async findReservationsByOrderId(orderId: string): Promise<InventoryReservation[]> {
    const results = await query<InventoryReservation[]>(
      'SELECT * FROM "public"."inventory_reservation" WHERE "order_id" = $1 ORDER BY "created_at" DESC',
      [orderId]
    );
    return results || [];
  }

  async findReservationsByCartId(cartId: string): Promise<InventoryReservation[]> {
    const results = await query<InventoryReservation[]>(
      'SELECT * FROM "public"."inventory_reservation" WHERE "cart_id" = $1 AND "status" = \'active\' ORDER BY "created_at" DESC',
      [cartId]
    );
    return results || [];
  }

  async updateReservationStatus(id: string, status: InventoryReservation['status']): Promise<InventoryReservation> {
    const now = unixTimestamp();
    const currentReservation = await this.findReservationById(id);
    
    if (!currentReservation) {
      throw new Error(`Inventory reservation with ID ${id} not found`);
    }

    // Only allow specific status transitions
    if (currentReservation.status === 'active' && 
        (status === 'fulfilled' || status === 'expired' || status === 'cancelled')) {
      
      const result = await queryOne<InventoryReservation>(
        `UPDATE "public"."inventory_reservation" 
        SET "status" = $1, "updated_at" = $2
        WHERE "id" = $3 
        RETURNING *`,
        [status, now, id]
      );

      if (!result) {
        throw new Error(`Failed to update reservation status for ID ${id}`);
      }

      // If cancelling or expiring, release the reserved quantity
      if (status === 'cancelled' || status === 'expired') {
        await this.createTransaction({
          inventoryId: currentReservation.inventoryId,
          transactionType: 'release',
          quantity: currentReservation.quantity,
          reference: id,
          createdBy: 'system'
        });
      }

      return result;
    } else {
      throw new Error(`Invalid status transition from ${currentReservation.status} to ${status}`);
    }
  }

  // Helper Methods
  async updateProductAvailability(productId: string): Promise<{ totalQuantity: number, totalAvailable: number }> {
    const inventoryItems = await this.findInventoryItemsByProductId(productId);
    
    let totalQuantity = 0;
    let totalAvailable = 0;
    
    inventoryItems.forEach(item => {
      totalQuantity += item.quantity;
      totalAvailable += item.availableQuantity;
    });
    
    return { totalQuantity, totalAvailable };
  }

  async checkProductAvailability(productId: string, quantityNeeded: number): Promise<boolean> {
    const { totalAvailable } = await this.updateProductAvailability(productId);
    return totalAvailable >= quantityNeeded;
  }
}
