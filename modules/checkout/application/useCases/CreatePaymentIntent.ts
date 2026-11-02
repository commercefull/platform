/**
 * Create Payment Intent Use Case
 * Creates a draft order in PAYMENT_PENDING and opens a payment intent with the gateway.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { Address } from '../../domain/valueObjects/Address';
import { BasketSnapshot, BasketSnapshotPort, CheckoutLineSnapshot } from '../../application/ports/BasketSnapshotPort';
import {
  OrderPlacementPort,
  CheckoutOutcome,
  OrderAddressInput,
  OrderItemInput,
  OrderSnapshot,
} from '../../application/ports/OrderPlacementPort';
import { PaymentAuthorizationPort } from '../../application/ports/PaymentAuthorizationPort';
import { FraudScreeningPort } from '../../application/ports/FraudScreeningPort';
import { InventoryReservationPort } from '../../application/ports/InventoryReservationPort';
import { PromotionQuotePort } from '../../application/ports/PromotionQuotePort';
import { LoyaltyRedemptionPort } from '../../application/ports/LoyaltyPort';
import { TaxQuotePort } from '../../application/ports/TaxQuotePort';
import type { StoreContextPort } from '../../application/ports/StoreContextPort';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { Money } from '../../../../libs/money';

// ============================================================================
// Command
// ============================================================================

export class CreatePaymentIntentCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly customerId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreatePaymentIntentResponse {
  orderId: string;
  orderNumber: string;
  paymentIntent: { id: string };
  status: string;
  /** True when the payment-boundary requote changed at least one line price. */
  priceChanged?: boolean;
  /** Per-line price changes applied by the requote (previous → new unit price). */
  priceChanges?: Array<{
    productId: string;
    productVariantId?: string;
    previousUnitPriceCents: number;
    unitPriceCents: number;
  }>;
}
export interface CreatePaymentIntentUseCaseDeps {
  checkoutRepository: CheckoutRepository;
  basketSnapshotPort: BasketSnapshotPort;
  orderPlacementPort: OrderPlacementPort;
  paymentAuthorizationPort: PaymentAuthorizationPort;
  fraudScreeningPort?: FraudScreeningPort;
  inventoryReservationPort?: InventoryReservationPort;
  taxQuotePort?: TaxQuotePort;
  promotionQuotePort?: PromotionQuotePort;
  loyaltyRedemptionPort?: LoyaltyRedemptionPort;
  storeContextPort?: StoreContextPort;
}

// ============================================================================
// Use Case
// ============================================================================

interface PickupAddressData {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface BillingAddressLike {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  address1?: string;
  address2?: string;
  city: string;
  region?: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export class CreatePaymentIntentUseCase {
  constructor(private readonly deps: CreatePaymentIntentUseCaseDeps) {}

  async execute(command: CreatePaymentIntentCommand): Promise<CreatePaymentIntentResponse> {
    const session = await this.deps.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new CheckoutSessionNotFoundError(command.checkoutId);
    }

    // Idempotency: already in pending_payment with a payment intent
    if (session.status === 'pending_payment' && session.paymentIntentId && session.orderId) {
      const existingOrder = await this.deps.orderPlacementPort.findOrder(session.orderId);
      return {
        orderId: session.orderId,
        orderNumber: existingOrder?.orderNumber || '',
        paymentIntent: { id: session.paymentIntentId },
        status: 'payment_pending',
      };
    }

    if (!session.isReadyForPayment) {
      throw new CheckoutValidationError(
        'Session is not ready for payment. Please set shipping address, shipping method, and payment method.',
      );
    }

    // Load basket items — the snapshot port performs an authoritative
    // requote, so these prices reflect current pricing rules.
    const basket = await this.loadBasketSnapshot(session);
    const basketItems = basket.items;

    let { totalsChanged, priceChanges } = this.syncBasketAdjustments(session, basket);
    if (await this.revalidateEnginePromotions(session, basket, basketItems)) totalsChanged = true;
    if (await this.requoteTotals(session, basket, basketItems)) totalsChanged = true;
    if (totalsChanged) {
      await this.deps.checkoutRepository.save(session);
    }

    const customerEmail = this.resolveCustomerEmail(session);
    const { shippingAddressInput, billingAddressInput } = this.buildOrderAddresses(session);
    const orderItems = this.buildOrderItems(basketItems);

    const orderResponse = await this.placeOrResumeOrder(session, basket, {
      orderItems,
      shippingAddressInput,
      billingAddressInput,
      customerEmail,
    });
    await this.reserveOrderInventory(orderResponse, basket, basketItems);

    // Initiate payment transaction
    // (declared before fraud screening so it can be used in the screening request)
    const paymentMethodId = session.paymentMethodId || 'default';

    await this.screenOrderForFraud({
      session,
      orderResponse,
      customerEmail,
      billingCountry: billingAddressInput.country,
      shippingCountry: shippingAddressInput.country,
      paymentMethodId,
    });
    await this.redeemLoyaltyPoints(session, orderResponse);
    const transactionId = await this.initiateOrderPayment(session, orderResponse, paymentMethodId);

    // Persist orderId + paymentIntentId on session
    session.setPaymentIntent(transactionId, orderResponse.orderId);
    await this.deps.checkoutRepository.save(session);

    // Emit checkout.payment_initiated
    eventBus.emit('checkout.payment_initiated', {
      checkoutId: session.id,
      orderId: orderResponse.orderId,
      paymentIntentId: transactionId,
      totalCents: session.total.cents,
    });

    return {
      orderId: orderResponse.orderId,
      orderNumber: orderResponse.orderNumber,
      paymentIntent: { id: transactionId },
      status: 'payment_pending',
      priceChanged: priceChanges.length > 0 || undefined,
      priceChanges: priceChanges.length > 0 ? priceChanges : undefined,
    };
  }

  private async loadBasketSnapshot(session: CheckoutSession): Promise<BasketSnapshot> {
    const basket = await this.deps.basketSnapshotPort.getSnapshot(session.basketId);
    if (!basket) {
      throw new CheckoutValidationError('Basket not found');
    }

    if (basket.unpurchasableProductIds && basket.unpurchasableProductIds.length > 0) {
      throw new CheckoutValidationError(`Products no longer purchasable at checkout: ${basket.unpurchasableProductIds.join(', ')}`);
    }

    return basket;
  }

  // Reconcile the session's discount with the basket's coupon when the
  // basket carries one (recomputed against repriced prices). A session-only
  // coupon applied through checkout ApplyCoupon is left untouched.
  // Also records requote price changes on the session so the client-facing
  // checkout summary and payment-intent response can surface a
  // price-change notice requiring customer acknowledgment.
  private syncBasketAdjustments(
    session: CheckoutSession,
    basket: BasketSnapshot,
  ): { totalsChanged: boolean; priceChanges: NonNullable<BasketSnapshot['priceChanges']> } {
    let totalsChanged = false;
    if (basket.couponCode && session.discountAmount.cents !== basket.discountAmountCents) {
      session.applyCoupon(basket.couponCode, Money.fromCents(basket.discountAmountCents, basket.currency));
      totalsChanged = true;
    }

    const priceChanges = basket.priceChanges ?? [];
    if (priceChanges.length > 0) {
      session.updateMetadata({
        priceChanges: priceChanges.map(c => ({
          productId: c.productId,
          productVariantId: c.productVariantId,
          previousUnitPriceCents: c.previousUnitPriceCents,
          unitPriceCents: c.unitPriceCents,
        })),
      });
      totalsChanged = true;
    }

    return { totalsChanged, priceChanges };
  }

  // Re-validate auto-applied promotions at the payment boundary: an
  // expired or no-longer-eligible promotion must not keep its stale
  // discount. Explicit coupons are managed by the apply/requote paths.
  // `'AUTO_PROMOTION'` remains as a legacy marker for sessions persisted
  // before structured `appliedPromotions` existed.
  private async revalidateEnginePromotions(
    session: CheckoutSession,
    basket: BasketSnapshot,
    basketItems: CheckoutLineSnapshot[],
  ): Promise<boolean> {
    const hasEnginePromotions = session.appliedPromotions.length > 0 || session.couponCode === 'AUTO_PROMOTION';
    if (!this.deps.promotionQuotePort || !hasEnginePromotions) return false;

    try {
      const promoResult = await this.deps.promotionQuotePort.evaluatePromotions({
        items: basketItems.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPrice.cents,
          isDigital: item.isDigital,
        })),
        subtotalCents: basket.subtotal.cents,
        shippingAmountCents: session.shippingAmount.cents,
        customerId: session.customerId,
        storeId: basket.storeId,
        channelId: basket.channelId,
        countryCode: session.shippingAddress?.country,
        currency: basket.currency,
      });
      const evaluatedCents = promoResult.totalDiscountAmountCents;
      if (evaluatedCents === session.discountAmount.cents) return false;

      // Clear the legacy marker first — removeCoupon zeroes discountAmount.
      if (session.couponCode === 'AUTO_PROMOTION') session.removeCoupon();
      if (evaluatedCents > 0) {
        session.applyPromotions(
          promoResult.appliedPromotions.map(p => ({
            promotionId: p.id,
            name: p.name,
            discountAmountCents: p.amountCents,
          })),
          Money.fromCents(evaluatedCents, basket.currency),
        );
      } else {
        session.clearPromotions();
      }
      return true;
    } catch {
      // Promotion revalidation is best-effort — keep the applied amount.
      return false;
    }
  }

  // Authoritative tax requote at the payment boundary: covers price changes
  // from the basket requote and shipping-tax changes since the quote taken
  // when the shipping address was set (a shipping method may have been
  // selected afterwards).
  private async requoteTotals(session: CheckoutSession, basket: BasketSnapshot, basketItems: CheckoutLineSnapshot[]): Promise<boolean> {
    if (!this.deps.taxQuotePort || !session.shippingAddress) {
      if (!basket.repriced) return false;
      session.updateAmounts(basket.subtotal, session.taxAmount, session.taxIncludedInSubtotal, session.taxAddedAmount);
      return true;
    }

    const tax = await this.recalculateTax(this.deps.taxQuotePort, session.shippingAddress, session, basket, basketItems);
    const totalsDiffer =
      session.subtotal.cents !== basket.subtotal.cents ||
      session.taxAmount.cents !== tax.taxAmount.cents ||
      session.taxAddedAmount.cents !== tax.taxAdded.cents ||
      session.taxIncludedInSubtotal !== tax.taxIncluded;
    session.updateAmounts(basket.subtotal, tax.taxAmount, tax.taxIncluded, tax.taxAdded);
    return totalsDiffer;
  }

  // Best-effort tax recalculation — a failure keeps the previously quoted
  // amounts rather than blocking checkout.
  private async recalculateTax(
    taxQuotePort: TaxQuotePort,
    shippingAddress: Address,
    session: CheckoutSession,
    basket: BasketSnapshot,
    basketItems: CheckoutLineSnapshot[],
  ): Promise<{ taxAmount: Money; taxIncluded: boolean; taxAdded: Money }> {
    let taxAmount = session.taxAmount;
    let taxIncluded = session.taxIncludedInSubtotal;
    let taxAdded = session.taxAddedAmount;
    try {
      const settings = await taxQuotePort.getTaxSettings('default');
      const storeContext =
        basket.storeId && this.deps.storeContextPort ? await this.deps.storeContextPort.getStoreContext(basket.storeId) : null;
      const taxResult = await taxQuotePort.calculateTax({
        items: basketItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPrice.cents,
          taxCategoryId: item.taxCategoryId,
          taxable: item.taxable,
        })),
        shippingAddress: {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postalCode: shippingAddress.postalCode,
          city: shippingAddress.city,
        },
        shippingAmountCents: settings?.applyTaxToShipping === false ? 0 : session.shippingAmount.cents,
        customerId: session.customerId,
        pricesIncludeTax: settings?.pricesIncludeTax,
        vatNumber: session.vatNumber,
        organizationId: storeContext?.organizationId,
        originCountry: storeContext?.country,
      });
      if (taxResult.success) {
        taxAmount = Money.fromCents(taxResult.taxAmountCents, basket.currency);
        taxIncluded = taxResult.taxIncludedInSubtotal === true;
        session.setReverseChargeApplied(taxResult.reverseChargeApplied === true);
        taxAdded =
          taxResult.taxAddedCents != null
            ? Money.fromCents(taxResult.taxAddedCents, basket.currency)
            : taxIncluded
              ? Money.zero(basket.currency)
              : taxAmount;
      }
    } catch {
      // Tax requote is best-effort — keep the previously quoted amount.
    }
    return { taxAmount, taxIncluded, taxAdded };
  }

  // The order module only requires a non-empty email — registered customers
  // without a guest email get a placeholder derived from their id.
  private resolveCustomerEmail(session: CheckoutSession): string {
    if (session.guestEmail) return session.guestEmail;
    if (session.customerId) return `customer-${session.customerId}@checkout.internal`;
    return '';
  }

  // Build shipping + billing address inputs for order creation.
  // For pickup orders, use the pickup location address from metadata.
  private buildOrderAddresses(session: CheckoutSession): {
    shippingAddressInput: OrderAddressInput;
    billingAddressInput: OrderAddressInput;
  } {
    const isPickup = session.fulfillmentType === 'pickup';
    const sa = session.shippingAddress;

    if (!sa && !isPickup) {
      throw new CheckoutValidationError('Shipping address is required');
    }

    const shippingAddressInput: OrderAddressInput = sa ? this.toOrderAddress(sa) : this.pickupOrderAddress(session);

    const ba: BillingAddressLike | null = session.billingAddress
      ? (session.billingAddress as unknown as BillingAddressLike)
      : sa
        ? (sa as unknown as BillingAddressLike)
        : null;
    const billingAddressInput: OrderAddressInput = ba ? this.toBillingAddressInput(ba) : shippingAddressInput;

    return { shippingAddressInput, billingAddressInput };
  }

  private toOrderAddress(sa: Address): OrderAddressInput {
    return {
      firstName: sa.firstName,
      lastName: sa.lastName,
      company: sa.company,
      address1: sa.addressLine1,
      address2: sa.addressLine2,
      city: sa.city,
      state: sa.region || '',
      postalCode: sa.postalCode,
      country: sa.country,
      countryCode: sa.country,
      phone: sa.phone,
    };
  }

  private pickupOrderAddress(session: CheckoutSession): OrderAddressInput {
    const pickupAddr = (session.metadata?.pickupAddress ?? {}) as PickupAddressData;
    return {
      firstName: 'Pickup',
      lastName: 'Customer',
      address1: pickupAddr.line1 || '',
      address2: pickupAddr.line2,
      city: pickupAddr.city || '',
      state: pickupAddr.state || '',
      postalCode: pickupAddr.postalCode || '',
      country: pickupAddr.country || '',
      countryCode: pickupAddr.country || '',
    };
  }

  private toBillingAddressInput(ba: BillingAddressLike): OrderAddressInput {
    return {
      firstName: ba.firstName,
      lastName: ba.lastName,
      company: ba.company,
      address1: ba.addressLine1 || ba.address1 || '',
      address2: ba.addressLine2 || ba.address2,
      city: ba.city,
      state: ba.region || ba.state || '',
      postalCode: ba.postalCode,
      country: ba.country,
      countryCode: ba.country,
      phone: ba.phone,
    };
  }

  // Map basket items to order items. Subscription lines carry a marker
  // so downstream provisioning can pick them up.
  private buildOrderItems(basketItems: CheckoutLineSnapshot[]): OrderItemInput[] {
    return basketItems.map(item => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku || 'N/A',
      name: item.name || 'Product',
      quantity: item.quantity,
      unitPriceCents: item.unitPrice?.cents ?? 0,
      isDigital: item.isDigital,
      subscriptionInfo: item.itemType === 'subscription' ? { itemType: 'subscription' } : undefined,
    }));
  }

  // Create order in PAYMENT_PENDING status — or resume the order a prior
  // attempt already placed (its id was attached to the session). A
  // cancelled order from a failed attempt is superseded by a fresh one.
  private async placeOrResumeOrder(
    session: CheckoutSession,
    basket: BasketSnapshot,
    orderInput: {
      orderItems: OrderItemInput[];
      shippingAddressInput: OrderAddressInput;
      billingAddressInput: OrderAddressInput;
      customerEmail: string;
    },
  ): Promise<OrderSnapshot> {
    let orderResponse: OrderSnapshot | null = session.orderId ? await this.deps.orderPlacementPort.findOrder(session.orderId) : null;
    if (orderResponse?.status === 'cancelled') {
      orderResponse = null;
    }
    if (!orderResponse) {
      orderResponse = await this.createPendingOrder(session, basket, orderInput);
      // Persist the order linkage immediately — a crash after this point
      // must not re-place the order on retry.
      session.attachOrder(orderResponse.orderId);
      await this.deps.checkoutRepository.save(session);
    }

    // Transition order to PAYMENT_PENDING (skipped when a resumed order is
    // already there — the order state machine rejects same-state moves).
    if (orderResponse.status !== 'pending_payment') {
      await this.deps.orderPlacementPort.updateOrderStatus(orderResponse.orderId, 'pending_payment' as CheckoutOutcome);
    }
    return orderResponse;
  }

  private async createPendingOrder(
    session: CheckoutSession,
    basket: BasketSnapshot,
    orderInput: {
      orderItems: OrderItemInput[];
      shippingAddressInput: OrderAddressInput;
      billingAddressInput: OrderAddressInput;
      customerEmail: string;
    },
  ): Promise<OrderSnapshot> {
    const taxDecision = session.metadata?.taxDecision as
      | {
          taxRegime?: string;
          taxPolicyVersion?: string;
          decisionRecord?: unknown;
          lineItems?: Array<{ productId: string; name: string; taxAmountCents: number; taxRate: number }>;
        }
      | undefined;

    return this.deps.orderPlacementPort.createOrder({
      customerId: session.customerId,
      customerEmail: orderInput.customerEmail,
      items: orderInput.orderItems,
      shippingAddress: orderInput.shippingAddressInput,
      billingAddress: orderInput.billingAddressInput,
      basketId: session.basketId,
      storeId: basket.storeId,
      channelId: basket.channelId,
      source: 'checkout',
      currency: session.total.currency,
      notes: session.notes,
      shippingAmountCents: session.shippingAmount.cents,
      taxAmountCents: session.taxAmount.cents,
      taxAddedCents: session.taxAddedAmount.cents,
      taxIncludedInSubtotal: session.taxIncludedInSubtotal,
      marketId: session.marketId,
      localeCode: session.localeCode,
      catalogCurrencyCode: basket.currency,
      displayedCurrencyCode: session.total.currency,
      versionSnapshot: {
        marketVersion: session.marketId ? String(session.metadata?.marketVersion ?? '') : undefined,
        taxPolicyVersion: taxDecision?.taxPolicyVersion,
      },
      decisionLog: taxDecision?.decisionRecord ? [taxDecision.decisionRecord] : undefined,
      appliedPromotions: session.appliedPromotions.map(p => ({
        promotionId: p.promotionId,
        code: p.promotionCode,
        name: p.name,
        discountAmountCents: p.discountAmountCents,
        targetId: p.targetId,
        ruleId: p.ruleId,
        policyVersion: p.policyVersion,
      })),
      taxLines: taxDecision?.lineItems?.map(line => ({
        name: line.name,
        rate: line.taxRate,
        amountCents: line.taxAmountCents,
        taxRegime: taxDecision.taxRegime,
        policyVersion: taxDecision.taxPolicyVersion,
      })),
      metadata: {
        ...session.metadata,
        vatNumber: session.vatNumber,
        reverseChargeApplied: session.reverseChargeApplied || undefined,
      },
    });
  }

  // Reserve tracked physical stock while payment is pending. Digital and
  // unlimited items never consume stock; backorderable items always
  // reserve fully. A tracked shortfall cancels the pending order.
  private async reserveOrderInventory(
    orderResponse: OrderSnapshot,
    basket: BasketSnapshot,
    basketItems: CheckoutLineSnapshot[],
  ): Promise<void> {
    if (!this.deps.inventoryReservationPort) return;

    const reservation = await this.deps.inventoryReservationPort.reserveForOrder({
      orderId: orderResponse.orderId,
      storeId: basket.storeId,
      channelId: basket.channelId,
      items: basketItems.map((item, index) => ({
        productId: item.productId,
        variantId: item.productVariantId,
        sku: item.sku,
        quantity: item.quantity,
        orderItemId: orderResponse.items?.[index]?.orderItemId,
        isDigital: item.isDigital,
        inventoryPolicy: item.inventoryPolicy,
      })),
    });
    if (reservation.allReserved) return;

    const shortfalls = reservation.shortfalls
      .map(s => `${s.productId} (requested ${s.requestedQuantity}, reserved ${s.reservedQuantity})`)
      .join(', ');
    await this.deps.orderPlacementPort.cancelOrder(orderResponse.orderId, 'insufficient_stock');
    await this.deps.inventoryReservationPort.releaseForOrder(orderResponse.orderId, 'cancelled');
    throw new CheckoutValidationError(`Insufficient stock to fulfill the order: ${shortfalls}`);
  }

  // Fraud screening (Epic G): screen the order before authorizing payment.
  // Blocked orders fail immediately. Review orders are flagged but proceed.
  private async screenOrderForFraud(options: {
    session: CheckoutSession;
    orderResponse: OrderSnapshot;
    customerEmail: string;
    billingCountry: string;
    shippingCountry: string;
    paymentMethodId: string;
  }): Promise<void> {
    if (!this.deps.fraudScreeningPort) return;

    const { session, orderResponse, customerEmail, billingCountry, shippingCountry, paymentMethodId } = options;
    try {
      const fraudScreeningResult = await this.deps.fraudScreeningPort.screenOrder({
        checkoutId: session.id,
        orderId: orderResponse.orderId,
        customerId: session.customerId,
        customerEmail,
        billingCountry,
        shippingCountry,
        orderAmountCents: session.total.cents,
        currency: session.total.currency,
        paymentMethodId,
        isFirstOrder: false, // Not tracked on session yet; fraud service defaults to false
        isGuestCheckout: !session.customerId,
      });

      if (fraudScreeningResult.decision === 'blocked') {
        // Mark order as blocked and fail before payment authorization
        await this.deps.orderPlacementPort.cancelOrder(orderResponse.orderId, 'fraud_blocked');
        await this.deps.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
        eventBus.emit('checkout.fraud_blocked', {
          checkoutId: session.id,
          orderId: orderResponse.orderId,
          riskScore: fraudScreeningResult.riskScore,
          riskLevel: fraudScreeningResult.riskLevel,
        });
        throw new CheckoutValidationError(`Order blocked by fraud screening (risk score: ${fraudScreeningResult.riskScore})`);
      }

      if (fraudScreeningResult.decision === 'review') {
        // Flag the order for manual review but proceed with payment
        eventBus.emit('checkout.fraud_review', {
          checkoutId: session.id,
          orderId: orderResponse.orderId,
          riskScore: fraudScreeningResult.riskScore,
          riskLevel: fraudScreeningResult.riskLevel,
        });
      }
    } catch (err) {
      // Re-throw CheckoutValidationError as-is
      if (err instanceof CheckoutValidationError) throw err;
      // If screening itself fails, log and proceed (fail-open to avoid blocking checkout on infra issues)
      // In production, this could be configured to fail-closed
    }
  }

  // Debit loyalty points for the applied reward once an order exists —
  // idempotent per orderId, so a retried intent does not double-debit.
  // A failed debit cancels the order; restore happens via order.cancelled.
  private async redeemLoyaltyPoints(session: CheckoutSession, orderResponse: OrderSnapshot): Promise<void> {
    if (!this.deps.loyaltyRedemptionPort || !session.loyaltyRewardId || session.loyaltyPointsRedeemed <= 0 || !session.customerId) {
      return;
    }

    try {
      await this.deps.loyaltyRedemptionPort.redeemPoints({
        customerId: session.customerId,
        points: session.loyaltyPointsRedeemed,
        orderId: orderResponse.orderId,
        rewardId: session.loyaltyRewardId,
      });
    } catch (err) {
      await this.deps.orderPlacementPort.cancelOrder(orderResponse.orderId, 'loyalty_redemption_failed');
      await this.deps.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
      throw new CheckoutValidationError(`Loyalty points could not be redeemed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Initiate the payment transaction; a failure releases the stock
  // reservation so abandoned intents do not hold inventory.
  private async initiateOrderPayment(session: CheckoutSession, orderResponse: OrderSnapshot, paymentMethodId: string): Promise<string> {
    try {
      const delegatedCredential = session.metadata?.delegatedPaymentCredential as
        { provider: string; credentialType: string; token: string } | undefined;
      const paymentResponse = await this.deps.paymentAuthorizationPort.initiatePayment({
        orderId: orderResponse.orderId,
        amountCents: session.total.cents,
        currency: session.total.currency,
        paymentMethodId,
        customerId: session.customerId,
        delegatedCredential,
      });
      return paymentResponse.transactionId;
    } catch (err: unknown) {
      await this.deps.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
      const cause = err instanceof Error ? err : new Error(String(err));
      throw Object.assign(new Error((err as Error).message || 'No payment gateway configured'), { cause });
    }
  }
}
