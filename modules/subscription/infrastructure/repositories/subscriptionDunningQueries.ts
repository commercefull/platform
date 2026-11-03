/**
 * Dunning attempt queries — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type { DunningAttempt, DunningStatus } from './subscriptionTypes';
import { mapToDunningAttempt } from './subscriptionHelpers';
import type { SubscriptionDunningAttempt as DbSubscriptionDunningAttempt } from '../../../../libs/db/types';


export async function createDunningAttempt(attempt: {
  customerSubscriptionId: string;
  subscriptionOrderId?: string;
  attemptNumber: number;
  amountCents: number;
  currency?: string;
  scheduledAt: Date;
}): Promise<DunningAttempt> {
  const now = new Date().toISOString();

  const result = await queryOne<DbSubscriptionDunningAttempt>(
    `INSERT INTO "subscriptionDunningAttempt" (
      "customerSubscriptionId", "subscriptionOrderId", "attemptNumber",
      "status", "amountCents", "currencyCode", "scheduledAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      attempt.customerSubscriptionId,
      attempt.subscriptionOrderId,
      attempt.attemptNumber,
      attempt.amountCents,
      attempt.currency || 'USD',
      attempt.scheduledAt.toISOString(),
      now,
      now,
    ],
  );

  return mapToDunningAttempt(result!);
}

export async function getDunningAttempts(customerSubscriptionId: string): Promise<DunningAttempt[]> {
  const rows = await query<DbSubscriptionDunningAttempt[]>('SELECT * FROM "subscriptionDunningAttempt" WHERE "customerSubscriptionId" = $1 ORDER BY "attemptNumber" ASC',
    [customerSubscriptionId],
  );
  return (rows || []).map(mapToDunningAttempt);
}

export async function getPendingDunningAttempts(beforeDate: Date): Promise<DunningAttempt[]> {
  const rows = await query<DbSubscriptionDunningAttempt[]>(`SELECT * FROM "subscriptionDunningAttempt" 
     WHERE "status" = 'pending' AND "scheduledAt" <= $1 
     ORDER BY "scheduledAt" ASC`,
    [beforeDate.toISOString()],
  );
  return (rows || []).map(mapToDunningAttempt);
}

export async function updateDunningAttempt(
  dunningAttemptId: string,
  status: DunningStatus,
  additionalFields?: Partial<DunningAttempt>,
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: unknown[] = [status, now];
  let paramIndex = 3;

  if (status !== 'pending') {
    setClause += `, "attemptedAt" = $${paramIndex++}`;
    params.push(now);
  }
  if (additionalFields?.failureCode) {
    setClause += `, "failureCode" = $${paramIndex++}`;
    params.push(additionalFields.failureCode);
  }
  if (additionalFields?.failureMessage) {
    setClause += `, "failureMessage" = $${paramIndex++}`;
    params.push(additionalFields.failureMessage);
  }
  if (additionalFields?.paymentIntentId) {
    setClause += `, "paymentIntentId" = $${paramIndex++}`;
    params.push(additionalFields.paymentIntentId);
  }

  params.push(dunningAttemptId);
  await query(`UPDATE "subscriptionDunningAttempt" SET ${setClause} WHERE "dunningAttemptId" = $${paramIndex}`, params);
}

