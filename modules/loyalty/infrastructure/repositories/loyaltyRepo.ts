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
  LoyaltyTransaction as DbLoyaltyTransaction,
  LoyaltyReward as DbLoyaltyReward,
  LoyaltyRedemption as DbLoyaltyRedemption,
} from '../../../../libs/db/types';
import {
  LoyaltyTierNotFoundError,
  LoyaltyRewardNotFoundError,
  RedemptionNotFoundError,
  InsufficientPointsError,
  FailedToCreateLoyaltyError,
  NoDefaultTierError,
  RewardNotActiveError,
  LoyaltyAccountNotFoundError,
  FailedToAdjustPointsError,
} from '../../domain/errors/LoyaltyErrors';

// ============================================================================
// Re-export types
// ============================================================================

export type LoyaltyTier = DbLoyaltyTier;
export type LoyaltyPoints = DbLoyaltyPoints;
export type LoyaltyTransaction = DbLoyaltyTransaction;
export type LoyaltyReward = DbLoyaltyReward;
export type LoyaltyRedemption = DbLoyaltyRedemption;

// ============================================================================
// Enums
// ============================================================================

export enum LoyaltyTierType {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  CUSTOM = 'custom',
}

export enum LoyaltyPointsAction {
  PURCHASE = 'purchase',
  REVIEW = 'review',
  REFERRAL = 'referral',
  SIGNUP = 'signup',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  REDEMPTION = 'redemption',
  EXPIRATION = 'expiration',
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateLoyaltyTierInput {
  name: string;
  description?: string;
  type: string;
  level?: number;
  pointsThreshold: number;
  multiplier: number;
  benefits?: unknown;
  isActive?: boolean;
}

export interface UpdateLoyaltyTierInput {
  name?: string;
  description?: string;
  type?: string;
  pointsThreshold?: number;
  multiplier?: number;
  benefits?: unknown;
  isActive?: boolean;
}

export interface CreateLoyaltyRewardInput {
  name: string;
  description?: string;
  type?: string;
  pointsCost: number;
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: unknown;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface UpdateLoyaltyRewardInput {
  name?: string;
  description?: string;
  pointsCost?: number;
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping?: boolean;
  productIds?: unknown;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface CreateLoyaltyTransactionInput {
  customerId: string;
  orderId?: string;
  action: string;
  points: number;
  description?: string;
  referenceId?: string;
}

// ============================================================================
// Repository
// ============================================================================

export class LoyaltyRepo {
  // ==========================================================================
  // Tier Management
  // ==========================================================================

  async findTierById(tierId: string): Promise<LoyaltyTier | null> {
    const sql = `SELECT * FROM "loyaltyTier" WHERE "tierId" = $1`;
    return await queryOne<LoyaltyTier>(sql, [tierId]);
  }

  async findAllTiers(includeInactive: boolean = false): Promise<LoyaltyTier[]> {
    let sql = `SELECT * FROM "loyaltyTier"`;
    if (!includeInactive) {
      sql += ` WHERE "isActive" = true`;
    }
    sql += ` ORDER BY "pointsThreshold" ASC`;
    const results = await query<LoyaltyTier[]>(sql, []);
    return results || [];
  }

  async findTierByPointsThreshold(points: number): Promise<LoyaltyTier | null> {
    const sql = `
      SELECT * FROM "loyaltyTier" 
      WHERE "isActive" = true AND "pointsThreshold" <= $1 
      ORDER BY "pointsThreshold" DESC 
      LIMIT 1
    `;
    return await queryOne<LoyaltyTier>(sql, [points]);
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
    const result = await queryOne<LoyaltyTier>(sql, [
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
    const result = await queryOne<LoyaltyTier>(sql, params);
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
    return await queryOne<LoyaltyPoints>(sql, [customerId]);
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
    const result = await queryOne<LoyaltyPoints>(sql, [customerId, tierId, 0, 0, now, now, now]);
    if (!result) throw new FailedToCreateLoyaltyError('Failed to initialize customer points');
    return result;
  }

  async adjustCustomerPoints(
    customerId: string,
    pointsChange: number,
    action: string,
    description?: string,
    orderId?: string,
    referenceId?: string,
  ): Promise<LoyaltyPoints> {
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
    const updatedPoints = await queryOne<LoyaltyPoints>(updateSql, [customerId, newCurrentPoints, newLifetimePoints, now, now]);

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

  async findTransactionById(loyaltyTransactionId: string): Promise<LoyaltyTransaction | null> {
    const sql = `SELECT * FROM "loyaltyTransaction" WHERE "loyaltyTransactionId" = $1`;
    return await queryOne<LoyaltyTransaction>(sql, [loyaltyTransactionId]);
  }

  async findCustomerTransactions(customerId: string, limit: number = 50): Promise<LoyaltyTransaction[]> {
    const sql = `
      SELECT * FROM "loyaltyTransaction" 
      WHERE "customerId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<LoyaltyTransaction[]>(sql, [customerId, limit]);
    return results || [];
  }

  async createTransaction(input: CreateLoyaltyTransactionInput): Promise<LoyaltyTransaction> {
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
    const result = await queryOne<LoyaltyTransaction>(sql, [
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

  async findRewardById(rewardId: string): Promise<LoyaltyReward | null> {
    const sql = `SELECT * FROM "loyaltyReward" WHERE "rewardId" = $1`;
    return await queryOne<LoyaltyReward>(sql, [rewardId]);
  }

  async findAllRewards(includeInactive: boolean = false): Promise<LoyaltyReward[]> {
    let sql = `SELECT * FROM "loyaltyReward"`;
    if (!includeInactive) {
      sql += ` WHERE "isActive" = true`;
    }
    sql += ` ORDER BY "pointsCost" ASC`;
    const results = await query<LoyaltyReward[]>(sql, []);
    return results || [];
  }

  async findAvailableRewards(currentPoints: number): Promise<LoyaltyReward[]> {
    const sql = `
      SELECT * FROM "loyaltyReward" 
      WHERE "isActive" = true AND "pointsCost" <= $1
      ORDER BY "pointsCost" DESC
    `;
    const results = await query<LoyaltyReward[]>(sql, [currentPoints]);
    return results || [];
  }

  async createReward(input: CreateLoyaltyRewardInput): Promise<LoyaltyReward> {
    const now = new Date();
    const sql = `
      INSERT INTO "loyaltyReward" (
        "name", "description", "type", "pointsCost", "value", "valueType",
        "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await queryOne<LoyaltyReward>(sql, [
      input.name,
      input.description || null,
      input.type || 'discount',
      input.pointsCost,
      input.discountAmount ? String(input.discountAmount) : null,
      input.discountPercent ? 'percent' : 'amount',
      input.isActive !== false,
      now,
      now,
    ]);
    if (!result) throw new FailedToCreateLoyaltyError('Failed to create loyalty reward');
    return result;
  }

  async updateReward(rewardId: string, input: UpdateLoyaltyRewardInput): Promise<LoyaltyReward> {
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
    const result = await queryOne<LoyaltyReward>(sql, params);
    if (!result) throw new LoyaltyRewardNotFoundError(rewardId);
    return result;
  }

  async deleteReward(rewardId: string): Promise<boolean> {
    const sql = `DELETE FROM "loyaltyReward" WHERE "rewardId" = $1`;
    await query(sql, [rewardId]);
    return true;
  }

  // ==========================================================================
  // Redemption Management
  // ==========================================================================

  async findRedemptionById(loyaltyRedemptionId: string): Promise<LoyaltyRedemption | null> {
    const sql = `SELECT * FROM "loyaltyRedemption" WHERE "loyaltyRedemptionId" = $1`;
    return await queryOne<LoyaltyRedemption>(sql, [loyaltyRedemptionId]);
  }

  async findRedemptionByCode(redemptionCode: string): Promise<LoyaltyRedemption | null> {
    const sql = `SELECT * FROM "loyaltyRedemption" WHERE "redemptionCode" = $1`;
    return await queryOne<LoyaltyRedemption>(sql, [redemptionCode]);
  }

  async findCustomerRedemptions(customerId: string, limit: number = 50): Promise<LoyaltyRedemption[]> {
    const sql = `
      SELECT * FROM "loyaltyRedemption" 
      WHERE "customerId" = $1 
      ORDER BY "redeemedAt" DESC 
      LIMIT $2
    `;
    const results = await query<LoyaltyRedemption[]>(sql, [customerId, limit]);
    return results || [];
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
        "customerId", "rewardId", "pointsSpent", "redemptionCode", 
        "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const redemption = await queryOne<LoyaltyRedemption>(sql, [
      customerId,
      rewardId,
      reward.pointsCost,
      redemptionCode,
      'pending',
      expiresAt,
      now,
      now,
    ]);

    if (!redemption) throw new FailedToCreateLoyaltyError('Failed to create redemption');

    // Deduct points
    await this.adjustCustomerPoints(
      customerId,
      -reward.pointsCost,
      LoyaltyPointsAction.REDEMPTION,
      `Redeemed: ${reward.name}`,
      undefined,
      redemption.redemptionId,
    );

    return redemption;
  }

  async updateRedemptionStatus(
    loyaltyRedemptionId: string,
    status: 'pending' | 'used' | 'expired' | 'cancelled',
  ): Promise<LoyaltyRedemption> {
    const now = new Date();
    const usedAt = status === 'used' ? now : null;

    const sql = `
      UPDATE "loyaltyRedemption" 
      SET "status" = $2, "usedAt" = $3, "updatedAt" = $4
      WHERE "loyaltyRedemptionId" = $1
      RETURNING *
    `;
    const result = await queryOne<LoyaltyRedemption>(sql, [loyaltyRedemptionId, status, usedAt, now]);
    if (!result) throw new RedemptionNotFoundError(loyaltyRedemptionId);
    return result;
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
    return await this.adjustCustomerPoints(
      customerId,
      earnedPoints,
      LoyaltyPointsAction.PURCHASE,
      `Order ${orderId}: Earned ${earnedPoints} points`,
      orderId,
    );
  }
}

export default new LoyaltyRepo();
