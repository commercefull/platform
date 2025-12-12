/**
 * BasketItem Entity
 * Represents an item in a shopping basket
 */

import { Money } from '../valueObjects/Money';

export interface BasketItemProps {
  basketItemId: string;
  basketId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  imageUrl?: string;
  attributes?: Record<string, any>;
  itemType: 'physical' | 'digital' | 'subscription' | 'service';
  isGift: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BasketItem {
  private props: BasketItemProps;

  private constructor(props: BasketItemProps) {
    this.props = props;
  }

  static create(props: Omit<BasketItemProps, 'createdAt' | 'updatedAt'>): BasketItem {
    return new BasketItem({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static reconstitute(props: BasketItemProps): BasketItem {
    return new BasketItem(props);
  }

  // Getters
  get basketItemId(): string {
    return this.props.basketItemId;
  }

  get basketId(): string {
    return this.props.basketId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get productVariantId(): string | undefined {
    return this.props.productVariantId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get name(): string {
    return this.props.name;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get attributes(): Record<string, any> | undefined {
    return this.props.attributes;
  }

  get itemType(): string {
    return this.props.itemType;
  }

  get isGift(): boolean {
    return this.props.isGift;
  }

  get giftMessage(): string | undefined {
    return this.props.giftMessage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Calculated properties
  get lineTotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  // Domain methods
  updateQuantity(newQuantity: number): void {
    if (newQuantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    if (newQuantity > 100) {
      throw new Error('Quantity cannot exceed 100');
    }
    this.props.quantity = newQuantity;
    this.props.updatedAt = new Date();
  }

  incrementQuantity(amount: number = 1): void {
    this.updateQuantity(this.props.quantity + amount);
  }

  decrementQuantity(amount: number = 1): void {
    this.updateQuantity(this.props.quantity - amount);
  }

  setAsGift(message?: string): void {
    this.props.isGift = true;
    this.props.giftMessage = message;
    this.props.updatedAt = new Date();
  }

  removeGiftStatus(): void {
    this.props.isGift = false;
    this.props.giftMessage = undefined;
    this.props.updatedAt = new Date();
  }

  updateAttributes(attributes: Record<string, any>): void {
    this.props.attributes = { ...this.props.attributes, ...attributes };
    this.props.updatedAt = new Date();
  }

  // Equality check
  isSameProduct(productId: string, productVariantId?: string): boolean {
    if (this.props.productId !== productId) return false;
    if (productVariantId) {
      return this.props.productVariantId === productVariantId;
    }
    return !this.props.productVariantId;
  }

  toJSON(): Record<string, any> {
    return {
      basketItemId: this.props.basketItemId,
      basketId: this.props.basketId,
      productId: this.props.productId,
      productVariantId: this.props.productVariantId,
      sku: this.props.sku,
      name: this.props.name,
      quantity: this.props.quantity,
      unitPrice: this.props.unitPrice.amount,
      currency: this.props.unitPrice.currency,
      lineTotal: this.lineTotal.amount,
      imageUrl: this.props.imageUrl,
      attributes: this.props.attributes,
      itemType: this.props.itemType,
      isGift: this.props.isGift,
      giftMessage: this.props.giftMessage,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
