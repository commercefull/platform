/**
 * OrderOrderPlacementAdapter
 *
 * ACL adapter implementing checkout's OrderPlacementPort.
 * Translates order's CreateOrder, OrderRepository, OrderStatus, PaymentStatus
 * into checkout's OrderSnapshot + CheckoutOutcome vocabulary.
 *
 * This is the highest-value ACL: it removes the OrderStatus/PaymentStatus
 * type leak (V0) — checkout no longer imports order's domain value objects.
 */

import { OrderPlacementPort, CreateOrderRequest, OrderSnapshot, CheckoutOutcome } from '../../application/ports/OrderPlacementPort';
import { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import { CreateOrderUseCase, CreateOrderCommand } from '../../../order/application/useCases/CreateOrder';
import { CancelOrderUseCase, CancelOrderCommand } from '../../../order/application/useCases/CancelOrder';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../order/domain/valueObjects/PaymentStatus';

const outcomeToOrderStatus: Record<CheckoutOutcome, OrderStatus> = {
  pending_payment: OrderStatus.PAYMENT_PENDING,
  processing: OrderStatus.PROCESSING,
  cancelled: OrderStatus.CANCELLED,
  completed: OrderStatus.COMPLETED,
};

export class OrderOrderPlacementAdapter implements OrderPlacementPort {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderSnapshot> {
    const command = new CreateOrderCommand({
      customerId: request.customerId,
      customerEmail: request.customerEmail,
      items: request.items,
      shippingAddress: request.shippingAddress,
      billingAddress: request.billingAddress,
      basketId: request.basketId,
      storeId: request.storeId,
      channelId: request.channelId,
      orderSource: request.source,
      currencyCode: request.currency,
      customerNotes: request.notes,
      shippingTotalCents: request.shippingAmountCents,
      metadata: request.metadata,
      taxTotalCents: request.taxAmountCents,
      taxAddedToTotalCents: request.taxAddedCents,
      taxIncludedInSubtotal: request.taxIncludedInSubtotal,
      marketId: request.marketId,
      localeCode: request.localeCode,
      contractingEntityId: request.contractingEntityId,
      catalogCurrencyCode: request.catalogCurrencyCode,
      displayedCurrencyCode: request.displayedCurrencyCode,
      settlementCurrencyCode: request.settlementCurrencyCode,
      accountingCurrencyCode: request.accountingCurrencyCode,
      exchangeRateSnapshot: request.exchangeRateSnapshot,
      versionSnapshot: request.versionSnapshot,
      decisionLog: request.decisionLog,
      appliedPromotions: request.appliedPromotions,
      taxLines: request.taxLines,
    });

    const response = await this.createOrderUseCase.execute(command);
    const order = await this.orderRepository.findById(response.orderId);

    return {
      orderId: response.orderId,
      orderNumber: response.orderNumber,
      status: order?.status || OrderStatus.PENDING,
      paymentStatus: order?.paymentStatus || PaymentStatus.PENDING,
      items: order?.items.map(i => ({
        orderItemId: i.orderItemId,
        productId: i.productId,
        productVariantId: i.productVariantId,
      })),
    };
  }

  async findOrder(orderId: string): Promise<OrderSnapshot | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items?.map(i => ({
        orderItemId: i.orderItemId,
        productId: i.productId,
        productVariantId: i.productVariantId,
      })),
    };
  }

  async updateOrderStatus(orderId: string, outcome: CheckoutOutcome): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    const targetStatus = outcomeToOrderStatus[outcome];
    order.updateStatus(targetStatus);
    await this.orderRepository.save(order);
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    await this.cancelOrderUseCase.execute(new CancelOrderCommand(orderId, reason));
  }
}
