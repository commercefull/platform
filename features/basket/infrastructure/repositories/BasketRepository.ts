/**
 * Basket Repository Implementation
 * PostgreSQL implementation of the basket repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket, BasketStatus } from '../../domain/entities/Basket';
import { BasketItem } from '../../domain/entities/BasketItem';
import { Money } from '../../domain/valueObjects/Money';

// Note: Using camelCase column names to match database migrations

export class BasketRepo implements BasketRepository {
  
  async findById(basketId: string): Promise<Basket | null> {
    const basketRow = await queryOne<Record<string, any>>(
      'SELECT * FROM basket WHERE "basketId" = $1',
      [basketId]
    );

    if (!basketRow) return null;

    const items = await this.getItemsWithCurrency(basketId, basketRow.currency);
    return this.mapToBasket(basketRow, items);
  }

  async findByCustomerId(customerId: string): Promise<Basket | null> {
    const basketRow = await queryOne<Record<string, any>>(
      'SELECT * FROM basket WHERE "customerId" = $1 AND status = \'active\' ORDER BY "updatedAt" DESC LIMIT 1',
      [customerId]
    );

    if (!basketRow) return null;

    const items = await this.getItemsWithCurrency(basketRow.basketId, basketRow.currency);
    return this.mapToBasket(basketRow, items);
  }

  async findBySessionId(sessionId: string): Promise<Basket | null> {
    const basketRow = await queryOne<Record<string, any>>(
      'SELECT * FROM basket WHERE "sessionId" = $1 AND status = \'active\' ORDER BY "updatedAt" DESC LIMIT 1',
      [sessionId]
    );

    if (!basketRow) return null;

    const items = await this.getItemsWithCurrency(basketRow.basketId, basketRow.currency);
    return this.mapToBasket(basketRow, items);
  }

  async findActiveBasket(customerId?: string, sessionId?: string): Promise<Basket | null> {
    // Try customer basket first
    if (customerId) {
      const basket = await this.findByCustomerId(customerId);
      if (basket) return basket;
    }

    // Fall back to session basket
    if (sessionId) {
      return this.findBySessionId(sessionId);
    }

    return null;
  }

  async save(basket: Basket): Promise<Basket> {
    const now = new Date().toISOString();
    
    // Check if basket exists
    const existing = await queryOne<Record<string, any>>(
      'SELECT "basketId" FROM basket WHERE "basketId" = $1',
      [basket.basketId]
    );

    if (existing) {
      // Update
      await query(
        `UPDATE basket SET
          "customerId" = $1,
          "sessionId" = $2,
          status = $3,
          currency = $4,
          metadata = $5,
          "expiresAt" = $6,
          "convertedToOrderId" = $7,
          "updatedAt" = $8,
          "lastActivityAt" = $9
        WHERE "basketId" = $10`,
        [
          basket.customerId || null,
          basket.sessionId || null,
          basket.status,
          basket.currency,
          basket.metadata ? JSON.stringify(basket.metadata) : null,
          basket.expiresAt?.toISOString() || null,
          basket.convertedToOrderId || null,
          now,
          basket.lastActivityAt.toISOString(),
          basket.basketId
        ]
      );
    } else {
      // Insert
      await query(
        `INSERT INTO basket (
          "basketId", "customerId", "sessionId", status, currency,
          metadata, "expiresAt", "convertedToOrderId",
          "createdAt", "updatedAt", "lastActivityAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          basket.basketId,
          basket.customerId || null,
          basket.sessionId || null,
          basket.status,
          basket.currency,
          basket.metadata ? JSON.stringify(basket.metadata) : null,
          basket.expiresAt?.toISOString() || null,
          basket.convertedToOrderId || null,
          now,
          now,
          now
        ]
      );
    }

    // Sync items
    await this.syncItems(basket);

    return basket;
  }

  async delete(basketId: string): Promise<void> {
    // Clear related records first to avoid foreign key violations
    await this.clearItems(basketId);
    
    // Clear analytics events referencing this basket (may not exist in all environments)
    try {
      await query('DELETE FROM "analyticsReportEvent" WHERE "basketId" = $1', [basketId]);
    } catch (e) {
      // Table may not exist
    }
    
    // Clear basket analytics (may not exist in all environments)
    try {
      await query('DELETE FROM "basketAnalytics" WHERE "basketId" = $1', [basketId]);
    } catch (e) {
      // Table may not exist
    }
    
    // Clear basket history
    try {
      await query('DELETE FROM "basketHistory" WHERE "basketId" = $1', [basketId]);
    } catch (e) {
      // Table may not exist
    }
    
    // Clear basket discounts
    try {
      await query('DELETE FROM "basketDiscount" WHERE "basketId" = $1', [basketId]);
    } catch (e) {
      // Table may not exist
    }
    
    // Clear basket merge records (both source and target)
    try {
      await query('DELETE FROM "basketMerge" WHERE "sourceBasketId" = $1 OR "targetBasketId" = $1', [basketId]);
    } catch (e) {
      // Table may not exist
    }
    
    // Finally delete the basket
    await query('DELETE FROM basket WHERE "basketId" = $1', [basketId]);
  }

  async addItem(basketId: string, item: BasketItem): Promise<BasketItem> {
    const now = new Date().toISOString();
    const itemId = item.basketItemId || generateUUID();
    const totalPrice = item.unitPrice.amount * item.quantity;
    const discountAmount = 0;
    const taxAmount = 0;
    const finalPrice = totalPrice - discountAmount + taxAmount;

    await query(
      `INSERT INTO "basketItem" (
        "basketItemId", "basketId", "productId", "productVariantId",
        sku, name, quantity, "unitPrice", "totalPrice", "discountAmount",
        "taxAmount", "finalPrice", "imageUrl", attributes,
        "itemType", "isGift", "giftMessage", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        itemId,
        basketId,
        item.productId,
        item.productVariantId || null,
        item.sku,
        item.name,
        item.quantity,
        item.unitPrice.amount,
        totalPrice,
        discountAmount,
        taxAmount,
        finalPrice,
        item.imageUrl || null,
        item.attributes ? JSON.stringify(item.attributes) : null,
        item.itemType,
        item.isGift,
        item.giftMessage || null,
        now,
        now
      ]
    );

    // Update basket last activity
    await query(
      'UPDATE basket SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "basketId" = $2',
      [now, basketId]
    );

    return item;
  }

  async updateItem(item: BasketItem): Promise<BasketItem> {
    const now = new Date().toISOString();

    await query(
      `UPDATE "basketItem" SET
        quantity = $1,
        "unitPrice" = $2,
        attributes = $3,
        "isGift" = $4,
        "giftMessage" = $5,
        "updatedAt" = $6
      WHERE "basketItemId" = $7`,
      [
        item.quantity,
        item.unitPrice.amount,
        item.attributes ? JSON.stringify(item.attributes) : null,
        item.isGift,
        item.giftMessage || null,
        now,
        item.basketItemId
      ]
    );

    // Update basket last activity
    await query(
      'UPDATE basket SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "basketId" = $2',
      [now, item.basketId]
    );

    return item;
  }

  async removeItem(basketItemId: string): Promise<void> {
    const now = new Date().toISOString();

    // Get basket ID before deleting
    const item = await queryOne<Record<string, any>>(
      'SELECT "basketId" FROM "basketItem" WHERE "basketItemId" = $1',
      [basketItemId]
    );

    await query('DELETE FROM "basketItem" WHERE "basketItemId" = $1', [basketItemId]);

    if (item) {
      await query(
        'UPDATE basket SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE "basketId" = $2',
        [now, item.basketId]
      );
    }
  }

  async getItems(basketId: string): Promise<BasketItem[]> {
    return this.getItemsWithCurrency(basketId, 'USD');
  }

  private async getItemsWithCurrency(basketId: string, currency: string): Promise<BasketItem[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "basketItem" WHERE "basketId" = $1 ORDER BY "createdAt" ASC',
      [basketId]
    );

    return (rows || []).map(row => this.mapToBasketItem(row, basketId, currency));
  }

  async clearItems(basketId: string): Promise<void> {
    await query('DELETE FROM "basketItem" WHERE "basketId" = $1', [basketId]);
  }

  async findAbandonedBaskets(olderThanDays: number): Promise<Basket[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM basket 
       WHERE status = 'active' 
       AND "lastActivityAt" < $1 
       ORDER BY "lastActivityAt" ASC`,
      [cutoffDate.toISOString()]
    );

    const baskets: Basket[] = [];
    for (const row of rows || []) {
      const items = await this.getItemsWithCurrency(row.basketId, row.currency);
      baskets.push(this.mapToBasket(row, items));
    }

    return baskets;
  }

  async findExpiredBaskets(): Promise<Basket[]> {
    const now = new Date().toISOString();

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM basket 
       WHERE status = 'active' 
       AND "expiresAt" < $1 
       ORDER BY "expiresAt" ASC`,
      [now]
    );

    const baskets: Basket[] = [];
    for (const row of rows || []) {
      const items = await this.getItemsWithCurrency(row.basketId, row.currency);
      baskets.push(this.mapToBasket(row, items));
    }

    return baskets;
  }

  async markAsAbandoned(basketId: string): Promise<void> {
    await query(
      'UPDATE basket SET status = \'abandoned\', "updatedAt" = $1 WHERE "basketId" = $2',
      [new Date().toISOString(), basketId]
    );
  }

  async mergeBaskets(sessionBasketId: string, customerBasketId: string): Promise<Basket> {
    const sessionBasket = await this.findById(sessionBasketId);
    const customerBasket = await this.findById(customerBasketId);

    if (!sessionBasket || !customerBasket) {
      throw new Error('One or both baskets not found');
    }

    // Add session basket items to customer basket
    for (const item of sessionBasket.items) {
      customerBasket.addItem(item);
    }

    // Save merged basket
    await this.save(customerBasket);

    // Mark session basket as merged
    await query(
      'UPDATE basket SET status = \'merged\', "updatedAt" = $1 WHERE "basketId" = $2',
      [new Date().toISOString(), sessionBasketId]
    );

    return customerBasket;
  }

  // Private helper methods
  private async syncItems(basket: Basket): Promise<void> {
    // Get current items in DB
    const existingItems = await query<Record<string, any>[]>(
      'SELECT "basketItemId" FROM "basketItem" WHERE "basketId" = $1',
      [basket.basketId]
    );
    const existingIds = new Set((existingItems || []).map(i => i.basketItemId));

    // Track items to keep
    const itemsToKeep = new Set<string>();

    for (const item of basket.items) {
      if (existingIds.has(item.basketItemId)) {
        // Update existing
        await this.updateItem(item);
        itemsToKeep.add(item.basketItemId);
      } else {
        // Add new
        await this.addItem(basket.basketId, item);
        itemsToKeep.add(item.basketItemId);
      }
    }

    // Remove items no longer in basket
    Array.from(existingIds).forEach(async (id) => {
      if (!itemsToKeep.has(id)) {
        await this.removeItem(id);
      }
    });
  }

  private mapToBasket(row: Record<string, any>, items: BasketItem[]): Basket {
    return Basket.reconstitute({
      basketId: row.basketId,
      customerId: row.customerId || undefined,
      sessionId: row.sessionId || undefined,
      status: row.status as BasketStatus,
      currency: row.currency,
      items,
      metadata: row.metadata || undefined,
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      convertedToOrderId: row.convertedToOrderId || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastActivityAt: new Date(row.lastActivityAt)
    });
  }

  private mapToBasketItem(row: Record<string, any>, basketId: string, currency: string = 'USD'): BasketItem {
    return BasketItem.reconstitute({
      basketItemId: row.basketItemId,
      basketId: basketId,
      productId: row.productId,
      productVariantId: row.productVariantId || undefined,
      sku: row.sku,
      name: row.name,
      quantity: Number(row.quantity),
      unitPrice: Money.create(Number(row.unitPrice), currency),
      imageUrl: row.imageUrl || undefined,
      attributes: row.attributes || undefined,
      itemType: row.itemType || 'physical',
      isGift: Boolean(row.isGift),
      giftMessage: row.giftMessage || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

// Export singleton instance
export default new BasketRepo();
