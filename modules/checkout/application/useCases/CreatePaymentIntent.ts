/**
 * Create Payment Intent Use Case
 * Creates a draft order in PAYMENT_PENDING and opens a payment intent with the gateway.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
import { OrderPlacementPort, CheckoutOutcome, OrderSnapshot } from '../../application/ports/OrderPlacementPort';
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

// ============================================================================
// Use Case
// ============================================================================

export class CreatePaymentIntentUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly basketSnapshotPort: BasketSnapshotPort,
    private readonly orderPlacementPort: OrderPlacementPort,
    private readonly paymentAuthorizationPort: PaymentAuthorizationPort,
    private readonly fraudScreeningPort?: FraudScreeningPort,
    private readonly inventoryReservationPort?: InventoryReservationPort,
    private readonly taxQuotePort?: TaxQuotePort,
    private readonly promotionQuotePort?: PromotionQuotePort,
    private readonly loyaltyRedemptionPort?: LoyaltyRedemptionPort,
    private readonly storeContextPort?: StoreContextPort,
  ) {}

  async execute(command: CreatePaymentIntentCommand): Promise<CreatePaymentIntentResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new CheckoutSessionNotFoundError(command.checkoutId);
    }

    // Idempotency: already in pending_payment with a payment intent
    if (session.status === 'pending_payment' && session.paymentIntentId && session.orderId) {
      const existingOrder = await this.orderPlacementPort.findOrder(session.orderId);
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
    const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
    if (!basket) {
      throw new CheckoutValidationError('Basket not found');
    }

    if (basket.unpurchasableProductIds && basket.unpurchasableProductIds.length > 0) {
      throw new CheckoutValidationError(`Products no longer purchasable at checkout: ${basket.unpurchasableProductIds.join(', ')}`);
    }

    const basketItems = basket.items;

    // Reconcile the session's discount with the basket's coupon when the
    // basket carries one (recomputed against repriced prices). A session-only
    // coupon applied through checkout ApplyCoupon is left untouched.
    let totalsChanged = false;
    if (basket.couponCode && session.discountAmount.cents !== basket.discountAmountCents) {
      session.applyCoupon(basket.couponCode, Money.fromCents(basket.discountAmountCents, basket.currency));
      totalsChanged = true;
    }

    // Record requote price changes on the session so the client-facing
    // checkout summary and payment-intent response can surface a
    // price-change notice requiring customer acknowledgment.
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

    // Re-validate auto-applied promotions at the payment boundary: an
    // expired or no-longer-eligible promotion must not keep its stale
    // discount. Explicit coupons are managed by the apply/requote paths.
    if (this.promotionQuotePort && session.couponCode === 'AUTO_PROMOTION') {
      try {
        const promoResult = await this.promotionQuotePort.evaluatePromotions({
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
        if (evaluatedCents !== session.discountAmount.cents) {
          if (evaluatedCents > 0) {
            session.applyCoupon('AUTO_PROMOTION', Money.fromCents(evaluatedCents, basket.currency));
          } else {
            session.removeCoupon();
          }
          totalsChanged = true;
        }
      } catch {
        // Promotion revalidation is best-effort — keep the applied amount.
      }
    }

    // Authoritative tax requote at the payment boundary: covers price changes
    // from the basket requote and shipping-tax changes since the quote taken
    // when the shipping address was set (a shipping method may have been
    // selected afterwards).
    if (this.taxQuotePort && session.shippingAddress) {
      let taxAmount = session.taxAmount;
      let taxIncluded = session.taxIncludedInSubtotal;
      let taxAdded = session.taxAddedAmount;
      try {
        const settings = await this.taxQuotePort.getTaxSettings('default');
        const storeContext = basket.storeId && this.storeContextPort ? await this.storeContextPort.getStoreContext(basket.storeId) : null;
        const taxResult = await this.taxQuotePort.calculateTax({
          items: basketItems.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPrice.cents,
            taxCategoryId: item.taxCategoryId,
            taxable: item.taxable,
          })),
          shippingAddress: {
            country: session.shippingAddress.country,
            region: session.shippingAddress.region,
            postalCode: session.shippingAddress.postalCode,
            city: session.shippingAddress.city,
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
      const totalsDiffer =
        session.subtotal.cents !== basket.subtotal.cents ||
        session.taxAmount.cents !== taxAmount.cents ||
        session.taxAddedAmount.cents !== taxAdded.cents ||
        session.taxIncludedInSubtotal !== taxIncluded;
      session.updateAmounts(basket.subtotal, taxAmount, taxIncluded, taxAdded);
      if (totalsDiffer) totalsChanged = true;
    } else if (basket.repriced) {
      session.updateAmounts(basket.subtotal, session.taxAmount, session.taxIncludedInSubtotal, session.taxAddedAmount);
      totalsChanged = true;
    }
    if (totalsChanged) {
      await this.checkoutRepository.save(session);
    }

    // Determine customer email
    let customerEmail = session.guestEmail || '';
    if (!customerEmail && session.customerId) {
      // Use a placeholder — the order module only requires a non-empty email
      customerEmail = `customer-${session.customerId}@checkout.internal`;
    }

    // Build shipping address for order
    // For pickup orders, use the pickup location address from metadata
    const isPickup = session.fulfillmentType === 'pickup';
    const sa = session.shippingAddress;

    if (!sa && !isPickup) {
      throw new CheckoutValidationError('Shipping address is required');
    }

    interface PickupAddressData {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }

    const pickupAddr = (session.metadata?.pickupAddress ?? {}) as PickupAddressData;
    const shippingAddressInput = sa
      ? {
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
        }
      : {
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

    const ba: BillingAddressLike | null = session.billingAddress
      ? (session.billingAddress as unknown as BillingAddressLike)
      : sa
        ? (sa as unknown as BillingAddressLike)
        : null;
    const billingAddressInput = ba
      ? {
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
        }
      : shippingAddressInput;

    // Map basket items to order items. Subscription lines carry a marker
    // so downstream provisioning can pick them up.
    const orderItems = basketItems.map(item => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku || 'N/A',
      name: item.name || 'Product',
      quantity: item.quantity,
      unitPriceCents: item.unitPrice?.cents ?? 0,
      isDigital: item.isDigital,
      subscriptionInfo: item.itemType === 'subscription' ? { itemType: 'subscription' } : undefined,
    }));

    // Create order in PAYMENT_PENDING status — or resume the order a prior
    // attempt already placed (its id was attached to the session). A
    // cancelled order from a failed attempt is superseded by a fresh one.
    let orderResponse: OrderSnapshot | null = session.orderId ? await this.orderPlacementPort.findOrder(session.orderId) : null;
    if (orderResponse?.status === 'cancelled') {
      orderResponse = null;
    }
    if (!orderResponse) {
      orderResponse = await this.orderPlacementPort.createOrder({
        customerId: session.customerId,
        customerEmail,
        items: orderItems,
        shippingAddress: shippingAddressInput,
        billingAddress: billingAddressInput,
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
        metadata: {
          ...session.metadata,
          vatNumber: session.vatNumber,
          reverseChargeApplied: session.reverseChargeApplied || undefined,
        },
      });
      // Persist the order linkage immediately — a crash after this point
      // must not re-place the order on retry.
      session.attachOrder(orderResponse.orderId);
      await this.checkoutRepository.save(session);
    }

    // Transition order to PAYMENT_PENDING (skipped when a resumed order is
    // already there — the order state machine rejects same-state moves).
    if (orderResponse.status !== 'pending_payment') {
      await this.orderPlacementPort.updateOrderStatus(orderResponse.orderId, 'pending_payment' as CheckoutOutcome);
    }

    // Reserve tracked physical stock while payment is pending. Digital and
    // unlimited items never consume stock; backorderable items always
    // reserve fully. A tracked shortfall cancels the pending order.
    if (this.inventoryReservationPort) {
      const reservation = await this.inventoryReservationPort.reserveForOrder({
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
      if (!reservation.allReserved) {
        const shortfalls = reservation.shortfalls
          .map(s => `${s.productId} (requested ${s.requestedQuantity}, reserved ${s.reservedQuantity})`)
          .join(', ');
        await this.orderPlacementPort.cancelOrder(orderResponse.orderId, 'insufficient_stock');
        await this.inventoryReservationPort.releaseForOrder(orderResponse.orderId, 'cancelled');
        throw new CheckoutValidationError(`Insufficient stock to fulfill the order: ${shortfalls}`);
      }
    }

    // Initiate payment transaction
    // (declared before fraud screening so it can be used in the screening request)
    const paymentMethodId = session.paymentMethodId || 'default';

    // Fraud screening (Epic G): screen the order before authorizing payment.
    // Blocked orders fail immediately. Review orders are flagged but proceed.
    if (this.fraudScreeningPort) {
      try {
        const fraudScreeningResult = await this.fraudScreeningPort.screenOrder({
          checkoutId: session.id,
          orderId: orderResponse.orderId,
          customerId: session.customerId,
          customerEmail,
          billingCountry: billingAddressInput.country,
          shippingCountry: shippingAddressInput.country,
          orderAmountCents: session.total.cents,
          currency: session.total.currency,
          paymentMethodId,
          isFirstOrder: false, // Not tracked on session yet; fraud service defaults to false
          isGuestCheckout: !session.customerId,
        });

        if (fraudScreeningResult.decision === 'blocked') {
          // Mark order as blocked and fail before payment authorization
          await this.orderPlacementPort.cancelOrder(orderResponse.orderId, 'fraud_blocked');
          await this.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
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
    if (this.loyaltyRedemptionPort && session.loyaltyRewardId && session.loyaltyPointsRedeemed > 0 && session.customerId) {
      try {
        await this.loyaltyRedemptionPort.redeemPoints({
          customerId: session.customerId,
          points: session.loyaltyPointsRedeemed,
          orderId: orderResponse.orderId,
          rewardId: session.loyaltyRewardId,
        });
      } catch (err) {
        await this.orderPlacementPort.cancelOrder(orderResponse.orderId, 'loyalty_redemption_failed');
        await this.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
        throw new CheckoutValidationError(`Loyalty points could not be redeemed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    let transactionId: string;
    try {
      const delegatedCredential = session.metadata?.delegatedPaymentCredential as
        { provider: string; credentialType: string; token: string } | undefined;
      const paymentResponse = await this.paymentAuthorizationPort.initiatePayment({
        orderId: orderResponse.orderId,
        amountCents: session.total.cents,
        currency: session.total.currency,
        paymentMethodId,
        customerId: session.customerId,
        delegatedCredential,
      });
      transactionId = paymentResponse.transactionId;
    } catch (err: unknown) {
      // Payment could not be initiated — release the stock reservation so
      // abandoned intents do not hold inventory.
      await this.inventoryReservationPort?.releaseForOrder(orderResponse.orderId, 'cancelled');
      const cause = err instanceof Error ? err : new Error(String(err));
      throw Object.assign(new Error((err as Error).message || 'No payment gateway configured'), { cause });
    }

    // Persist orderId + paymentIntentId on session
    session.setPaymentIntent(transactionId, orderResponse.orderId);
    await this.checkoutRepository.save(session);

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
}
