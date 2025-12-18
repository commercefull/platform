/**
 * Basket Repository Interface
 * Defines the contract for basket persistence operations
 */

import { Basket } from '../entities/Basket';
import { BasketItem } from '../entities/BasketItem';

export interface BasketRepository {
  /**
   * Find basket by ID
   */
  findById(basketId: string): Promise<Basket | null>;

  /**
   * Find basket by customer ID
   */
  findByCustomerId(customerId: string): Promise<Basket | null>;

  /**
   * Find basket by session ID
   */
  findBySessionId(sessionId: string): Promise<Basket | null>;

  /**
   * Find active basket for customer or session
   */
  findActiveBasket(customerId?: string, sessionId?: string): Promise<Basket | null>;

  /**
   * Save basket (create or update)
   */
  save(basket: Basket): Promise<Basket>;

  /**
   * Delete basket
   */
  delete(basketId: string): Promise<void>;

  /**
   * Add item to basket
   */
  addItem(basketId: string, item: BasketItem): Promise<BasketItem>;

  /**
   * Update item in basket
   */
  updateItem(item: BasketItem): Promise<BasketItem>;

  /**
   * Remove item from basket
   */
  removeItem(basketItemId: string): Promise<void>;

  /**
   * Get all items in basket
   */
  getItems(basketId: string): Promise<BasketItem[]>;

  /**
   * Clear all items from basket
   */
  clearItems(basketId: string): Promise<void>;

  /**
   * Find abandoned baskets for cleanup
   */
  findAbandonedBaskets(olderThanDays: number): Promise<Basket[]>;

  /**
   * Find expired baskets
   */
  findExpiredBaskets(): Promise<Basket[]>;

  /**
   * Mark basket as abandoned
   */
  markAsAbandoned(basketId: string): Promise<void>;

  /**
   * Merge session basket to customer basket
   */
  mergeBaskets(sessionBasketId: string, customerBasketId: string): Promise<Basket>;
}
