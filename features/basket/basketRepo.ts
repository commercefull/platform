import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../libs/db';
import { unixTimestamp } from '../../libs/date';

// Core data models
export type BasketStatus = 'active' | 'merged' | 'converted' | 'abandoned';

export interface BasketItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  sku: string;
  imageUrl?: string;
  attributes?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface Basket {
  id: string;
  customerId?: string;
  sessionId?: string;
  items: BasketItem[];
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  metadata?: Record<string, any>;
  status: BasketStatus;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface QueryResult {
  affectedRows?: number;
  insertId?: string | number;
  results?: any[];
  [key: string]: any;
}

export class BasketRepo {
  // Create a new basket
  async createBasket(customerId?: string, sessionId?: string): Promise<Basket> {
    const now = Math.floor(Date.now() / 1000);
    
    const basket: Basket = {
      id: uuidv4(),
      customerId,
      sessionId,
      items: [],
      totalQuantity: 0,
      subtotal: 0,
      discountAmount: 0,
      totalAmount: 0,
      status: 'active',
      expiresAt: now + (7 * 24 * 60 * 60), // 7 days from now
      createdAt: now,
      updatedAt: now
    };
    
    // Insert into database
    const result = await query(
      `INSERT INTO baskets (
        id, customer_id, session_id, total_quantity, subtotal, 
        discount_amount, total_amount, status, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        basket.id, 
        basket.customerId || null, 
        basket.sessionId || null, 
        basket.totalQuantity, 
        basket.subtotal, 
        basket.discountAmount, 
        basket.totalAmount, 
        basket.status, 
        basket.expiresAt, 
        basket.createdAt, 
        basket.updatedAt
      ]
    ) as QueryResult;
    
    return basket;
  }
  
  // Get basket by ID
  async getBasketById(basketId: string): Promise<Basket | null> {
    const result = await queryOne<any>(
      `SELECT
        id, customer_id as customerId, session_id as sessionId, 
        items, total_quantity as totalQuantity, subtotal, 
        discount_amount as discountAmount, total_amount as totalAmount, 
        metadata, status, expires_at as expiresAt, 
        created_at as createdAt, updated_at as updatedAt
      FROM baskets
      WHERE id = ? AND status = 'active'`,
      [basketId]
    );
    
    if (!result) return null;
    
    // Parse JSON fields
    return {
      ...result,
      items: JSON.parse(result.items || '[]'),
      totalQuantity: Number(result.totalQuantity),
      subtotal: Number(result.subtotal),
      discountAmount: Number(result.discountAmount),
      totalAmount: Number(result.totalAmount),
      expiresAt: result.expiresAt ? Number(result.expiresAt) : undefined,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }
  
  // Get a customer's active basket
  async getCustomerBasket(customerId: string): Promise<Basket | null> {
    const result = await queryOne<any>(
      `SELECT
        id, customer_id as customerId, session_id as sessionId, 
        items, total_quantity as totalQuantity, subtotal, 
        discount_amount as discountAmount, total_amount as totalAmount, 
        metadata, status, expires_at as expiresAt, 
        created_at as createdAt, updated_at as updatedAt
      FROM baskets
      WHERE customer_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1`,
      [customerId]
    );
    
    if (!result) return null;
    
    // Parse JSON fields
    return {
      ...result,
      items: JSON.parse(result.items || '[]'),
      totalQuantity: Number(result.totalQuantity),
      subtotal: Number(result.subtotal),
      discountAmount: Number(result.discountAmount),
      totalAmount: Number(result.totalAmount),
      expiresAt: result.expiresAt ? Number(result.expiresAt) : undefined,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }
  
  // Get a basket by session ID
  async getSessionBasket(sessionId: string): Promise<Basket | null> {
    const result = await queryOne<any>(
      `SELECT
        id, customer_id as customerId, session_id as sessionId, 
        items, total_quantity as totalQuantity, subtotal, 
        discount_amount as discountAmount, total_amount as totalAmount, 
        metadata, status, expires_at as expiresAt, 
        created_at as createdAt, updated_at as updatedAt
      FROM baskets
      WHERE session_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1`,
      [sessionId]
    );
    
    if (!result) return null;
    
    // Parse JSON fields
    return {
      ...result,
      items: JSON.parse(result.items || '[]'),
      totalQuantity: Number(result.totalQuantity),
      subtotal: Number(result.subtotal),
      discountAmount: Number(result.discountAmount),
      totalAmount: Number(result.totalAmount),
      expiresAt: result.expiresAt ? Number(result.expiresAt) : undefined,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }
  
  // Find a user's basket by customerId
  async findUserBasket(customerId: string): Promise<Basket | null> {
    return this.getCustomerBasket(customerId);
  }
  
  // Delete a basket by its ID
  async deleteBasketById(id: string): Promise<boolean> {
    // First delete associated items
    await query("DELETE FROM basket_items WHERE basket_id = ?", [id]);
    
    // Then delete the basket
    const result = await query(
      "DELETE FROM baskets WHERE id = ?",
      [id]
    ) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }
  
  // Add item to basket
  async addItemToBasket(basketId: string, item: Omit<BasketItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<BasketItem> {
    const basket = await this.getBasketById(basketId);
    if (!basket) {
      throw new Error(`Basket not found: ${basketId}`);
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check if product already exists in basket
    const existingItemIndex = basket.items.findIndex(
      i => i.productId === item.productId && 
           (item.variantId ? i.variantId === item.variantId : !i.variantId)
    );
    
    let updatedItem: BasketItem;
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = basket.items[existingItemIndex];
      updatedItem = {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
        price: item.price, // Use the new price in case it changed
        updatedAt: now
      };
      basket.items[existingItemIndex] = updatedItem;
    } else {
      // Add new item
      updatedItem = {
        id: uuidv4(),
        ...item,
        createdAt: now,
        updatedAt: now
      };
      basket.items.push(updatedItem);
    }
    
    // Update basket totals
    this._recalculateBasketTotals(basket);
    
    // Update the basket in the database
    await this._updateBasket(basket);
    
    return updatedItem;
  }
  
  // Update item quantity in basket
  async updateItemQuantity(basketId: string, itemId: string, quantity: number): Promise<BasketItem | null> {
    const basket = await this.getBasketById(basketId);
    if (!basket) {
      throw new Error(`Basket not found: ${basketId}`);
    }
    
    const itemIndex = basket.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      return null;
    }
    
    // If quantity is 0 or negative, remove the item
    if (quantity <= 0) {
      return await this.removeItemFromBasket(basketId, itemId);
    }
    
    // Update the item
    const now = Math.floor(Date.now() / 1000);
    basket.items[itemIndex] = {
      ...basket.items[itemIndex],
      quantity,
      updatedAt: now
    };
    
    // Recalculate totals
    this._recalculateBasketTotals(basket);
    
    // Update the basket in the database
    await this._updateBasket(basket);
    
    return basket.items[itemIndex];
  }
  
  // Remove item from basket
  async removeItemFromBasket(basketId: string, itemId: string): Promise<BasketItem | null> {
    const basket = await this.getBasketById(basketId);
    if (!basket) {
      throw new Error(`Basket not found: ${basketId}`);
    }
    
    const itemIndex = basket.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      return null;
    }
    
    // Remove the item and store it for return
    const removedItem = basket.items[itemIndex];
    basket.items.splice(itemIndex, 1);
    
    // Recalculate totals
    this._recalculateBasketTotals(basket);
    
    // Update the basket in the database
    await this._updateBasket(basket);
    
    return removedItem;
  }
  
  // Clear all items from basket
  async clearBasket(basketId: string): Promise<boolean> {
    const basket = await this.getBasketById(basketId);
    if (!basket) {
      throw new Error(`Basket not found: ${basketId}`);
    }
    
    // Clear items and reset totals
    basket.items = [];
    basket.totalQuantity = 0;
    basket.subtotal = 0;
    basket.discountAmount = 0;
    basket.totalAmount = 0;
    basket.updatedAt = Math.floor(Date.now() / 1000);
    
    // Update the basket in the database
    await this._updateBasket(basket);
    
    return true;
  }
  
  // Apply a discount to the basket
  async applyDiscount(basketId: string, discountAmount: number): Promise<Basket | null> {
    const basket = await this.getBasketById(basketId);
    if (!basket) {
      return null;
    }
    
    basket.discountAmount = discountAmount;
    basket.totalAmount = Math.max(0, basket.subtotal - discountAmount);
    basket.updatedAt = Math.floor(Date.now() / 1000);
    
    // Update the basket in the database
    await this._updateBasket(basket);
    
    return basket;
  }
  
  // Merge anonymous basket (session) into customer basket
  async mergeBaskets(customerBasketId: string, sessionBasketId: string): Promise<Basket | null> {
    const customerBasket = await this.getBasketById(customerBasketId);
    const sessionBasket = await this.getBasketById(sessionBasketId);
    
    if (!customerBasket || !sessionBasket) {
      return null;
    }
    
    // Add session basket items to customer basket
    for (const item of sessionBasket.items) {
      await this.addItemToBasket(customerBasket.id, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        sku: item.sku,
        imageUrl: item.imageUrl,
        attributes: item.attributes
      });
    }
    
    // Mark session basket as merged
    await this._updateBasketStatus(sessionBasket.id, 'merged');
    
    // Return the updated customer basket
    return await this.getBasketById(customerBasket.id);
  }
  
  // Convert basket to order (mark as converted)
  async convertBasketToOrder(basketId: string): Promise<boolean> {
    return await this._updateBasketStatus(basketId, 'converted');
  }
  
  // Mark basket as abandoned
  async abandonBasket(basketId: string): Promise<boolean> {
    return await this._updateBasketStatus(basketId, 'abandoned');
  }
  
  // Clean up expired baskets
  async cleanupExpiredBaskets(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    const result = await query(
      `UPDATE baskets 
       SET status = 'abandoned', updated_at = ? 
       WHERE status = 'active' AND expires_at < ?`,
      [now, now]
    ) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) : 0;
  }
  
  // Update a basket's expiresAt timestamp
  async updateBasketExpiration(basketId: string, expiresAt: number): Promise<boolean> {
    const result = await query(
      "UPDATE baskets SET expires_at = ?, updated_at = ? WHERE id = ?",
      [expiresAt, Math.floor(Date.now() / 1000), basketId]
    ) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }

  // Get all baskets with pagination and filtering for admin
  async getAllBaskets(options: {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
  }): Promise<{ baskets: Basket[]; total: number }> {
    const { page, limit, status, customerId } = options;
    const offset = (page - 1) * limit;
    
    // Build the WHERE clause
    let whereClause = "";
    const whereParams: any[] = [];
    
    if (status) {
      whereClause += "status = ?";
      whereParams.push(status);
    }
    
    if (customerId) {
      if (whereClause) whereClause += " AND ";
      whereClause += "customer_id = ?";
      whereParams.push(customerId);
    }
    
    // Add the WHERE keyword if we have conditions
    if (whereClause) {
      whereClause = "WHERE " + whereClause;
    }
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM baskets ${whereClause}`;
    const countResult = await query(countQuery, whereParams) as QueryResult;
    const total = countResult.results && countResult.results[0] ? Number(countResult.results[0].total) : 0;
    
    // Get paginated results
    const basketsQuery = `
      SELECT * FROM baskets 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const basketResult = await query(
      basketsQuery, 
      [...whereParams, limit, offset]
    ) as QueryResult;
    
    // Fetch items for each basket
    const baskets = await Promise.all(
      (basketResult.results || []).map(async (basket: any) => {
        const basketObj: Basket = {
          id: basket.id,
          customerId: basket.customer_id,
          sessionId: basket.session_id,
          items: await this.getBasketItems(basket.id),
          totalQuantity: Number(basket.total_quantity),
          subtotal: Number(basket.subtotal),
          discountAmount: Number(basket.discount_amount),
          totalAmount: Number(basket.total_amount),
          status: basket.status as BasketStatus,
          expiresAt: Number(basket.expires_at),
          metadata: basket.metadata ? JSON.parse(basket.metadata) : undefined,
          createdAt: Number(basket.created_at),
          updatedAt: Number(basket.updated_at)
        };
        return basketObj;
      })
    );
    
    return { baskets, total };
  }
  
  // Count all baskets
  async countBaskets(): Promise<number> {
    const result = await query("SELECT COUNT(*) as count FROM baskets", []) as QueryResult;
    return result.results && result.results[0] ? Number(result.results[0].count) : 0;
  }
  
  // Count baskets by status
  async countBasketsByStatus(status: string): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) as count FROM baskets WHERE status = ?", 
      [status]
    ) as QueryResult;
    return result.results && result.results[0] ? Number(result.results[0].count) : 0;
  }
  
  // Get average basket value
  async getAverageBasketValue(): Promise<number> {
    const result = await query(
      "SELECT AVG(total_amount) as average FROM baskets WHERE total_amount > 0",
      []
    ) as QueryResult;
    return result.results && result.results[0] ? Number(result.results[0].average) || 0 : 0;
  }
  
  // Get popular products in baskets
  async getPopularProductsInBaskets(limit: number = 10): Promise<Array<{
    productId: string;
    name: string;
    count: number;
  }>> {
    const result = await query(`
      SELECT 
        product_id as productId, 
        name, 
        COUNT(*) as count 
      FROM basket_items 
      GROUP BY product_id 
      ORDER BY count DESC 
      LIMIT ?
    `, [limit]) as QueryResult;
    
    return (result.results || []).map((row: any) => ({
      productId: row.productId,
      name: row.name,
      count: Number(row.count)
    }));
  }
  
  // Update basket status
  async updateBasketStatus(basketId: string, status: string): Promise<Basket | null> {
    const validStatuses = ['active', 'merged', 'converted', 'abandoned'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const result = await query(
      "UPDATE baskets SET status = ?, updated_at = ? WHERE id = ?",
      [status, Math.floor(Date.now() / 1000), basketId]
    ) as QueryResult;
    
    if (!result.affectedRows || Number(result.affectedRows) === 0) {
      return null;
    }
    
    return this.getBasketById(basketId);
  }

  // Get basket items
  async getBasketItems(basketId: string): Promise<BasketItem[]> {
    const result = await query(
      `SELECT 
        id, 
        basket_id as basketId, 
        product_id as productId, 
        variant_id as variantId, 
        quantity, 
        price, 
        name, 
        sku, 
        image_url as imageUrl, 
        attributes, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM basket_items 
      WHERE basket_id = ?`,
      [basketId]
    ) as QueryResult;
    
    return (result.results || []).map((row: any) => ({
      id: row.id,
      basketId: row.basketId,
      productId: row.productId,
      variantId: row.variantId,
      quantity: Number(row.quantity),
      price: Number(row.price),
      name: row.name,
      sku: row.sku,
      imageUrl: row.imageUrl,
      attributes: row.attributes ? JSON.parse(row.attributes) : undefined,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    }));
  }

  // Private helper methods
  
  // Recalculate basket totals
  private _recalculateBasketTotals(basket: Basket): void {
    basket.totalQuantity = basket.items.reduce((sum, item) => sum + item.quantity, 0);
    basket.subtotal = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    basket.totalAmount = Math.max(0, basket.subtotal - basket.discountAmount);
    basket.updatedAt = Math.floor(Date.now() / 1000);
  }
  
  // Update basket in database
  private async _updateBasket(basket: Basket): Promise<void> {
    await query(
      `UPDATE baskets 
       SET 
        items = ?, 
        total_quantity = ?, 
        subtotal = ?, 
        discount_amount = ?, 
        total_amount = ?, 
        metadata = ?, 
        updated_at = ?
       WHERE id = ?`,
      [
        JSON.stringify(basket.items),
        basket.totalQuantity,
        basket.subtotal,
        basket.discountAmount,
        basket.totalAmount,
        JSON.stringify(basket.metadata || {}),
        basket.updatedAt,
        basket.id
      ]
    );
  }
  
  // Update basket status
  private async _updateBasketStatus(basketId: string, status: Basket['status']): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    
    const result = await query(
      `UPDATE baskets SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, basketId]
    ) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }
}

export default new BasketRepo();
