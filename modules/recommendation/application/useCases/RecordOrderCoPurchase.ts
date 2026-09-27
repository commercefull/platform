/**
 * Record Order Co-Purchase Use Case
 * Spec §6.2 — incremental update on `order.paid` and reversal on
 * `order.cancelled` / `order.refunded` (full refund only).
 *
 * Idempotency: the `recommendationProcessedOrder` ledger records each
 * counted order — `order.paid` may be emitted more than once (webhook and
 * sync paths) and the outbox is at-least-once.
 */

import type { CoPurchaseRepository, ProcessedOrderRepository } from '../../domain/repositories/CoPurchaseRepository';
import type { OrderLinesPort } from '../ports/OrderLinesPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { logger } from '../../../../libs/logger';

export class RecordOrderCoPurchaseUseCase {
  constructor(
    private readonly signals: CoPurchaseRepository,
    private readonly ledger: ProcessedOrderRepository,
    private readonly orderLines: OrderLinesPort,
    private readonly config: RecommendationConfigPort,
  ) {}

  async onOrderPaid(orderId: string): Promise<void> {
    const existing = await this.ledger.get(orderId);
    if (existing) return; // already counted/skipped — idempotent

    const lines = await this.orderLines.getLines(orderId);
    const productIds = [...new Set(lines.map(l => l.productId).filter(Boolean))];
    const scope = {
      organizationId: lines.find(l => l.organizationId)?.organizationId ?? '',
      storeId: lines.find(l => l.storeId)?.storeId ?? null,
    };

    if (!scope.organizationId) {
      // Unscoped order (no organization on lines) — record as skipped so we
      // never reprocess, but don't pollute a tenant's stats.
      await this.ledger.insert({ orderId, organizationId: '', storeId: null, productIds: [], status: 'skipped' });
      return;
    }

    const cfg = await this.config.getConfig(scope.organizationId, scope.storeId ?? undefined);
    if (productIds.length === 0 || productIds.length > cfg.fbtMaxItemsPerOrder) {
      await this.ledger.insert({ orderId, ...scope, productIds, status: 'skipped' });
      return;
    }

    try {
      await this.signals.incrementProductCounts(scope, productIds);
      await this.signals.incrementTotalOrders(scope);
      if (productIds.length > 1) {
        await this.signals.incrementPairs(scope, productIds);
      }
      await this.ledger.insert({ orderId, ...scope, productIds, status: 'counted' });
    } catch (err) {
      // If the ledger insert raced with a duplicate event, treat as done.
      const raced = await this.ledger.get(orderId);
      if (raced) return;
      throw err;
    }
  }

  async onOrderReversed(orderId: string): Promise<void> {
    const record = await this.ledger.get(orderId);
    if (!record || record.status !== 'counted' || !record.organizationId) return;

    const scope = { organizationId: record.organizationId, storeId: record.storeId };
    await this.signals.incrementProductCounts(scope, record.productIds, -1);
    await this.signals.incrementTotalOrders(scope, -1);
    if (record.productIds.length > 1) {
      await this.signals.decrementPairs(scope, record.productIds);
    }
    await this.ledger.markStatus(orderId, 'reversed');
    logger.info('Reversed co-purchase counts for order', { orderId });
  }
}
