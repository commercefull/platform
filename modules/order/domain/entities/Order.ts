/**
 * Order Aggregate Root
 * The main entity that manages order lifecycle and business logic
 */

import { OrderItem } from './OrderItem';
import { OrderAddress } from './OrderAddress';
import { Money } from '../valueObjects/Money';
import { OrderStatus, canTransitionTo } from '../valueObjects/OrderStatus';
import { PaymentStatus, canTransitionPaymentTo } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus, canTransitionFulfillmentTo } from '../valueObjects/FulfillmentStatus';

export interface OrderProps {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  basketId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currencyCode: string;
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  shippingTotal: Money;
  handlingFee: Money;
  totalAmount: Money;
  totalItems: number;
  totalQuantity: number;
  taxExempt: boolean;
  orderDate: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  referralSource?: string;
  estimatedDeliveryDate?: Date;
  hasGiftWrapping: boolean;
  giftMessage?: string;
  isGift: boolean;
  isSubscriptionOrder: boolean;
  parentOrderId?: string;
  items: OrderItem[];
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Order {
  private props: OrderProps;

  private constructor(props: OrderProps) {
    this.props = props;
  }

  static create(props: {
    orderId: string;
    orderNumber?: string;
    customerId?: string;
    basketId?: string;
    currencyCode?: string;
    customerEmail: string;
    customerPhone?: string;
    customerName?: string;
    customerNotes?: string;
    ipAddress?: string;
    userAgent?: string;
    referralSource?: string;
    hasGiftWrapping?: boolean;
    giftMessage?: string;
    isGift?: boolean;
    isSubscriptionOrder?: boolean;
    parentOrderId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Order {
    const now = new Date();
    const currency = props.currencyCode || 'USD';

    return new Order({
      orderId: props.orderId,
      orderNumber: props.orderNumber || Order.generateOrderNumber(),
      customerId: props.customerId,
      basketId: props.basketId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
      currencyCode: currency,
      subtotal: Money.zero(currency),
      discountTotal: Money.zero(currency),
      taxTotal: Money.zero(currency),
      shippingTotal: Money.zero(currency),
      handlingFee: Money.zero(currency),
      totalAmount: Money.zero(currency),
      totalItems: 0,
      totalQuantity: 0,
      taxExempt: false,
      orderDate: now,
      customerEmail: props.customerEmail,
      customerPhone: props.customerPhone,
      customerName: props.customerName,
      customerNotes: props.customerNotes,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
      referralSource: props.referralSource,
      hasGiftWrapping: props.hasGiftWrapping || false,
      giftMessage: props.giftMessage,
      isGift: props.isGift || false,
      isSubscriptionOrder: props.isSubscriptionOrder || false,
      parentOrderId: props.parentOrderId,
      items: [],
      tags: props.tags || [],
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  // Getters
  get orderId(): string {
    return this.props.orderId;
  }
  get orderNumber(): string {
    return this.props.orderNumber;
  }
  get customerId(): string | undefined {
    return this.props.customerId;
  }
  get basketId(): string | undefined {
    return this.props.basketId;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }
  get fulfillmentStatus(): FulfillmentStatus {
    return this.props.fulfillmentStatus;
  }
  get currencyCode(): string {
    return this.props.currencyCode;
  }
  get subtotal(): Money {
    return this.props.subtotal;
  }
  get discountTotal(): Money {
    return this.props.discountTotal;
  }
  get taxTotal(): Money {
    return this.props.taxTotal;
  }
  get shippingTotal(): Money {
    return this.props.shippingTotal;
  }
  get handlingFee(): Money {
    return this.props.handlingFee;
  }
  get totalAmount(): Money {
    return this.props.totalAmount;
  }
  get totalItems(): number {
    return this.props.totalItems;
  }
  get totalQuantity(): number {
    return this.props.totalQuantity;
  }
  get taxExempt(): boolean {
    return this.props.taxExempt;
  }
  get orderDate(): Date {
    return this.props.orderDate;
  }
  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }
  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }
  get returnedAt(): Date | undefined {
    return this.props.returnedAt;
  }
  get shippingAddress(): OrderAddress | undefined {
    return this.props.shippingAddress;
  }
  get billingAddress(): OrderAddress | undefined {
    return this.props.billingAddress;
  }
  get customerEmail(): string {
    return this.props.customerEmail;
  }
  get customerPhone(): string | undefined {
    return this.props.customerPhone;
  }
  get customerName(): string | undefined {
    return this.props.customerName;
  }
  get customerNotes(): string | undefined {
    return this.props.customerNotes;
  }
  get adminNotes(): string | undefined {
    return this.props.adminNotes;
  }
  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }
  get userAgent(): string | undefined {
    return this.props.userAgent;
  }
  get referralSource(): string | undefined {
    return this.props.referralSource;
  }
  get estimatedDeliveryDate(): Date | undefined {
    return this.props.estimatedDeliveryDate;
  }
  get hasGiftWrapping(): boolean {
    return this.props.hasGiftWrapping;
  }
  get giftMessage(): string | undefined {
    return this.props.giftMessage;
  }
  get isGift(): boolean {
    return this.props.isGift;
  }
  get isSubscriptionOrder(): boolean {
    return this.props.isSubscriptionOrder;
  }
  get parentOrderId(): string | undefined {
    return this.props.parentOrderId;
  }
  get items(): OrderItem[] {
    return [...this.props.items];
  }
  get tags(): string[] {
    return this.props.tags || [];
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
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // Calculated properties
  get isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }
  get isProcessing(): boolean {
    return this.props.status === OrderStatus.PROCESSING;
  }
  get isCompleted(): boolean {
    return this.props.status === OrderStatus.COMPLETED;
  }
  get isCancelled(): boolean {
    return this.props.status === OrderStatus.CANCELLED;
  }
  get isRefunded(): boolean {
    return this.props.status === OrderStatus.REFUNDED;
  }
  get isPaid(): boolean {
    return this.props.paymentStatus === PaymentStatus.PAID;
  }
  get isFulfilled(): boolean {
    return this.props.fulfillmentStatus === FulfillmentStatus.FULFILLED;
  }

  get canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.PAYMENT_PENDING].includes(this.props.status);
  }

  get canBeRefunded(): boolean {
    return (
      [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(this.props.status) &&
      this.props.paymentStatus === PaymentStatus.PAID
    );
  }

  // Domain methods
  addItem(item: OrderItem): void {
    this.ensureModifiable();
    this.props.items.push(item);
    this.recalculateTotals();
    this.touch();
  }

  removeItem(orderItemId: string): void {
    this.ensureModifiable();
    const index = this.props.items.findIndex(i => i.orderItemId === orderItemId);
    if (index === -1) {
      throw new Error(`Item ${orderItemId} not found in order`);
    }
    this.props.items.splice(index, 1);
    this.recalculateTotals();
    this.touch();
  }

  findItem(orderItemId: string): OrderItem | undefined {
    return this.props.items.find(i => i.orderItemId === orderItemId);
  }

  updateStatus(newStatus: OrderStatus, reason?: string): void {
    if (!canTransitionTo(this.props.status, newStatus)) {
      throw new Error(`Cannot transition order from ${this.props.status} to ${newStatus}`);
    }

    this.props.status = newStatus;

    if (newStatus === OrderStatus.COMPLETED) {
      this.props.completedAt = new Date();
    } else if (newStatus === OrderStatus.CANCELLED) {
      this.props.cancelledAt = new Date();
    }

    this.touch();
  }

  updatePaymentStatus(newStatus: PaymentStatus): void {
    if (!canTransitionPaymentTo(this.props.paymentStatus, newStatus)) {
      throw new Error(`Cannot transition payment from ${this.props.paymentStatus} to ${newStatus}`);
    }
    this.props.paymentStatus = newStatus;
    this.touch();
  }

  updateFulfillmentStatus(newStatus: FulfillmentStatus): void {
    if (!canTransitionFulfillmentTo(this.props.fulfillmentStatus, newStatus)) {
      throw new Error(`Cannot transition fulfillment from ${this.props.fulfillmentStatus} to ${newStatus}`);
    }
    this.props.fulfillmentStatus = newStatus;
    this.touch();
  }

  setShippingAddress(address: OrderAddress): void {
    this.props.shippingAddress = address;
    this.touch();
  }

  setBillingAddress(address: OrderAddress): void {
    this.props.billingAddress = address;
    this.touch();
  }

  setShippingTotal(amount: Money): void {
    this.ensureModifiable();
    this.props.shippingTotal = amount;
    this.recalculateTotals();
    this.touch();
  }

  setHandlingFee(amount: Money): void {
    this.ensureModifiable();
    this.props.handlingFee = amount;
    this.recalculateTotals();
    this.touch();
  }

  setTaxExempt(exempt: boolean): void {
    this.ensureModifiable();
    this.props.taxExempt = exempt;
    if (exempt) {
      this.props.taxTotal = Money.zero(this.props.currencyCode);
    }
    this.recalculateTotals();
    this.touch();
  }

  setEstimatedDeliveryDate(date: Date): void {
    this.props.estimatedDeliveryDate = date;
    this.touch();
  }

  addAdminNote(note: string): void {
    this.props.adminNotes = this.props.adminNotes
      ? `${this.props.adminNotes}\n${new Date().toISOString()}: ${note}`
      : `${new Date().toISOString()}: ${note}`;
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = [];
    }
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    if (this.props.tags) {
      const index = this.props.tags.indexOf(tag);
      if (index > -1) {
        this.props.tags.splice(index, 1);
        this.touch();
      }
    }
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  cancel(reason?: string): void {
    if (!this.canBeCancelled) {
      throw new Error(`Order cannot be cancelled in status: ${this.props.status}`);
    }
    this.updateStatus(OrderStatus.CANCELLED, reason);
    this.props.cancelledAt = new Date();
  }

  markAsReturned(): void {
    this.props.returnedAt = new Date();
    this.props.fulfillmentStatus = FulfillmentStatus.RETURNED;
    this.touch();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private ensureModifiable(): void {
    if (this.isCancelled || this.isRefunded || this.isCompleted) {
      throw new Error(`Cannot modify order in status: ${this.props.status}`);
    }
  }

  private recalculateTotals(): void {
    let subtotal = Money.zero(this.props.currencyCode);
    let discountTotal = Money.zero(this.props.currencyCode);
    let taxTotal = Money.zero(this.props.currencyCode);
    let totalQuantity = 0;

    for (const item of this.props.items) {
      subtotal = subtotal.add(item.lineTotal);
      discountTotal = discountTotal.add(item.discountTotal);
      if (!this.props.taxExempt) {
        taxTotal = taxTotal.add(item.taxTotal);
      }
      totalQuantity += item.quantity;
    }

    this.props.subtotal = subtotal;
    this.props.discountTotal = discountTotal;
    this.props.taxTotal = taxTotal;
    this.props.totalItems = this.props.items.length;
    this.props.totalQuantity = totalQuantity;
    this.props.totalAmount = subtotal.subtract(discountTotal).add(taxTotal).add(this.props.shippingTotal).add(this.props.handlingFee);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  toJSON(): Record<string, any> {
    return {
      orderId: this.props.orderId,
      orderNumber: this.props.orderNumber,
      customerId: this.props.customerId,
      basketId: this.props.basketId,
      status: this.props.status,
      paymentStatus: this.props.paymentStatus,
      fulfillmentStatus: this.props.fulfillmentStatus,
      currencyCode: this.props.currencyCode,
      subtotal: this.props.subtotal.amount,
      discountTotal: this.props.discountTotal.amount,
      taxTotal: this.props.taxTotal.amount,
      shippingTotal: this.props.shippingTotal.amount,
      handlingFee: this.props.handlingFee.amount,
      totalAmount: this.props.totalAmount.amount,
      totalItems: this.props.totalItems,
      totalQuantity: this.props.totalQuantity,
      taxExempt: this.props.taxExempt,
      orderDate: this.props.orderDate.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      cancelledAt: this.props.cancelledAt?.toISOString(),
      returnedAt: this.props.returnedAt?.toISOString(),
      shippingAddress: this.props.shippingAddress?.toJSON(),
      billingAddress: this.props.billingAddress?.toJSON(),
      customerEmail: this.props.customerEmail,
      customerPhone: this.props.customerPhone,
      customerName: this.props.customerName,
      customerNotes: this.props.customerNotes,
      adminNotes: this.props.adminNotes,
      estimatedDeliveryDate: this.props.estimatedDeliveryDate?.toISOString(),
      hasGiftWrapping: this.props.hasGiftWrapping,
      giftMessage: this.props.giftMessage,
      isGift: this.props.isGift,
      isSubscriptionOrder: this.props.isSubscriptionOrder,
      parentOrderId: this.props.parentOrderId,
      items: this.props.items.map(item => item.toJSON()),
      tags: this.props.tags,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      deletedAt: this.props.deletedAt?.toISOString(),
    };
  }
}
