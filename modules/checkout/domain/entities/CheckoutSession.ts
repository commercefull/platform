/**
 * CheckoutSession Aggregate Root
 * Manages the checkout process from basket to order
 */

import { Address } from '../valueObjects/Address';
import { Money } from '../../../basket/domain/valueObjects/Money';

export type CheckoutStatus = 'active' | 'pending_payment' | 'processing' | 'completed' | 'abandoned' | 'expired' | 'failed';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type FulfillmentType = 'shipping' | 'pickup' | 'local_delivery' | 'digital';

export interface CheckoutSessionProps {
  id: string;
  customerId?: string;
  guestEmail?: string;
  basketId: string;
  status: CheckoutStatus;
  paymentStatus: PaymentStatus;
  shippingAddress?: Address;
  billingAddress?: Address;
  sameAsShipping: boolean;
  shippingMethodId?: string;
  shippingMethodName?: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  orderId?: string;
  subtotal: Money;
  taxAmount: Money;
  shippingAmount: Money;
  discountAmount: Money;
  total: Money;
  couponCode?: string;
  fulfillmentType: FulfillmentType;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export class CheckoutSession {
  private props: CheckoutSessionProps;

  private constructor(props: CheckoutSessionProps) {
    this.props = props;
  }

  static create(props: { id: string; basketId: string; customerId?: string; guestEmail?: string; currency?: string }): CheckoutSession {
    const now = new Date();
    const currency = props.currency || 'USD';

    return new CheckoutSession({
      id: props.id,
      customerId: props.customerId,
      guestEmail: props.guestEmail,
      basketId: props.basketId,
      status: 'active',
      paymentStatus: 'pending',
      sameAsShipping: true,
      fulfillmentType: 'shipping',
      subtotal: Money.zero(currency),
      taxAmount: Money.zero(currency),
      shippingAmount: Money.zero(currency),
      discountAmount: Money.zero(currency),
      total: Money.zero(currency),
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
    });
  }

  static reconstitute(props: CheckoutSessionProps): CheckoutSession {
    return new CheckoutSession(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }

  get guestEmail(): string | undefined {
    return this.props.guestEmail;
  }

  get basketId(): string {
    return this.props.basketId;
  }

  get status(): CheckoutStatus {
    return this.props.status;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  get shippingAddress(): Address | undefined {
    return this.props.shippingAddress;
  }

  get billingAddress(): Address | undefined {
    return this.props.sameAsShipping ? this.props.shippingAddress : this.props.billingAddress;
  }

  get sameAsShipping(): boolean {
    return this.props.sameAsShipping;
  }

  get shippingMethodId(): string | undefined {
    return this.props.shippingMethodId;
  }

  get shippingMethodName(): string | undefined {
    return this.props.shippingMethodName;
  }

  get paymentMethodId(): string | undefined {
    return this.props.paymentMethodId;
  }

  get paymentIntentId(): string | undefined {
    return this.props.paymentIntentId;
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get taxAmount(): Money {
    return this.props.taxAmount;
  }

  get shippingAmount(): Money {
    return this.props.shippingAmount;
  }

  get discountAmount(): Money {
    return this.props.discountAmount;
  }

  get total(): Money {
    return this.props.total;
  }

  get couponCode(): string | undefined {
    return this.props.couponCode;
  }

  get fulfillmentType(): FulfillmentType {
    return this.props.fulfillmentType;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isActive(): boolean {
    return this.props.status === 'active' || this.props.status === 'pending_payment';
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get isComplete(): boolean {
    return this.props.status === 'completed';
  }

  get isReadyForPayment(): boolean {
    if (this.props.fulfillmentType === 'pickup') {
      return !!this.props.paymentMethodId && !this.props.total.isZero();
    }
    if (this.props.fulfillmentType === 'digital') {
      return !!this.props.paymentMethodId && !this.props.total.isZero();
    }
    if (this.props.fulfillmentType === 'local_delivery') {
      return !!this.props.shippingAddress && !!this.props.paymentMethodId && !this.props.total.isZero();
    }
    // shipping
    return !!this.props.shippingAddress && !!this.props.shippingMethodId && !this.props.total.isZero();
  }

  hasOnlyDigitalItems(items: Array<{ isDigital: boolean }>): boolean {
    return items.length > 0 && items.every(item => item.isDigital);
  }

  // Domain methods
  setFulfillmentType(type: FulfillmentType): void {
    this.ensureActive();
    this.props.fulfillmentType = type;
    if (type === 'pickup' || type === 'digital') {
      this.props.shippingMethodId = undefined;
      this.props.shippingMethodName = undefined;
      this.props.shippingAmount = Money.zero(this.props.subtotal.currency);
      this.recalculateTotal();
    }
    this.touch();
  }

  setShippingAddress(address: Address): void {
    this.ensureActive();
    this.props.shippingAddress = address;
    this.touch();
  }

  setBillingAddress(address: Address, sameAsShipping: boolean = false): void {
    this.ensureActive();
    this.props.sameAsShipping = sameAsShipping;
    if (!sameAsShipping) {
      this.props.billingAddress = address;
    }
    this.touch();
  }

  setShippingMethod(methodId: string, methodName: string, amount: Money): void {
    this.ensureActive();
    this.props.shippingMethodId = methodId;
    this.props.shippingMethodName = methodName;
    this.props.shippingAmount = amount;
    this.recalculateTotal();
    this.touch();
  }

  setPaymentMethod(methodId: string): void {
    this.ensureActive();
    this.props.paymentMethodId = methodId;
    this.touch();
  }

  setPaymentIntent(intentId: string, orderId: string): void {
    this.props.paymentIntentId = intentId;
    this.props.orderId = orderId;
    this.props.status = 'pending_payment';
    this.touch();
  }

  setGuestEmail(email: string): void {
    this.ensureActive();
    if (!this.props.customerId) {
      this.props.guestEmail = email;
      this.touch();
    }
  }

  applyCoupon(code: string, discountAmount: Money): void {
    this.ensureActive();
    this.props.couponCode = code;
    this.props.discountAmount = discountAmount;
    this.recalculateTotal();
    this.touch();
  }

  removeCoupon(): void {
    this.ensureActive();
    this.props.couponCode = undefined;
    this.props.discountAmount = Money.zero(this.props.subtotal.currency);
    this.recalculateTotal();
    this.touch();
  }

  updateAmounts(subtotal: Money, taxAmount: Money): void {
    this.ensureActive();
    this.props.subtotal = subtotal;
    this.props.taxAmount = taxAmount;
    this.recalculateTotal();
    this.touch();
  }

  setNotes(notes: string): void {
    this.props.notes = notes;
    this.touch();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  markPaymentAuthorized(): void {
    this.props.paymentStatus = 'authorized';
    this.props.status = 'processing';
    this.touch();
  }

  markPaymentCaptured(): void {
    this.props.paymentStatus = 'captured';
    this.touch();
  }

  markPaymentFailed(): void {
    this.props.paymentStatus = 'failed';
    this.props.status = 'failed';
    this.touch();
  }

  complete(): void {
    if (this.props.paymentStatus !== 'captured' && this.props.paymentStatus !== 'authorized') {
      throw new Error('Cannot complete checkout: payment not confirmed');
    }
    this.props.status = 'completed';
    this.props.completedAt = new Date();
    this.touch();
  }

  abandon(): void {
    this.props.status = 'abandoned';
    this.touch();
  }

  extendExpiration(minutes: number = 30): void {
    this.props.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    this.touch();
  }

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error(`Cannot modify checkout: status is ${this.props.status}`);
    }
    if (this.isExpired) {
      throw new Error('Cannot modify checkout: session has expired');
    }
  }

  private recalculateTotal(): void {
    const currency = this.props.subtotal.currency;
    let total = this.props.subtotal.add(this.props.taxAmount).add(this.props.shippingAmount);

    if (!this.props.discountAmount.isZero()) {
      total = Money.create(Math.max(0, total.amount - this.props.discountAmount.amount), currency);
    }

    this.props.total = total;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      customerId: this.props.customerId,
      guestEmail: this.props.guestEmail,
      basketId: this.props.basketId,
      status: this.props.status,
      paymentStatus: this.props.paymentStatus,
      shippingAddress: this.props.shippingAddress?.toJSON(),
      billingAddress: this.billingAddress?.toJSON(),
      sameAsShipping: this.props.sameAsShipping,
      shippingMethodId: this.props.shippingMethodId,
      shippingMethodName: this.props.shippingMethodName,
      paymentMethodId: this.props.paymentMethodId,
      paymentIntentId: this.props.paymentIntentId,
      orderId: this.props.orderId,
      subtotal: this.props.subtotal.amount,
      taxAmount: this.props.taxAmount.amount,
      shippingAmount: this.props.shippingAmount.amount,
      discountAmount: this.props.discountAmount.amount,
      total: this.props.total.amount,
      currency: this.props.subtotal.currency,
      couponCode: this.props.couponCode,
      fulfillmentType: this.props.fulfillmentType,
      notes: this.props.notes,
      metadata: this.props.metadata,
      isReadyForPayment: this.isReadyForPayment,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      expiresAt: this.props.expiresAt.toISOString(),
    };
  }
}
