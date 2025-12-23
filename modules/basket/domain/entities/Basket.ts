/**
 * Basket Aggregate Root
 * The main entity that manages the shopping basket and its items
 */

import { BasketItem } from './BasketItem';
import { Money } from '../valueObjects/Money';

export type BasketStatus = 'active' | 'merged' | 'converted' | 'abandoned' | 'completed';

export interface BasketProps {
  basketId: string;
  customerId?: string;
  sessionId?: string;
  status: BasketStatus;
  currency: string;
  items: BasketItem[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  convertedToOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export class Basket {
  private props: BasketProps;

  private constructor(props: BasketProps) {
    this.props = props;
  }

  static create(props: { basketId: string; customerId?: string; sessionId?: string; currency?: string; expiresAt?: Date }): Basket {
    const now = new Date();
    return new Basket({
      basketId: props.basketId,
      customerId: props.customerId,
      sessionId: props.sessionId,
      status: 'active',
      currency: props.currency || 'USD',
      items: [],
      expiresAt: props.expiresAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
  }

  static reconstitute(props: BasketProps): Basket {
    return new Basket(props);
  }

  // Getters
  get basketId(): string {
    return this.props.basketId;
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }

  get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  get status(): BasketStatus {
    return this.props.status;
  }

  get currency(): string {
    return this.props.currency;
  }

  get items(): BasketItem[] {
    return [...this.props.items]; // Return copy to preserve immutability
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get convertedToOrderId(): string | undefined {
    return this.props.convertedToOrderId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  // Calculated properties
  get itemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get uniqueItemCount(): number {
    return this.props.items.length;
  }

  get subtotal(): Money {
    return this.props.items.reduce((sum, item) => sum.add(item.lineTotal), Money.zero(this.props.currency));
  }

  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  // Domain methods
  addItem(item: BasketItem): void {
    this.ensureActive();

    // Check if same product already exists
    const existingItem = this.props.items.find(i => i.isSameProduct(item.productId, item.productVariantId));

    if (existingItem) {
      existingItem.incrementQuantity(item.quantity);
    } else {
      this.props.items.push(item);
    }

    this.touch();
  }

  updateItemQuantity(basketItemId: string, quantity: number): void {
    this.ensureActive();

    const item = this.findItem(basketItemId);
    if (!item) {
      throw new Error(`Item ${basketItemId} not found in basket`);
    }

    item.updateQuantity(quantity);
    this.touch();
  }

  removeItem(basketItemId: string): void {
    this.ensureActive();

    const index = this.props.items.findIndex(i => i.basketItemId === basketItemId);
    if (index === -1) {
      throw new Error(`Item ${basketItemId} not found in basket`);
    }

    this.props.items.splice(index, 1);
    this.touch();
  }

  clearItems(): void {
    this.ensureActive();
    this.props.items = [];
    this.touch();
  }

  findItem(basketItemId: string): BasketItem | undefined {
    return this.props.items.find(i => i.basketItemId === basketItemId);
  }

  findItemByProduct(productId: string, productVariantId?: string): BasketItem | undefined {
    return this.props.items.find(i => i.isSameProduct(productId, productVariantId));
  }

  setItemAsGift(basketItemId: string, message?: string): void {
    this.ensureActive();
    const item = this.findItem(basketItemId);
    if (!item) {
      throw new Error(`Item ${basketItemId} not found in basket`);
    }
    item.setAsGift(message);
    this.touch();
  }

  assignToCustomer(customerId: string): void {
    if (this.props.customerId && this.props.customerId !== customerId) {
      throw new Error('Basket is already assigned to a different customer');
    }
    this.props.customerId = customerId;
    this.props.sessionId = undefined; // Clear session when assigned to customer
    this.touch();
  }

  mergeFrom(otherBasket: Basket): void {
    this.ensureActive();

    for (const item of otherBasket.items) {
      this.addItem(item);
    }

    this.touch();
  }

  markAsAbandoned(): void {
    this.props.status = 'abandoned';
    this.props.updatedAt = new Date();
  }

  markAsCompleted(orderId: string): void {
    this.props.status = 'completed';
    this.props.convertedToOrderId = orderId;
    this.props.updatedAt = new Date();
  }

  markAsMerged(): void {
    this.props.status = 'merged';
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  extendExpiration(days: number = 7): void {
    this.props.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    this.touch();
  }

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error(`Cannot modify basket: status is ${this.props.status}`);
    }
    if (this.isExpired) {
      throw new Error('Cannot modify basket: basket has expired');
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
    this.props.lastActivityAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      basketId: this.props.basketId,
      customerId: this.props.customerId,
      sessionId: this.props.sessionId,
      status: this.props.status,
      currency: this.props.currency,
      items: this.props.items.map(item => item.toJSON()),
      itemCount: this.itemCount,
      uniqueItemCount: this.uniqueItemCount,
      subtotal: this.subtotal.amount,
      metadata: this.props.metadata,
      expiresAt: this.props.expiresAt?.toISOString(),
      convertedToOrderId: this.props.convertedToOrderId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      lastActivityAt: this.props.lastActivityAt.toISOString(),
    };
  }
}
