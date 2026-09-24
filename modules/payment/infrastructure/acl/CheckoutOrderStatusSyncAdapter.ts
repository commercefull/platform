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

import { OrderStatusSyncPort, CheckoutSyncSummary } from '../../application/ports/OrderStatusSyncPort';
import type CheckoutRepo from '../../../checkout/infrastructure/repositories/CheckoutRepository';
import type { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import { UpdateOrderStatusUseCase, UpdateOrderStatusCommand } from '../../../order/application/useCases/UpdateOrderStatus';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../order/domain/valueObjects/PaymentStatus';

export class CheckoutOrderStatusSyncAdapter implements OrderStatusSyncPort {
  constructor(
    private readonly checkoutRepo: Pick<typeof CheckoutRepo, 'findByPaymentIntentId'>,
    private readonly orderRepo: OrderRepository,
  ) {}

  async findCheckoutByPaymentIntentId(paymentIntentId: string): Promise<CheckoutSyncSummary | null> {
    const session = await this.checkoutRepo.findByPaymentIntentId(paymentIntentId);
    if (!session?.orderId) return null;
    const orderId = session.orderId;

    const order = await this.orderRepo.findById(orderId);

    return {
      checkoutId: session.id,
      orderId,
      customerId: session.customerId,
      totalAmountCents: session.total.cents,
      orderNumber: order?.orderNumber,
    };
  }

  async markOrderPaid(orderId: string): Promise<{ orderNumber?: string } | null> {
    const updateOrderStatus = new UpdateOrderStatusUseCase(this.orderRepo);
    await updateOrderStatus.execute(new UpdateOrderStatusCommand(orderId, OrderStatus.PROCESSING));

    const order = await this.orderRepo.findById(orderId);
    if (order) {
      order.updatePaymentStatus(PaymentStatus.PAID);
      await this.orderRepo.save(order);
      return { orderNumber: order.orderNumber };
    }
    return null;
  }
}
