/**
 * CheckoutSession Aggregate Root
 * Manages the checkout process from basket to order
 */

import { Address } from '../valueObjects/Address';
import { Money } from '../../../../libs/money';
import { BadRequestError } from '../../../../libs/errors';
import { InvalidCheckoutStateError } from '../errors/CheckoutErrors';

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
  /** True when taxAmount is embedded in subtotal/shipping (tax-inclusive pricing) and must not be added to the total */
  taxIncludedInSubtotal?: boolean;
  /**
   * The portion of taxAmount added on top of subtotal + shipping. Absent
   * means: all of taxAmount when taxIncludedInSubtotal is false, zero when
   * true. Explicit value supports mixed quotes (some lines tax-inclusive).
   */
  taxAddedAmount?: Money;
  shippingAmount: Money;
  discountAmount: Money;
  total: Money;
  couponCode?: string;
  /** Loyalty reward applied to this session — points are debited at the payment boundary. */
  loyaltyRewardId?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: Money;
  /** Customer VAT ID (B2B) — validated during tax quoting. */
  vatNumber?: string;
  /** True when the tax quote applied intra-EU B2B reverse charge. */
  reverseChargeApplied?: boolean;
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

  get taxIncludedInSubtotal(): boolean {
    return this.props.taxIncludedInSubtotal ?? false;
  }

  get taxAddedAmount(): Money {
    if (this.props.taxAddedAmount) return this.props.taxAddedAmount;
    return this.props.taxIncludedInSubtotal ? Money.zero(this.props.taxAmount.currency) : this.props.taxAmount;
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

  get loyaltyRewardId(): string | undefined {
    return this.props.loyaltyRewardId;
  }

  get loyaltyPointsRedeemed(): number {
    return this.props.loyaltyPointsRedeemed ?? 0;
  }

  get loyaltyDiscountAmount(): Money {
    return this.props.loyaltyDiscountAmount ?? Money.zero(this.props.subtotal.currency);
  }

  get vatNumber(): string | undefined {
    return this.props.vatNumber;
  }

  get reverseChargeApplied(): boolean {
    return this.props.reverseChargeApplied ?? false;
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

  // Records the created order early so a retried payment-intent can resume
  // on it instead of placing a duplicate.
  attachOrder(orderId: string): void {
    this.ensureActive();
    this.props.orderId = orderId;
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

  applyLoyaltyReward(rewardId: string, points: number, discount: Money): void {
    this.ensureActive();
    this.props.loyaltyRewardId = rewardId;
    this.props.loyaltyPointsRedeemed = points;
    this.props.loyaltyDiscountAmount = discount;
    this.recalculateTotal();
    this.touch();
  }

  removeLoyaltyReward(): void {
    this.ensureActive();
    this.props.loyaltyRewardId = undefined;
    this.props.loyaltyPointsRedeemed = undefined;
    this.props.loyaltyDiscountAmount = undefined;
    this.recalculateTotal();
    this.touch();
  }

  setVatNumber(vatNumber: string | undefined): void {
    this.ensureActive();
    this.props.vatNumber = vatNumber;
    if (!vatNumber) this.props.reverseChargeApplied = undefined;
    this.touch();
  }

  setReverseChargeApplied(applied: boolean): void {
    this.ensureActive();
    this.props.reverseChargeApplied = applied;
    this.touch();
  }

  updateAmounts(subtotal: Money, taxAmount: Money, taxIncludedInSubtotal = false, taxAddedAmount?: Money): void {
    this.ensureActive();
    this.props.subtotal = subtotal;
    this.props.taxAmount = taxAmount;
    this.props.taxIncludedInSubtotal = taxIncludedInSubtotal;
    this.props.taxAddedAmount = taxAddedAmount ?? (taxIncludedInSubtotal ? Money.zero(subtotal.currency) : taxAmount);
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
      throw new InvalidCheckoutStateError('payment not confirmed');
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
      throw new BadRequestError(`Cannot modify checkout: status is ${this.props.status}`);
    }
    if (this.isExpired) {
      throw new BadRequestError('Cannot modify checkout: session has expired');
    }
  }

  private recalculateTotal(): void {
    const currency = this.props.subtotal.currency;
    let total = this.props.subtotal.add(this.props.shippingAmount).add(this.taxAddedAmount);

    const totalDiscount = this.props.discountAmount.amount + (this.props.loyaltyDiscountAmount?.amount ?? 0);
    if (totalDiscount > 0) {
      total = Money.create(Math.max(0, total.amount - totalDiscount), currency);
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
      taxIncludedInSubtotal: this.props.taxIncludedInSubtotal ?? false,
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
