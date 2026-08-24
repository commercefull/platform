/**
 * CheckoutOrderStatusSyncAdapter
 *
 * ACL adapter implementing payment's OrderStatusSyncPort.
 * Translates checkout + order infrastructure into payment's
 * CheckoutSyncSummary vocabulary.
 *
 * Only this adapter may import from checkout's and order's
 * infrastructure / application / domain layers.
 */

import {
  OrderStatusSyncPort,
  CheckoutSyncSummary,
} from '../../application/ports/OrderStatusSyncPort';
import CheckoutRepo from '../../../checkout/infrastructure/repositories/CheckoutRepository';
import orderDataRepository from '../../../order/infrastructure/repositories/OrderDataRepository';

const OrderRepo = orderDataRepository.commands;
import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from '../../../order/application/useCases/UpdateOrderStatus';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../order/domain/valueObjects/PaymentStatus';

export class CheckoutOrderStatusSyncAdapter implements OrderStatusSyncPort {
  async findCheckoutByPaymentIntentId(paymentIntentId: string): Promise<CheckoutSyncSummary | null> {
    const session = await CheckoutRepo.findByPaymentIntentId(paymentIntentId);
    if (!session?.orderId) return null;
    const orderId = session.orderId;

    const order = await OrderRepo.findById(orderId);

    return {
      checkoutId: session.id,
      orderId,
      customerId: session.customerId,
      totalAmount: session.total.amount,
      orderNumber: order?.orderNumber,
    };
  }

  async markOrderPaid(orderId: string): Promise<{ orderNumber?: string } | null> {
    const updateOrderStatus = new UpdateOrderStatusUseCase(OrderRepo);
    await updateOrderStatus.execute(new UpdateOrderStatusCommand(orderId, OrderStatus.PROCESSING));

    const order = await OrderRepo.findById(orderId);
    if (order) {
      order.updatePaymentStatus(PaymentStatus.PAID);
      await OrderRepo.save(order);
      return { orderNumber: order.orderNumber };
    }
    return null;
  }
}
