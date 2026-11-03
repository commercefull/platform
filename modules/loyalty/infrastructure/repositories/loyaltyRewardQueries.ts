/**
 * Loyalty Reward & Redemption Queries
 *
 * Self-contained SQL for the loyaltyReward and loyaltyRedemption tables.
 * Cross-entity flows (redeemReward, processOrderPoints) live in LoyaltyRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type { LoyaltyReward as DbLoyaltyReward, LoyaltyRedemption as DbLoyaltyRedemption } from '../../../../libs/db/types';
import { LoyaltyRewardNotFoundError, RedemptionNotFoundError, FailedToCreateLoyaltyError } from '../../domain/errors/LoyaltyErrors';
import type { CreateLoyaltyRewardInput, LoyaltyRedemption, LoyaltyReward, UpdateLoyaltyRewardInput } from './loyaltyRepoTypes';

// ============================================================================
// Reward Queries
// ============================================================================

export async function findRewardById(rewardId: string): Promise<LoyaltyReward | null> {
  const sql = `SELECT * FROM "loyaltyReward" WHERE "rewardId" = $1`;
  return await queryOne<DbLoyaltyReward>(sql, [rewardId]);
}

export async function findAllRewards(includeInactive: boolean = false): Promise<LoyaltyReward[]> {
  let sql = `SELECT * FROM "loyaltyReward"`;
  if (!includeInactive) {
    sql += ` WHERE "isActive" = true`;
  }
  sql += ` ORDER BY "pointsCost" ASC`;
  const results = await query<DbLoyaltyReward[]>(sql, []);
  return results || [];
}

export async function findAvailableRewards(currentPoints: number): Promise<LoyaltyReward[]> {
  const sql = `
    SELECT * FROM "loyaltyReward"
    WHERE "isActive" = true AND "pointsCost" <= $1
    ORDER BY "pointsCost" DESC
  `;
  const results = await query<DbLoyaltyReward[]>(sql, [currentPoints]);
  return results || [];
}

export async function createReward(input: CreateLoyaltyRewardInput): Promise<LoyaltyReward> {
  const now = new Date();
  const sql = `
    INSERT INTO "loyaltyReward" (
      "name", "description", "type", "pointsCost", "value", "valueType",
      "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await queryOne<DbLoyaltyReward>(sql, [
    input.name,
    input.description || null,
    input.type || 'discount',
    input.pointsCost,
    input.discountAmountCents ? String(input.discountAmountCents) : null,
    input.discountPercent ? 'percent' : 'amountCents',
    input.isActive !== false,
    now,
    now,
  ]);
  if (!result) throw new FailedToCreateLoyaltyError('Failed to create loyalty reward');
  return result;
}

export async function updateReward(rewardId: string, input: UpdateLoyaltyRewardInput): Promise<LoyaltyReward> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`"name" = $${paramIndex++}`);
    params.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push(`"description" = $${paramIndex++}`);
    params.push(input.description);
  }
  if (input.pointsCost !== undefined) {
    updates.push(`"pointsCost" = $${paramIndex++}`);
    params.push(input.pointsCost);
  }
  if (input.isActive !== undefined) {
    updates.push(`"isActive" = $${paramIndex++}`);
    params.push(input.isActive);
  }

  updates.push(`"updatedAt" = $${paramIndex++}`);
  params.push(new Date());
  params.push(rewardId);

  const sql = `
    UPDATE "loyaltyReward"
    SET ${updates.join(', ')}
    WHERE "rewardId" = $${paramIndex}
    RETURNING *
  `;
  const result = await queryOne<DbLoyaltyReward>(sql, params);
  if (!result) throw new LoyaltyRewardNotFoundError(rewardId);
  return result;
}

export async function deleteReward(rewardId: string): Promise<boolean> {
  const sql = `DELETE FROM "loyaltyReward" WHERE "rewardId" = $1`;
  await query(sql, [rewardId]);
  return true;
}

// ============================================================================
// Redemption Queries
// ============================================================================

export async function findRedemptionById(loyaltyRedemptionId: string): Promise<LoyaltyRedemption | null> {
  const sql = `SELECT * FROM "loyaltyRedemption" WHERE "redemptionId" = $1`;
  return await queryOne<DbLoyaltyRedemption>(sql, [loyaltyRedemptionId]);
}

export async function findRedemptionByCode(redemptionCode: string): Promise<LoyaltyRedemption | null> {
  const sql = `SELECT * FROM "loyaltyRedemption" WHERE "couponCode" = $1`;
  return await queryOne<DbLoyaltyRedemption>(sql, [redemptionCode]);
}

export async function findCustomerRedemptions(customerId: string, limit: number = 50): Promise<LoyaltyRedemption[]> {
  const sql = `
    SELECT * FROM "loyaltyRedemption"
    WHERE "customerId" = $1
    ORDER BY "redeemedAt" DESC
    LIMIT $2
  `;
  const results = await query<DbLoyaltyRedemption[]>(sql, [customerId, limit]);
  return results || [];
}

export async function updateRedemptionStatus(
  loyaltyRedemptionId: string,
  status: 'pending' | 'used' | 'expired' | 'cancelled',
): Promise<LoyaltyRedemption> {
  const now = new Date();
  const usedAt = status === 'used' ? now : null;

  const sql = `
    UPDATE "loyaltyRedemption"
    SET "status" = $2, "usedAt" = $3
    WHERE "redemptionId" = $1
    RETURNING *
  `;
  const result = await queryOne<DbLoyaltyRedemption>(sql, [loyaltyRedemptionId, status, usedAt]);
  if (!result) throw new RedemptionNotFoundError(loyaltyRedemptionId);
  return result;
}
