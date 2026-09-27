/**
 * Backfill Co-Purchase Use Case
 * Spec §6.4 — one-off job: page through paid orders via OrderLinesPort and
 * run the same onOrderPaid logic. The ledger makes re-runs safe.
 */

import type { OrderLinesPort } from '../ports/OrderLinesPort';
import type { RecordOrderCoPurchaseUseCase } from './RecordOrderCoPurchase';
import type { RebuildRecommendationsUseCase } from './RebuildRecommendations';
import { logger } from '../../../../libs/logger';

export class BackfillCoPurchaseCommand {
  constructor(
    public readonly organizationId: string,
    public readonly sinceDays: number = 180,
  ) {}
}

export class BackfillCoPurchaseUseCase {
  constructor(
    private readonly orderLines: OrderLinesPort,
    private readonly recorder: RecordOrderCoPurchaseUseCase,
    private readonly rebuild: RebuildRecommendationsUseCase,
  ) {}

  async execute(command: BackfillCoPurchaseCommand): Promise<{ processed: number }> {
    const since = new Date(Date.now() - command.sinceDays * 24 * 60 * 60 * 1000);
    let cursor: string | null = null;
    let processed = 0;

    do {
      const page = await this.orderLines.listPaidOrderIdsSince(since, cursor, 200);
      for (const orderId of page.orderIds) {
        await this.recorder.onOrderPaid(orderId);
        processed++;
      }
      cursor = page.nextCursor;
    } while (cursor);

    await this.rebuild.execute({ organizationId: command.organizationId });
    logger.info('Co-purchase backfill complete', { organizationId: command.organizationId, processed });
    return { processed };
  }
}
