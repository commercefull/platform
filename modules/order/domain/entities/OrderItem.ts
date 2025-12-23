/**
 * Order Item Entity
 * Represents a line item in an order
 */

import { Money } from '../valueObjects/Money';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';

export interface OrderItemProps {
  orderItemId: string;
  orderId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: Money;
  unitCost?: Money;
  discountedUnitPrice?: Money;
  lineTotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  taxRate?: number;
  taxExempt: boolean;
  fulfillmentStatus: FulfillmentStatus;
  options?: Record<string, any>;
  attributes?: Record<string, any>;
  giftWrapped: boolean;
  giftMessage?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  isDigital: boolean;
  subscriptionInfo?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderItem {
  private props: OrderItemProps;

  private constructor(props: OrderItemProps) {
    this.props = props;
  }

  static create(props: {
    orderItemId: string;
    orderId: string;
    productId: string;
    productVariantId?: string;
    sku: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: Money;
    unitCost?: Money;
    discountedUnitPrice?: Money;
    taxRate?: number;
    taxExempt?: boolean;
    options?: Record<string, any>;
    attributes?: Record<string, any>;
    giftWrapped?: boolean;
    giftMessage?: string;
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    isDigital?: boolean;
    subscriptionInfo?: Record<string, any>;
    metadata?: Record<string, any>;
  }): OrderItem {
    const now = new Date();
    const effectivePrice = props.discountedUnitPrice || props.unitPrice;
    const lineTotal = effectivePrice.multiply(props.quantity);
    const taxAmount = props.taxRate ? lineTotal.multiply(props.taxRate / 100) : Money.zero(props.unitPrice.currency);
    const discountTotal = props.discountedUnitPrice
      ? props.unitPrice.subtract(props.discountedUnitPrice).multiply(props.quantity)
      : Money.zero(props.unitPrice.currency);

    return new OrderItem({
      orderItemId: props.orderItemId,
      orderId: props.orderId,
      productId: props.productId,
      productVariantId: props.productVariantId,
      sku: props.sku,
      name: props.name,
      description: props.description,
      quantity: props.quantity,
      unitPrice: props.unitPrice,
      unitCost: props.unitCost,
      discountedUnitPrice: props.discountedUnitPrice,
      lineTotal,
      discountTotal,
      taxTotal: taxAmount,
      taxRate: props.taxRate,
      taxExempt: props.taxExempt || false,
      fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
      options: props.options,
      attributes: props.attributes,
      giftWrapped: props.giftWrapped || false,
      giftMessage: props.giftMessage,
      weight: props.weight,
      dimensions: props.dimensions,
      isDigital: props.isDigital || false,
      subscriptionInfo: props.subscriptionInfo,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  // Getters
  get orderItemId(): string {
    return this.props.orderItemId;
  }
  get orderId(): string {
    return this.props.orderId;
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
  get description(): string | undefined {
    return this.props.description;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): Money {
    return this.props.unitPrice;
  }
  get unitCost(): Money | undefined {
    return this.props.unitCost;
  }
  get discountedUnitPrice(): Money | undefined {
    return this.props.discountedUnitPrice;
  }
  get lineTotal(): Money {
    return this.props.lineTotal;
  }
  get discountTotal(): Money {
    return this.props.discountTotal;
  }
  get taxTotal(): Money {
    return this.props.taxTotal;
  }
  get taxRate(): number | undefined {
    return this.props.taxRate;
  }
  get taxExempt(): boolean {
    return this.props.taxExempt;
  }
  get fulfillmentStatus(): FulfillmentStatus {
    return this.props.fulfillmentStatus;
  }
  get options(): Record<string, any> | undefined {
    return this.props.options;
  }
  get attributes(): Record<string, any> | undefined {
    return this.props.attributes;
  }
  get giftWrapped(): boolean {
    return this.props.giftWrapped;
  }
  get giftMessage(): string | undefined {
    return this.props.giftMessage;
  }
  get weight(): number | undefined {
    return this.props.weight;
  }
  get dimensions(): { length: number; width: number; height: number } | undefined {
    return this.props.dimensions;
  }
  get isDigital(): boolean {
    return this.props.isDigital;
  }
  get subscriptionInfo(): Record<string, any> | undefined {
    return this.props.subscriptionInfo;
  }
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Calculated properties
  get total(): Money {
    return this.props.lineTotal.add(this.props.taxTotal);
  }

  get effectiveUnitPrice(): Money {
    return this.props.discountedUnitPrice || this.props.unitPrice;
  }

  // Domain methods
  updateQuantity(newQuantity: number): void {
    if (newQuantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    this.props.quantity = newQuantity;
    this.recalculateTotals();
    this.touch();
  }

  updateFulfillmentStatus(status: FulfillmentStatus): void {
    this.props.fulfillmentStatus = status;
    this.touch();
  }

  setAsGift(message?: string): void {
    this.props.giftWrapped = true;
    this.props.giftMessage = message;
    this.touch();
  }

  removeGift(): void {
    this.props.giftWrapped = false;
    this.props.giftMessage = undefined;
    this.touch();
  }

  private recalculateTotals(): void {
    const effectivePrice = this.props.discountedUnitPrice || this.props.unitPrice;
    this.props.lineTotal = effectivePrice.multiply(this.props.quantity);
    this.props.discountTotal = this.props.discountedUnitPrice
      ? this.props.unitPrice.subtract(this.props.discountedUnitPrice).multiply(this.props.quantity)
      : Money.zero(this.props.unitPrice.currency);
    this.props.taxTotal = this.props.taxRate
      ? this.props.lineTotal.multiply(this.props.taxRate / 100)
      : Money.zero(this.props.unitPrice.currency);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      orderItemId: this.props.orderItemId,
      orderId: this.props.orderId,
      productId: this.props.productId,
      productVariantId: this.props.productVariantId,
      sku: this.props.sku,
      name: this.props.name,
      description: this.props.description,
      quantity: this.props.quantity,
      unitPrice: this.props.unitPrice.amount,
      unitCost: this.props.unitCost?.amount,
      discountedUnitPrice: this.props.discountedUnitPrice?.amount,
      lineTotal: this.props.lineTotal.amount,
      discountTotal: this.props.discountTotal.amount,
      taxTotal: this.props.taxTotal.amount,
      taxRate: this.props.taxRate,
      taxExempt: this.props.taxExempt,
      fulfillmentStatus: this.props.fulfillmentStatus,
      options: this.props.options,
      attributes: this.props.attributes,
      giftWrapped: this.props.giftWrapped,
      giftMessage: this.props.giftMessage,
      weight: this.props.weight,
      dimensions: this.props.dimensions,
      isDigital: this.props.isDigital,
      subscriptionInfo: this.props.subscriptionInfo,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
