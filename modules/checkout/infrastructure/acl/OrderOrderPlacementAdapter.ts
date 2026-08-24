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
  private readonly createOrderUseCase: CreateOrderUseCase;
  private readonly cancelOrderUseCase: CancelOrderUseCase;

  constructor(private readonly orderRepository: OrderRepository) {
    this.createOrderUseCase = new CreateOrderUseCase(orderRepository);
    this.cancelOrderUseCase = new CancelOrderUseCase(orderRepository);
  }

  async createOrder(request: CreateOrderRequest): Promise<OrderSnapshot> {
    const command = new CreateOrderCommand(
      request.customerId,
      request.customerEmail,
      request.items,
      request.shippingAddress,
      request.billingAddress,
      request.basketId,
      undefined, // storeId
      undefined, // channelId
      undefined, // createdByUserId
      request.source,
      request.currency,
      undefined, // customerPhone
      undefined, // customerName
      request.notes,
      request.shippingAmount,
      undefined, // hasGiftWrapping
      undefined, // giftMessage
      undefined, // isGift
      undefined, // ipAddress
      undefined, // userAgent
      undefined, // referralSource
      request.metadata,
    );

    const response = await this.createOrderUseCase.execute(command);
    const order = await this.orderRepository.findById(response.orderId);

    return {
      orderId: response.orderId,
      orderNumber: response.orderNumber,
      status: order?.status || OrderStatus.PENDING,
      paymentStatus: order?.paymentStatus || PaymentStatus.PENDING,
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
