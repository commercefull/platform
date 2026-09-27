/**
 * OrderLinesAdapter — ACL translating the recommendation module's
 * OrderLinesPort onto the order module's public GetOrderLines use case.
 * Only this file may import from order.
 */

import { getOrderLinesUseCase } from '../../../order/application/useCases/wired';
import type { OrderLineRef, OrderLinesPort } from '../../application/ports/OrderLinesPort';

export class OrderLinesAdapter implements OrderLinesPort {
  async getLines(orderId: string): Promise<OrderLineRef[]> {
    return getOrderLinesUseCase.getLines(orderId);
  }

  async listPaidOrderIdsSince(
    since: Date,
    cursor: string | null,
    limit: number,
  ): Promise<{ orderIds: string[]; nextCursor: string | null }> {
    return getOrderLinesUseCase.listPaidOrderIdsSince(since, cursor, limit);
  }
}
