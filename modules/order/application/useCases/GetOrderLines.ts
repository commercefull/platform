/**
 * Get Order Lines Use Case
 * Public export for cross-module consumers (recommendation co-purchase
 * counting, reporting feeds): product ids on an order plus the order's
 * organization/store scope, and cursor-paged paid order ids for backfills.
 */

import type { OrderLineExportRepository, OrderLineRef } from '../../domain/repositories/OrderLineExportRepository';

export type { OrderLineRef };

export class GetOrderLinesUseCase {
  constructor(private readonly exportPort: OrderLineExportRepository) {}

  async getLines(orderId: string): Promise<OrderLineRef[]> {
    return this.exportPort.getLineRefs(orderId);
  }

  async listPaidOrderIdsSince(
    since: Date,
    cursor: string | null,
    limit: number,
  ): Promise<{ orderIds: string[]; nextCursor: string | null }> {
    return this.exportPort.listPaidOrderIdsSince(since, cursor, limit);
  }
}
