/**
 * Create Payment Intent Use Case
 * Creates a draft order in PAYMENT_PENDING and opens a payment intent with the gateway.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketRepository } from '../../../basket/domain/repositories/BasketRepository';
import { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import { PaymentRepository } from '../../../payment/domain/repositories/PaymentRepository';
import { CreateOrderUseCase, CreateOrderCommand } from '../../../order/application/useCases/CreateOrder';
import { InitiatePaymentUseCase, InitiatePaymentCommand } from '../../../payment/application/useCases/InitiatePayment';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

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
  private readonly createOrderUseCase: CreateOrderUseCase;
  private readonly initiatePaymentUseCase: InitiatePaymentUseCase;

  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly basketRepository: BasketRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {
    this.createOrderUseCase = new CreateOrderUseCase(orderRepository);
    this.initiatePaymentUseCase = new InitiatePaymentUseCase(paymentRepository);
  }

  async execute(command: CreatePaymentIntentCommand): Promise<CreatePaymentIntentResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    // Idempotency: already in pending_payment with a payment intent
    if (session.status === 'pending_payment' && session.paymentIntentId && session.orderId) {
      const existingOrder = await this.orderRepository.findById(session.orderId);
      return {
        orderId: session.orderId,
        orderNumber: existingOrder?.orderNumber || '',
        paymentIntent: { id: session.paymentIntentId },
        status: 'payment_pending',
      };
    }

    if (!session.isReadyForPayment) {
      throw new Error('Session is not ready for payment. Please set shipping address, shipping method, and payment method.');
    }

    // Load basket items
    const basket = await this.basketRepository.findById(session.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const basketItems = await this.basketRepository.getItems(session.basketId);

    // Determine customer email
    let customerEmail = session.guestEmail || '';
    if (!customerEmail && session.customerId) {
      // Use a placeholder — the order module only requires a non-empty email
      customerEmail = `customer-${session.customerId}@checkout.internal`;
    }

    // Build shipping address for order
    const sa = session.shippingAddress;
    if (!sa) {
      throw new Error('Shipping address is required');
    }

    const shippingAddressInput = {
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

    const ba = session.billingAddress || sa;
    const billingAddressInput = {
      firstName: ba.firstName,
      lastName: ba.lastName,
      company: (ba as any).company,
      address1: ba.addressLine1,
      address2: ba.addressLine2,
      city: ba.city,
      state: (ba as any).region || '',
      postalCode: ba.postalCode,
      country: ba.country,
      countryCode: ba.country,
      phone: (ba as any).phone,
    };

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
    const createOrderCommand = new CreateOrderCommand(
      session.customerId,
      customerEmail,
      orderItems,
      shippingAddressInput,
      billingAddressInput,
      session.basketId,
      undefined, // storeId
      undefined, // channelId
      undefined, // createdByUserId
      'checkout',
      session.total.currency,
      undefined, // customerPhone
      undefined, // customerName
      session.notes,
      session.shippingAmount.amount,
    );

    const orderResponse = await this.createOrderUseCase.execute(createOrderCommand);

    // Transition order to PAYMENT_PENDING
    const order = await this.orderRepository.findById(orderResponse.orderId);
    if (order) {
      order.updateStatus(OrderStatus.PAYMENT_PENDING);
      await this.orderRepository.save(order);
    }

    // Initiate payment transaction
    const paymentMethodId = session.paymentMethodId || 'default';
    const initiatePaymentCommand = new InitiatePaymentCommand(
      orderResponse.orderId,
      session.total.amount,
      session.total.currency,
      paymentMethodId,
      session.customerId,
    );

    let transactionId: string;
    try {
      const paymentResponse = await this.initiatePaymentUseCase.execute(initiatePaymentCommand);
      transactionId = paymentResponse.transactionId;
    } catch (err: any) {
      logger.error('Failed to initiate payment:', err);
      const cause = err instanceof Error ? err : new Error(String(err));
      throw Object.assign(new Error(err.message || 'No payment gateway configured'), { cause });
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
