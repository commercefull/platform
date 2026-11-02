/**
 * Loyalty Repository
 *
 * Handles persistence for loyalty-related entities.
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import {
  LoyaltyTier as DbLoyaltyTier,
  LoyaltyPoints as DbLoyaltyPoints,
  LoyaltyRedemption as DbLoyaltyRedemption,
} from '../../../../libs/db/types';
import {
  LoyaltyTierNotFoundError,
  LoyaltyRewardNotFoundError,
  InsufficientPointsError,
  FailedToCreateLoyaltyError,
  NoDefaultTierError,
  RewardNotActiveError,
  LoyaltyAccountNotFoundError,
  FailedToAdjustPointsError,
} from '../../domain/errors/LoyaltyErrors';
import {
  LoyaltyTier,
  LoyaltyPoints,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyPointsAction,
} from './loyaltyRepoTypes';
import type {
  CreateLoyaltyTierInput,
  UpdateLoyaltyTierInput,
  CreateLoyaltyRewardInput,
  UpdateLoyaltyRewardInput,
  CreateLoyaltyTransactionInput,
} from './loyaltyRepoTypes';
export {
  LoyaltyTier,
  LoyaltyPoints,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyPointsAction,
} from './loyaltyRepoTypes';
export type {
  CreateLoyaltyTierInput,
  UpdateLoyaltyTierInput,
  CreateLoyaltyRewardInput,
  UpdateLoyaltyRewardInput,
  CreateLoyaltyTransactionInput,
} from './loyaltyRepoTypes';
import {
  findAllRewards as qFindAllRewards,
  findAvailableRewards as qFindAvailableRewards,
  createReward as qCreateReward,
  updateReward as qUpdateReward,
  deleteReward as qDeleteReward,
  findRewardById as qFindRewardById,
  findRedemptionById as qFindRedemptionById,
  findRedemptionByCode as qFindRedemptionByCode,
  findCustomerRedemptions as qFindCustomerRedemptions,
  updateRedemptionStatus as qUpdateRedemptionStatus,
} from './loyaltyRewardQueries';
import {
  findCreditTransactionByReference as qFindCreditTransactionByReference,
  findTransactionById as qFindTransactionById,
  findTransactionByOrderAndAction as qFindTransactionByOrderAndAction,
  findCustomerTransactions as qFindCustomerTransactions,
  createTransaction as qCreateTransaction,
} from './loyaltyTransactionQueries';

// ============================================================================
// Repository
// ============================================================================

export class LoyaltyRepo {
  // ==========================================================================
  // Tier Management
  // ==========================================================================

  async findTierById(tierId: string): Promise<LoyaltyTier | null> {
    const sql = `SELECT * FROM "loyaltyTier" WHERE "tierId" = $1`;
    return await queryOne<DbLoyaltyTier>(sql, [tierId]);
  }

  async findAllTiers(includeInactive: boolean = false): Promise<LoyaltyTier[]> {
    let sql = `SELECT * FROM "loyaltyTier"`;
    if (!includeInactive) {
      sql += ` WHERE "isActive" = true`;
    }
    sql += ` ORDER BY "pointsThreshold" ASC`;
    const results = await query<DbLoyaltyTier[]>(sql, []);
    return results || [];
  }

  async findTierByPointsThreshold(points: number): Promise<LoyaltyTier | null> {
    const sql = `
      SELECT * FROM "loyaltyTier" 
      WHERE "isActive" = true AND "pointsThreshold" <= $1 
      ORDER BY "pointsThreshold" DESC 
      LIMIT 1
    `;
    return await queryOne<DbLoyaltyTier>(sql, [points]);
  }

  async createTier(input: CreateLoyaltyTierInput): Promise<LoyaltyTier> {
    const now = new Date();
    const sql = `
      INSERT INTO "loyaltyTier" (
        "name", "description", "level", "pointsThreshold", "pointsMultiplier", 
        "benefits", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await queryOne<DbLoyaltyTier>(sql, [
      input.name,
      input.description || null,
      input.level || 1,
      input.pointsThreshold,
      input.multiplier || '1.0',
      input.benefits ? JSON.stringify(input.benefits) : null,
      input.isActive !== false,
      now,
      now,
    ]);
    if (!result) throw new FailedToCreateLoyaltyError('Failed to create loyalty tier');
    return result;
  }

  async updateTier(tierId: string, input: UpdateLoyaltyTierInput): Promise<LoyaltyTier> {
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
    if (input.type !== undefined) {
      updates.push(`"level" = $${paramIndex++}`);
      params.push(input.type);
    }
    if (input.pointsThreshold !== undefined) {
      updates.push(`"pointsThreshold" = $${paramIndex++}`);
      params.push(input.pointsThreshold);
    }
    if (input.multiplier !== undefined) {
      updates.push(`"pointsMultiplier" = $${paramIndex++}`);
      params.push(input.multiplier);
    }
    if (input.benefits !== undefined) {
      updates.push(`"benefits" = $${paramIndex++}`);
      params.push(JSON.stringify(input.benefits));
    }
    if (input.isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex++}`);
      params.push(input.isActive);
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    params.push(new Date());
    params.push(tierId);

    const sql = `
      UPDATE "loyaltyTier" 
      SET ${updates.join(', ')}
      WHERE "tierId" = $${paramIndex}
      RETURNING *
    `;
    const result = await queryOne<DbLoyaltyTier>(sql, params);
    if (!result) throw new LoyaltyTierNotFoundError(tierId);
    return result;
  }

  async deleteTier(tierId: string): Promise<boolean> {
    const sql = `DELETE FROM "loyaltyTier" WHERE "tierId" = $1`;
    await query(sql, [tierId]);
    return true;
  }

  // ==========================================================================
  // Customer Points Management
  // ==========================================================================

  async findCustomerPoints(customerId: string): Promise<LoyaltyPoints | null> {
    const sql = `SELECT * FROM "loyaltyPoints" WHERE "customerId" = $1`;
    return await queryOne<DbLoyaltyPoints>(sql, [customerId]);
  }

  async findCustomerPointsWithTier(customerId: string): Promise<{
    points: LoyaltyPoints;
    tier: LoyaltyTier;
  } | null> {
    const points = await this.findCustomerPoints(customerId);
    if (!points) return null;

    const tier = await this.findTierById(points.tierId);
    if (!tier) return null;

    return { points, tier };
  }

  async initializeCustomerPoints(customerId: string, tierId: string): Promise<LoyaltyPoints> {
    const now = new Date();
    const sql = `
      INSERT INTO "loyaltyPoints" (
        "customerId", "tierId", "currentPoints", "lifetimePoints", 
        "lastActivity", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ("customerId") DO UPDATE SET
        "tierId" = EXCLUDED."tierId",
        "updatedAt" = EXCLUDED."updatedAt"
      RETURNING *
    `;
    const result = await queryOne<DbLoyaltyPoints>(sql, [customerId, tierId, 0, 0, now, now, now]);
    if (!result) throw new FailedToCreateLoyaltyError('Failed to initialize customer points');
    return result;
  }

  async adjustCustomerPoints(params: {
    customerId: string;
    pointsChange: number;
    action: string;
    description?: string;
    orderId?: string;
    referenceId?: string;
  }): Promise<LoyaltyPoints> {
    const { customerId, pointsChange, action, description, orderId, referenceId } = params;
    const now = new Date();

    // Get or create customer points
    let customerPoints = await this.findCustomerPoints(customerId);
    if (!customerPoints) {
      // Get default tier
      const defaultTier = await this.findTierByPointsThreshold(0);
      if (!defaultTier) throw new NoDefaultTierError();
      customerPoints = await this.initializeCustomerPoints(customerId, defaultTier.tierId);
    }

    const newCurrentPoints = Math.max(0, customerPoints.currentPoints + pointsChange);
    const newLifetimePoints = pointsChange > 0 ? customerPoints.lifetimePoints + pointsChange : customerPoints.lifetimePoints;

    // Update points
    const updateSql = `
      UPDATE "loyaltyPoints" 
      SET "currentPoints" = $2, "lifetimePoints" = $3, "lastActivity" = $4, "updatedAt" = $5
      WHERE "customerId" = $1
      RETURNING *
    `;
    const updatedPoints = await queryOne<DbLoyaltyPoints>(updateSql, [customerId, newCurrentPoints, newLifetimePoints, now, now]);

    // Record transaction
    await this.createTransaction({
      customerId,
      orderId,
      action,
      points: pointsChange,
      description,
      referenceId,
    });

    // Check for tier upgrade
    await this.checkAndUpdateTier(customerId, newLifetimePoints);

    if (!updatedPoints) throw new FailedToAdjustPointsError();
    return updatedPoints;
  }

  async setMemberPoints(loyaltyPointsId: string, currentPoints: number, lifetimePoints?: number): Promise<void> {
    const sql =
      lifetimePoints === undefined
        ? `UPDATE "loyaltyPoints" SET "currentPoints" = $2, "updatedAt" = $3 WHERE "loyaltyPointsId" = $1`
        : `UPDATE "loyaltyPoints" SET "currentPoints" = $2, "lifetimePoints" = $3, "updatedAt" = $4 WHERE "loyaltyPointsId" = $1`;
    const params: unknown[] =
      lifetimePoints === undefined
        ? [loyaltyPointsId, currentPoints, new Date()]
        : [loyaltyPointsId, currentPoints, lifetimePoints, new Date()];
    await query(sql, params);
  }

  async checkAndUpdateTier(customerId: string, lifetimePoints: number): Promise<void> {
    const newTier = await this.findTierByPointsThreshold(lifetimePoints);
    if (!newTier) return;

    const sql = `
      UPDATE "loyaltyPoints" 
      SET "tierId" = $2, "updatedAt" = $3
      WHERE "customerId" = $1 AND "tierId" != $2
    `;
    await query(sql, [customerId, newTier.tierId, new Date()]);
  }

  // ==========================================================================
  // Transaction Management
  // ==========================================================================

  async findCreditTransactionByReference(referenceId: string): Promise<LoyaltyTransaction | null> {
    return qFindCreditTransactionByReference(referenceId);
  }

  async findTransactionById(loyaltyTransactionId: string): Promise<LoyaltyTransaction | null> {
    return qFindTransactionById(loyaltyTransactionId);
  }

  async findTransactionByOrderAndAction(orderId: string, action: 'credit' | 'debit'): Promise<LoyaltyTransaction | null> {
    return qFindTransactionByOrderAndAction(orderId, action);
  }

  async findCustomerTransactions(customerId: string, limit: number = 50): Promise<LoyaltyTransaction[]> {
    return qFindCustomerTransactions(customerId, limit);
  }

  async createTransaction(input: CreateLoyaltyTransactionInput): Promise<LoyaltyTransaction> {
    return qCreateTransaction(input);
  }

  async findRewardById(rewardId: string): Promise<LoyaltyReward | null> {
    return qFindRewardById(rewardId);
  }

  async findAllRewards(includeInactive: boolean = false): Promise<LoyaltyReward[]> {
    return qFindAllRewards(includeInactive);
  }

  async findAvailableRewards(currentPoints: number): Promise<LoyaltyReward[]> {
    return qFindAvailableRewards(currentPoints);
  }

  async createReward(input: CreateLoyaltyRewardInput): Promise<LoyaltyReward> {
    return qCreateReward(input);
  }

  async updateReward(rewardId: string, input: UpdateLoyaltyRewardInput): Promise<LoyaltyReward> {
    return qUpdateReward(rewardId, input);
  }

  async deleteReward(rewardId: string): Promise<boolean> {
    return qDeleteReward(rewardId);
  }

  // ==========================================================================
  // Redemption Management
  // ==========================================================================

  async findRedemptionById(loyaltyRedemptionId: string): Promise<LoyaltyRedemption | null> {
    return qFindRedemptionById(loyaltyRedemptionId);
  }

  async findRedemptionByCode(redemptionCode: string): Promise<LoyaltyRedemption | null> {
    return qFindRedemptionByCode(redemptionCode);
  }

  async findCustomerRedemptions(customerId: string, limit: number = 50): Promise<LoyaltyRedemption[]> {
    return qFindCustomerRedemptions(customerId, limit);
  }

  async redeemReward(customerId: string, rewardId: string): Promise<LoyaltyRedemption> {
    // Get reward
    const reward = await this.findRewardById(rewardId);
    if (!reward) throw new LoyaltyRewardNotFoundError(rewardId);
    if (!reward.isActive) throw new RewardNotActiveError(rewardId);

    // Get customer points
    const customerPoints = await this.findCustomerPoints(customerId);
    if (!customerPoints) throw new LoyaltyAccountNotFoundError(customerId);
    if (customerPoints.currentPoints < reward.pointsCost) {
      throw new InsufficientPointsError(reward.pointsCost, customerPoints.currentPoints);
    }

    // Generate redemption code
    const redemptionCode = `RDM-${generateUUID().substring(0, 8).toUpperCase()}`;
    const now = new Date();
    const expiresAt = reward.validTo || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create redemption
    const sql = `
      INSERT INTO "loyaltyRedemption" (
        "customerId", "rewardId", "pointsSpent", "couponCode",
        "status", "expiresAt", "redeemedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const redemption = await queryOne<DbLoyaltyRedemption>(sql, [
      customerId,
      rewardId,
      reward.pointsCost,
      redemptionCode,
      'pending',
      expiresAt,
      now,
    ]);

    if (!redemption) throw new FailedToCreateLoyaltyError('Failed to create redemption');

    // Deduct points
    await this.adjustCustomerPoints({
      customerId,
      pointsChange: -reward.pointsCost,
      action: LoyaltyPointsAction.REDEMPTION,
      description: `Redeemed: ${reward.name}`,
      referenceId: redemption.redemptionId,
    });

    return redemption;
  }

  async updateRedemptionStatus(
    loyaltyRedemptionId: string,
    status: 'pending' | 'used' | 'expired' | 'cancelled',
  ): Promise<LoyaltyRedemption> {
    return qUpdateRedemptionStatus(loyaltyRedemptionId, status);
  }

  // ==========================================================================
  // Order Points Processing
  // ==========================================================================

  async processOrderPoints(customerId: string, orderId: string, orderAmount: number): Promise<LoyaltyPoints> {
    // Get customer's tier for multiplier
    const pointsData = await this.findCustomerPointsWithTier(customerId);
    // Convert multiplier to number (PostgreSQL decimal fields are returned as strings)
    const multiplier = pointsData?.tier?.pointsMultiplier ? parseFloat(String(pointsData.tier.pointsMultiplier)) : 1;

    // Calculate points (1 point per dollar, multiplied by tier multiplier)
    const basePoints = Math.floor(orderAmount);
    const earnedPoints = Math.floor(basePoints * multiplier);

    // Add points
    return await this.adjustCustomerPoints({
      customerId,
      pointsChange: earnedPoints,
      action: LoyaltyPointsAction.PURCHASE,
      description: `Order ${orderId}: Earned ${earnedPoints} points`,
      orderId,
    });
  }
}

export default new LoyaltyRepo();
