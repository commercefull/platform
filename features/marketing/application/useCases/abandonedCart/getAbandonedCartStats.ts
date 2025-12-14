/**
 * Get Abandoned Cart Statistics Use Case
 */

import * as abandonedCartRepo from '../../../repos/abandonedCartRepo';

export interface GetAbandonedCartStatsInput {
  startDate?: Date;
  endDate?: Date;
}

export interface AbandonedCartStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  averageCartValue: number;
}

export interface GetAbandonedCartStatsOutput {
  stats: AbandonedCartStats;
}

export async function getAbandonedCartStats(input: GetAbandonedCartStatsInput): Promise<GetAbandonedCartStatsOutput> {
  const stats = await abandonedCartRepo.getAbandonedCartStats(
    input.startDate,
    input.endDate
  );

  return { stats };
}
