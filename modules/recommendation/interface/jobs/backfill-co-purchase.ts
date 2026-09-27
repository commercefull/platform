/**
 * Job: Backfill co-purchase counts from paid orders
 *
 * Pages through paid orders via OrderLinesPort and runs the same
 * onOrderPaid logic as the live event handler, then runs a rebuild.
 * Safe to re-run — the processed-order ledger skips counted orders.
 *
 * Usage:
 * yarn job:recommendation:backfill --org=<organizationId> [--days=180]
 */

import { backfillCoPurchaseUseCase } from '../../application/useCases/wired';
import { logger } from '../../../../libs/logger';

async function run() {
  const args = process.argv.slice(2);
  const orgArg = args.find(arg => arg.startsWith('--org='));
  const organizationId = orgArg ? orgArg.split('=')[1] : null;
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 180;

  if (!organizationId) {
    console.error('Missing required parameter: --org=<organizationId> [--days=180]');
    process.exit(1);
  }

  const result = await backfillCoPurchaseUseCase.execute({ organizationId, sinceDays: days });
  logger.info('Backfill finished', { organizationId, ordersProcessed: result.processed });
  process.exit(0);
}

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
