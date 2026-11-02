/**
 * Loyalty Transaction Queries
 *
 * Self-contained SQL for the loyaltyTransaction table.
 */

import { query, queryOne } from '../../../../libs/db';
import type { LoyaltyTransaction as DbLoyaltyTransaction } from '../../../../libs/db/types';
import { FailedToCreateLoyaltyError } from '../../domain/errors/LoyaltyErrors';
import type { CreateLoyaltyTransactionInput, LoyaltyTransaction } from './loyaltyRepoTypes';

export async function findCreditTransactionByReference(referenceId: string): Promise<LoyaltyTransaction | null> {
  const sql = `SELECT * FROM "loyaltyTransaction" WHERE action = 'credit' AND "referenceId" = $1`;
  return await queryOne<DbLoyaltyTransaction>(sql, [referenceId]);
}

export async function findTransactionById(loyaltyTransactionId: string): Promise<LoyaltyTransaction | null> {
  const sql = `SELECT * FROM "loyaltyTransaction" WHERE "loyaltyTransactionId" = $1`;
  return await queryOne<DbLoyaltyTransaction>(sql, [loyaltyTransactionId]);
}

export async function findTransactionByOrderAndAction(
  orderId: string,
  action: 'credit' | 'debit',
): Promise<LoyaltyTransaction | null> {
  const sql = `
    SELECT * FROM "loyaltyTransaction"
    WHERE "orderId" = $1 AND "action" = $2
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return await queryOne<DbLoyaltyTransaction>(sql, [orderId, action]);
}

export async function findCustomerTransactions(customerId: string, limit: number = 50): Promise<LoyaltyTransaction[]> {
  const sql = `
    SELECT * FROM "loyaltyTransaction"
    WHERE "customerId" = $1
    ORDER BY "createdAt" DESC
    LIMIT $2
  `;
  const results = await query<DbLoyaltyTransaction[]>(sql, [customerId, limit]);
  return results || [];
}

export async function createTransaction(input: CreateLoyaltyTransactionInput): Promise<LoyaltyTransaction> {
  const now = new Date();
  // DB constraint only allows 'credit' or 'debit' — map application-level actions
  const dbAction = input.points >= 0 ? 'credit' : 'debit';
  const sql = `
    INSERT INTO "loyaltyTransaction" (
      "customerId", "orderId", "action", "points", "description",
      "referenceId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await queryOne<DbLoyaltyTransaction>(sql, [
    input.customerId,
    input.orderId || null,
    dbAction,
    input.points,
    input.description || null,
    input.referenceId || null,
    now,
    now,
  ]);
  if (!result) throw new FailedToCreateLoyaltyError('Failed to create loyalty transaction');
  return result;
}
