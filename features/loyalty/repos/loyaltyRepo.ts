import { queryOne, query } from "../../../libs/db";
import { unixTimestamp, unixTimestampFuture } from "../../../libs/date";

export enum LoyaltyTierType {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  CUSTOM = 'custom'
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
  EXPIRATION = 'expiration'
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description?: string;
  type: LoyaltyTierType;
  pointsThreshold: number;
  multiplier: number;
  benefits?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyPoints {
  id: string;
  customerId: string;
  tierId: string;
  currentPoints: number;
  lifetimePoints: number;
  lastActivity: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  action: LoyaltyPointsAction;
  points: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  discountAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  freeShipping: boolean;
  productIds?: string[];
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRedemption {
  id: string;
  customerId: string;
  rewardId: string;
  pointsSpent: number;
  redemptionCode: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

type LoyaltyTierCreateParams = Omit<LoyaltyTier, 'id' | 'createdAt' | 'updatedAt'>;
type LoyaltyTierUpdateParams = Partial<Omit<LoyaltyTier, 'id' | 'createdAt' | 'updatedAt'>>;
type LoyaltyRewardCreateParams = Omit<LoyaltyReward, 'id' | 'createdAt' | 'updatedAt'>;
type LoyaltyRewardUpdateParams = Partial<Omit<LoyaltyReward, 'id' | 'createdAt' | 'updatedAt'>>;

// Field mapping between TypeScript camelCase and database snake_case
const loyaltyTierFields = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  pointsThreshold: 'points_threshold',
  multiplier: 'multiplier',
  benefits: 'benefits',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const loyaltyPointsFields = {
  id: 'id',
  customerId: 'customer_id',
  tierId: 'tier_id',
  currentPoints: 'current_points',
  lifetimePoints: 'lifetime_points',
  lastActivity: 'last_activity',
  expiryDate: 'expiry_date',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const loyaltyTransactionFields = {
  id: 'id',
  customerId: 'customer_id',
  orderId: 'order_id',
  action: 'action',
  points: 'points',
  description: 'description',
  referenceId: 'reference_id',
  createdAt: 'created_at'
};

const loyaltyRewardFields = {
  id: 'id',
  name: 'name',
  description: 'description',
  pointsCost: 'points_cost',
  discountAmount: 'discount_amount',
  discountPercent: 'discount_percent',
  discountCode: 'discount_code',
  freeShipping: 'free_shipping',
  productIds: 'product_ids',
  expiresAt: 'expires_at',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const loyaltyRedemptionFields = {
  id: 'id',
  customerId: 'customer_id',
  rewardId: 'reward_id',
  pointsSpent: 'points_spent',
  redemptionCode: 'redemption_code',
  status: 'status',
  usedAt: 'used_at',
  expiresAt: 'expires_at',
  createdAt: 'created_at'
};

// Helper to convert TypeScript camelCase field names to database snake_case
function getDbFieldName(field: string, mappingObject: Record<string, string>): string {
  return mappingObject[field] || field;
}

// Helper to build a dynamic UPDATE query with snake_case fields
function buildUpdateQuery(
  tableName: string, 
  params: Record<string, any>, 
  mappingObject: Record<string, string>, 
  idField: string = 'id'
): { sql: string; values: any[]; paramIndex: number } {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic query based on provided update params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbField = getDbFieldName(key, mappingObject);
      updateFields.push(`"${dbField}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  const sql = `
    UPDATE "public"."${tableName}" 
    SET ${updateFields.join(', ')} 
    WHERE "${getDbFieldName(idField, mappingObject)}" = $${paramIndex} 
    RETURNING *
  `;

  return { sql, values, paramIndex };
}

// Helper functions to transform between database and TypeScript formats
function transformLoyaltyTierFromDb(dbRecord: Record<string, any>): LoyaltyTier {
  return {
    id: dbRecord[loyaltyTierFields.id],
    name: dbRecord[loyaltyTierFields.name],
    description: dbRecord[loyaltyTierFields.description] || undefined,
    type: dbRecord[loyaltyTierFields.type],
    pointsThreshold: dbRecord[loyaltyTierFields.pointsThreshold],
    multiplier: dbRecord[loyaltyTierFields.multiplier],
    benefits: dbRecord[loyaltyTierFields.benefits] || undefined,
    isActive: dbRecord[loyaltyTierFields.isActive],
    createdAt: dbRecord[loyaltyTierFields.createdAt],
    updatedAt: dbRecord[loyaltyTierFields.updatedAt]
  };
}

function transformLoyaltyPointsFromDb(dbRecord: Record<string, any>): LoyaltyPoints {
  return {
    id: dbRecord[loyaltyPointsFields.id],
    customerId: dbRecord[loyaltyPointsFields.customerId],
    tierId: dbRecord[loyaltyPointsFields.tierId],
    currentPoints: dbRecord[loyaltyPointsFields.currentPoints],
    lifetimePoints: dbRecord[loyaltyPointsFields.lifetimePoints],
    lastActivity: dbRecord[loyaltyPointsFields.lastActivity],
    expiryDate: dbRecord[loyaltyPointsFields.expiryDate] || undefined,
    createdAt: dbRecord[loyaltyPointsFields.createdAt],
    updatedAt: dbRecord[loyaltyPointsFields.updatedAt]
  };
}

function transformLoyaltyTransactionFromDb(dbRecord: Record<string, any>): LoyaltyTransaction {
  return {
    id: dbRecord[loyaltyTransactionFields.id],
    customerId: dbRecord[loyaltyTransactionFields.customerId],
    orderId: dbRecord[loyaltyTransactionFields.orderId] || undefined,
    action: dbRecord[loyaltyTransactionFields.action],
    points: dbRecord[loyaltyTransactionFields.points],
    description: dbRecord[loyaltyTransactionFields.description] || undefined,
    referenceId: dbRecord[loyaltyTransactionFields.referenceId] || undefined,
    createdAt: dbRecord[loyaltyTransactionFields.createdAt]
  };
}

function transformLoyaltyRewardFromDb(dbRecord: Record<string, any>): LoyaltyReward {
  return {
    id: dbRecord[loyaltyRewardFields.id],
    name: dbRecord[loyaltyRewardFields.name],
    description: dbRecord[loyaltyRewardFields.description] || undefined,
    pointsCost: dbRecord[loyaltyRewardFields.pointsCost],
    discountAmount: dbRecord[loyaltyRewardFields.discountAmount] || undefined,
    discountPercent: dbRecord[loyaltyRewardFields.discountPercent] || undefined,
    discountCode: dbRecord[loyaltyRewardFields.discountCode] || undefined,
    freeShipping: dbRecord[loyaltyRewardFields.freeShipping],
    productIds: dbRecord[loyaltyRewardFields.productIds] || undefined,
    expiresAt: dbRecord[loyaltyRewardFields.expiresAt] || undefined,
    isActive: dbRecord[loyaltyRewardFields.isActive],
    createdAt: dbRecord[loyaltyRewardFields.createdAt],
    updatedAt: dbRecord[loyaltyRewardFields.updatedAt]
  };
}

function transformLoyaltyRedemptionFromDb(dbRecord: Record<string, any>): LoyaltyRedemption {
  return {
    id: dbRecord[loyaltyRedemptionFields.id],
    customerId: dbRecord[loyaltyRedemptionFields.customerId],
    rewardId: dbRecord[loyaltyRedemptionFields.rewardId],
    pointsSpent: dbRecord[loyaltyRedemptionFields.pointsSpent],
    redemptionCode: dbRecord[loyaltyRedemptionFields.redemptionCode],
    status: dbRecord[loyaltyRedemptionFields.status],
    usedAt: dbRecord[loyaltyRedemptionFields.usedAt] || undefined,
    expiresAt: dbRecord[loyaltyRedemptionFields.expiresAt] || undefined,
    createdAt: dbRecord[loyaltyRedemptionFields.createdAt]
  };
}

export class LoyaltyRepo {
  // Tier Management
  async findTierById(id: string): Promise<LoyaltyTier | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."loyalty_tier" WHERE "id" = $1',
      [id]
    );
    return result ? transformLoyaltyTierFromDb(result) : null;
  }

  async findAllTiers(includeInactive: boolean = false): Promise<LoyaltyTier[]> {
    let sql = 'SELECT * FROM "public"."loyalty_tier"';
    const params: any[] = [];

    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }

    sql += ' ORDER BY "points_threshold" ASC';

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformLoyaltyTierFromDb) : [];
  }

  async createTier(params: LoyaltyTierCreateParams): Promise<LoyaltyTier> {
    const now = unixTimestamp();
    const {
      name,
      description,
      type,
      pointsThreshold,
      multiplier,
      benefits,
      isActive
    } = params;

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."loyalty_tier" 
      ("name", "description", "type", "points_threshold", "multiplier", "benefits", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [name, description || null, type, pointsThreshold, multiplier, benefits || null, isActive, now, now]
    );

    if (!result) {
      throw new Error('Failed to create loyalty tier');
    }

    return transformLoyaltyTierFromDb(result);
  }

  async updateTier(id: string, params: LoyaltyTierUpdateParams): Promise<LoyaltyTier> {
    const now = unixTimestamp();
    const currentTier = await this.findTierById(id);

    if (!currentTier) {
      throw new Error(`Loyalty tier with ID ${id} not found`);
    }

    const { sql, values, paramIndex } = buildUpdateQuery('loyalty_tier', params, loyaltyTierFields);
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update loyalty tier with ID ${id}`);
    }

    return transformLoyaltyTierFromDb(result);
  }

  // Customer Points Management
  async findCustomerPoints(customerId: string): Promise<LoyaltyPoints | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."loyalty_points" WHERE "customerId" = $1',
      [customerId]
    );
    return result ? transformLoyaltyPointsFromDb(result) : null;
  }

  async initializeCustomerPoints(customerId: string, tierId: string): Promise<LoyaltyPoints> {
    const now = unixTimestamp();
    const existingPoints = await this.findCustomerPoints(customerId);

    if (existingPoints) {
      return existingPoints;
    }

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."loyalty_points" 
      ("customerId", "tier_id", "current_points", "lifetime_points", "last_activity", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [customerId, tierId, 0, 0, now, now, now]
    );

    if (!result) {
      throw new Error('Failed to initialize customer loyalty points');
    }

    return transformLoyaltyPointsFromDb(result);
  }

  async addPoints(
    customerId: string, 
    points: number, 
    action: LoyaltyPointsAction, 
    orderId?: string, 
    description?: string,
    referenceId?: string
  ): Promise<LoyaltyPoints> {
    const now = unixTimestamp();
    let customerPoints = await this.findCustomerPoints(customerId);

    // Initialize if not exists
    if (!customerPoints) {
      // Get the base tier (lowest threshold)
      const tiers = await this.findAllTiers(false);
      if (tiers.length === 0) {
        throw new Error('No active loyalty tiers found');
      }
      
      const baseTier = tiers[0];
      customerPoints = await this.initializeCustomerPoints(customerId, baseTier.id);
    }

    // Update points
    const newCurrentPoints = customerPoints.currentPoints + points;
    const newLifetimePoints = customerPoints.lifetimePoints + (points > 0 ? points : 0);

    // Check if customer should be upgraded to a new tier
    const tiers = await this.findAllTiers(false);
    let newTierId = customerPoints.tierId;

    for (const tier of tiers) {
      if (newLifetimePoints >= tier.pointsThreshold) {
        newTierId = tier.id;
      }
    }

    // Update customer points
    const result = await queryOne<Record<string, any>>(
      `UPDATE "public"."loyalty_points" 
      SET "current_points" = $1, "lifetime_points" = $2, "last_activity" = $3, "tier_id" = $4, "updatedAt" = $5
      WHERE "customerId" = $6 
      RETURNING *`,
      [newCurrentPoints, newLifetimePoints, now, newTierId, now, customerId]
    );

    if (!result) {
      throw new Error(`Failed to update points for customer ${customerId}`);
    }

    // Record the transaction
    await this.recordTransaction(
      customerId,
      action,
      points,
      orderId,
      description,
      referenceId
    );

    return transformLoyaltyPointsFromDb(result);
  }

  async recordTransaction(
    customerId: string,
    action: LoyaltyPointsAction,
    points: number,
    orderId?: string,
    description?: string,
    referenceId?: string
  ): Promise<LoyaltyTransaction> {
    const now = unixTimestamp();

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."loyalty_transaction" 
      ("customerId", "orderId", "action", "points", "description", "reference_id", "createdAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [customerId, orderId || null, action, points, description || null, referenceId || null, now]
    );

    if (!result) {
      throw new Error('Failed to record loyalty transaction');
    }

    return transformLoyaltyTransactionFromDb(result);
  }

  async getCustomerTransactions(customerId: string, limit: number = 50, offset: number = 0): Promise<LoyaltyTransaction[]> {
    const results = await query<Record<string, any>[]>(
      'SELECT * FROM "public"."loyalty_transaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
      [customerId, limit.toString(), offset.toString()]
    );
    return results ? results.map(transformLoyaltyTransactionFromDb) : [];
  }

  // Rewards Management
  async findRewardById(id: string): Promise<LoyaltyReward | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."loyalty_reward" WHERE "id" = $1',
      [id]
    );
    return result ? transformLoyaltyRewardFromDb(result) : null;
  }

  async findAllRewards(includeInactive: boolean = false): Promise<LoyaltyReward[]> {
    let sql = 'SELECT * FROM "public"."loyalty_reward"';
    const params: any[] = [];

    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }

    sql += ' ORDER BY "points_cost" ASC';

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformLoyaltyRewardFromDb) : [];
  }

  async createReward(params: LoyaltyRewardCreateParams): Promise<LoyaltyReward> {
    const now = unixTimestamp();
    const {
      name,
      description,
      pointsCost,
      discountAmount,
      discountPercent,
      discountCode,
      freeShipping,
      productIds,
      expiresAt,
      isActive
    } = params;

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."loyalty_reward" 
      ("name", "description", "points_cost", "discountAmount", "discount_percent", 
       "discount_code", "free_shipping", "product_ids", "expiresAt", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        name,
        description || null,
        pointsCost,
        discountAmount || null,
        discountPercent || null,
        discountCode || null,
        freeShipping,
        productIds || null,
        expiresAt || null,
        isActive,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create loyalty reward');
    }

    return transformLoyaltyRewardFromDb(result);
  }

  async updateReward(id: string, params: LoyaltyRewardUpdateParams): Promise<LoyaltyReward> {
    const now = unixTimestamp();
    const currentReward = await this.findRewardById(id);

    if (!currentReward) {
      throw new Error(`Loyalty reward with ID ${id} not found`);
    }

    const { sql, values, paramIndex } = buildUpdateQuery('loyalty_reward', params, loyaltyRewardFields);
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update loyalty reward with ID ${id}`);
    }

    return transformLoyaltyRewardFromDb(result);
  }

  // Redemption Management
  async redeemReward(customerId: string, rewardId: string): Promise<LoyaltyRedemption> {
    const now = unixTimestamp();
    
    // Get customer points
    const customerPoints = await this.findCustomerPoints(customerId);
    if (!customerPoints) {
      throw new Error(`Customer ${customerId} does not have a loyalty profile`);
    }
    
    // Get reward
    const reward = await this.findRewardById(rewardId);
    if (!reward) {
      throw new Error(`Reward ${rewardId} not found`);
    }
    
    if (!reward.isActive) {
      throw new Error(`Reward ${rewardId} is not active`);
    }
    
    // Check if customer has enough points
    if (customerPoints.currentPoints < reward.pointsCost) {
      throw new Error(`Insufficient points to redeem reward: have ${customerPoints.currentPoints}, need ${reward.pointsCost}`);
    }
    
    // Generate redemption code
    const redemptionCode = `RED-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    
    // Calculate expiry date (default to 30 days from now if not specified on reward)
    const expiresAt = reward.expiresAt || unixTimestampFuture(30);
    
    // Begin transaction
    const conn = await queryOne('BEGIN');
    
    try {
      // Deduct points
      await this.addPoints(
        customerId,
        -reward.pointsCost,
        LoyaltyPointsAction.REDEMPTION,
        undefined,
        `Redeemed reward: ${reward.name}`,
        rewardId
      );
      
      // Create redemption record
      const result = await queryOne<Record<string, any>>(
        `INSERT INTO "public"."loyalty_redemption" 
        ("customerId", "reward_id", "points_spent", "redemption_code", "status", "expiresAt", "createdAt") 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [customerId, rewardId, reward.pointsCost, redemptionCode, 'pending', expiresAt, now]
      );
      
      if (!result) {
        throw new Error('Failed to create redemption record');
      }
      
      await queryOne('COMMIT');
      
      return transformLoyaltyRedemptionFromDb(result);
    } catch (error) {
      await queryOne('ROLLBACK');
      throw error;
    }
  }

  async getCustomerRedemptions(customerId: string, status?: string): Promise<LoyaltyRedemption[]> {
    let sql = 'SELECT * FROM "public"."loyalty_redemption" WHERE "customerId" = $1';
    const params: any[] = [customerId];

    if (status) {
      sql += ' AND "status" = $2';
      params.push(status);
    }

    sql += ' ORDER BY "createdAt" DESC';

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformLoyaltyRedemptionFromDb) : [];
  }

  async updateRedemptionStatus(id: string, status: 'used' | 'expired' | 'cancelled'): Promise<LoyaltyRedemption> {
    const now = unixTimestamp();
    
    const updates: Record<string, any> = { status };
    
    if (status === 'used') {
      updates.usedAt = now;
    }
    
    const { sql, values, paramIndex } = buildUpdateQuery('loyalty_redemption', updates, loyaltyRedemptionFields);
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update redemption status for ${id}`);
    }
    
    return transformLoyaltyRedemptionFromDb(result);
  }

  // Administrative functions
  async calculatePointsForOrder(orderId: string, orderAmount: number): Promise<number> {
    // Default calculation: 1 point per $1 spent
    let basePoints = Math.floor(orderAmount);
    
    // Apply tier multiplier if customer has a loyalty profile
    const orderDetails = await queryOne<Record<string, any>>(
      'SELECT "customerId" FROM "public"."order" WHERE "id" = $1',
      [orderId]
    );
    
    if (orderDetails && orderDetails.customer_id) {
      const customerPoints = await this.findCustomerPoints(orderDetails.customer_id);
      
      if (customerPoints) {
        const tier = await this.findTierById(customerPoints.tierId);
        
        if (tier) {
          basePoints = Math.floor(basePoints * tier.multiplier);
        }
      }
    }
    
    return basePoints;
  }
  
  async processOrderPoints(orderId: string, orderAmount: number, customerId: string): Promise<LoyaltyPoints> {
    const points = await this.calculatePointsForOrder(orderId, orderAmount);
    
    return this.addPoints(
      customerId,
      points,
      LoyaltyPointsAction.PURCHASE,
      orderId,
      `Points earned from order #${orderId}`
    );
  }
}
