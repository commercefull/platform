/**
 * Create Payment Intent Use Case
 * Creates a draft order in PAYMENT_PENDING and opens a payment intent with the gateway.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
import { OrderPlacementPort, CheckoutOutcome } from '../../application/ports/OrderPlacementPort';
import { PaymentAuthorizationPort } from '../../application/ports/PaymentAuthorizationPort';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { eventBus } from '../../../../libs/events/eventBus';


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
      throw new CheckoutValidationError('Session is not ready for payment. Please set shipping address, shipping method, and payment method.');
    }

    // Load basket items
    const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
    if (!basket) {
      throw new CheckoutValidationError('Basket not found');
    }

    const basketItems = basket.items;

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
      ? session.billingAddress as unknown as BillingAddressLike
      : sa
        ? sa as unknown as BillingAddressLike
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

    // Map basket items to order items
    const orderItems = basketItems.map(item => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku || 'N/A',
      name: item.name || 'Product',
      quantity: item.quantity,
      unitPrice: item.unitPrice?.amount ?? 0,
    }));

    // Create order in PAYMENT_PENDING status
    const orderResponse = await this.orderPlacementPort.createOrder({
      customerId: session.customerId,
      customerEmail,
      items: orderItems,
      shippingAddress: shippingAddressInput,
      billingAddress: billingAddressInput,
      basketId: session.basketId,
      source: 'checkout',
      currency: session.total.currency,
      notes: session.notes,
      shippingAmount: session.shippingAmount.amount,
      metadata: session.metadata,
    });

    // Transition order to PAYMENT_PENDING
    await this.orderPlacementPort.updateOrderStatus(orderResponse.orderId, 'pending_payment' as CheckoutOutcome);

    // Initiate payment transaction
    const paymentMethodId = session.paymentMethodId || 'default';

    let transactionId: string;
    try {
      const paymentResponse = await this.paymentAuthorizationPort.initiatePayment({
        orderId: orderResponse.orderId,
        amount: session.total.amount,
        currency: session.total.currency,
        paymentMethodId,
        customerId: session.customerId,
      });
      transactionId = paymentResponse.transactionId;
    } catch (err: unknown) {
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
      total: session.total.amount,
    });

    return {
      orderId: orderResponse.orderId,
      orderNumber: orderResponse.orderNumber,
      paymentIntent: { id: transactionId },
      status: 'payment_pending',
    };
  }
}
