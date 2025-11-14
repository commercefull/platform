import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export interface MembershipTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  level: number;          // Numeric level for tier comparison (higher = better)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipBenefit {
  id: string;
  tierIds: string[];      // Array of tier IDs this benefit applies to
  name: string;
  description: string;
  benefitType: 'discount' | 'freeShipping' | 'exclusiveAccess' | 'reward' | 'other';
  discountPercentage?: number;
  discountAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  tierId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  membershipType: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembershipWithTier extends UserMembership {
  tier: MembershipTier;
}

type MembershipTierCreateParams = Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>;
type MembershipTierUpdateParams = Partial<Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>>;
type MembershipBenefitCreateParams = Omit<MembershipBenefit, 'id' | 'createdAt' | 'updatedAt'>;
type MembershipBenefitUpdateParams = Partial<Omit<MembershipBenefit, 'id' | 'createdAt' | 'updatedAt'>>;
type UserMembershipCreateParams = Omit<UserMembership, 'id' | 'createdAt' | 'updatedAt'>;
type UserMembershipUpdateParams = Partial<Omit<UserMembership, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Field mapping between TypeScript camelCase and database snake_case
const membershipTierFields = {
  id: 'id',
  name: 'name',
  description: 'description',
  monthlyPrice: 'monthly_price',
  annualPrice: 'annual_price',
  level: 'level',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const membershipBenefitFields = {
  id: 'id',
  tierIds: 'tier_ids',
  name: 'name',
  description: 'description',
  benefitType: 'benefit_type',
  discountPercentage: 'discount_percentage',
  discountAmount: 'discount_amount',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const userMembershipFields = {
  id: 'id',
  userId: 'user_id',
  tierId: 'tier_id',
  startDate: 'start_date',
  endDate: 'end_date',
  isActive: 'is_active',
  autoRenew: 'auto_renew',
  membershipType: 'membership_type',
  lastRenewalDate: 'last_renewal_date',
  nextRenewalDate: 'next_renewal_date',
  paymentMethod: 'payment_method',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
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
function transformMembershipTierFromDb(dbRecord: Record<string, any>): MembershipTier {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description || '',
    monthlyPrice: dbRecord.monthly_price,
    annualPrice: dbRecord.annual_price,
    level: dbRecord.level,
    isActive: dbRecord.is_active,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

function transformMembershipBenefitFromDb(dbRecord: Record<string, any>): MembershipBenefit {
  return {
    id: dbRecord.id,
    tierIds: dbRecord.tier_ids || [],
    name: dbRecord.name,
    description: dbRecord.description || '',
    benefitType: dbRecord.benefit_type,
    discountPercentage: dbRecord.discount_percentage,
    discountAmount: dbRecord.discount_amount,
    isActive: dbRecord.is_active,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

function transformUserMembershipFromDb(dbRecord: Record<string, any>): UserMembership {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    tierId: dbRecord.tier_id,
    startDate: dbRecord.start_date,
    endDate: dbRecord.end_date,
    isActive: dbRecord.is_active,
    autoRenew: dbRecord.auto_renew,
    membershipType: dbRecord.membership_type,
    lastRenewalDate: dbRecord.last_renewal_date || undefined,
    nextRenewalDate: dbRecord.next_renewal_date || undefined,
    paymentMethod: dbRecord.paymentMethod || undefined,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}

export class MembershipRepo {
  // Membership Tier Methods
  async findTierById(id: string): Promise<MembershipTier | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."membership_tier" WHERE "id" = $1',
      [id]
    );
    return result ? transformMembershipTierFromDb(result) : null;
  }

  async findAllTiers(includeInactive: boolean = false): Promise<MembershipTier[]> {
    let sql = 'SELECT * FROM "public"."membership_tier"';
    const params: any[] = [];

    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }

    sql += ' ORDER BY "level" ASC';

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformMembershipTierFromDb) : [];
  }

  async createTier(params: MembershipTierCreateParams): Promise<MembershipTier> {
    const now = unixTimestamp();
    const {
      name,
      description,
      monthlyPrice,
      annualPrice,
      level,
      isActive
    } = params;

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."membership_tier" 
      ("name", "description", "monthly_price", "annual_price", "level", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [name, description, monthlyPrice, annualPrice, level, isActive, now, now]
    );

    if (!result) {
      throw new Error('Failed to create membership tier');
    }

    return transformMembershipTierFromDb(result);
  }

  async updateTier(id: string, params: MembershipTierUpdateParams): Promise<MembershipTier> {
    const now = unixTimestamp();
    const currentTier = await this.findTierById(id);

    if (!currentTier) {
      throw new Error(`Membership tier with ID ${id} not found`);
    }

    // Always update the updatedAt timestamp
    const updatedParams = {
      ...params,
      updatedAt: now
    };

    const { sql, values, paramIndex } = buildUpdateQuery(
      'membership_tier',
      updatedParams,
      membershipTierFields
    );

    // Add ID for WHERE clause
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update membership tier with ID ${id}`);
    }

    return transformMembershipTierFromDb(result);
  }

  async deleteTier(id: string): Promise<boolean> {
    // Check if tier is in use by any users
    const usersWithTier = await query<Record<string, any>[]>(
      'SELECT COUNT(*) as count FROM "public"."user_membership" WHERE "tier_id" = $1',
      [id]
    );
    
    if (usersWithTier && usersWithTier[0] && parseInt(usersWithTier[0].count) > 0) {
      throw new Error(`Cannot delete tier with ID ${id} as it is assigned to users`);
    }

    const result = await queryOne(
      'DELETE FROM "public"."membership_tier" WHERE "id" = $1 RETURNING id',
      [id]
    );

    return !!result;
  }

  // Membership Benefit Methods
  async findBenefitById(id: string): Promise<MembershipBenefit | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."membership_benefit" WHERE "id" = $1',
      [id]
    );
    return result ? transformMembershipBenefitFromDb(result) : null;
  }

  async findBenefitsByTierId(tierId: string): Promise<MembershipBenefit[]> {
    const results = await query<Record<string, any>[]>(
      'SELECT * FROM "public"."membership_benefit" WHERE $1 = ANY("tier_ids") AND "isActive" = true',
      [tierId]
    );
    return results ? results.map(transformMembershipBenefitFromDb) : [];
  }

  async findAllBenefits(includeInactive: boolean = false): Promise<MembershipBenefit[]> {
    let sql = 'SELECT * FROM "public"."membership_benefit"';
    const params: any[] = [];

    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformMembershipBenefitFromDb) : [];
  }

  async createBenefit(params: MembershipBenefitCreateParams): Promise<MembershipBenefit> {
    const now = unixTimestamp();
    const {
      tierIds,
      name,
      description,
      benefitType,
      discountPercentage,
      discountAmount,
      isActive
    } = params;

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."membership_benefit" 
      ("tier_ids", "name", "description", "benefit_type", "discount_percentage", "discountAmount", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [tierIds, name, description, benefitType, discountPercentage, discountAmount, isActive, now, now]
    );

    if (!result) {
      throw new Error('Failed to create membership benefit');
    }

    return transformMembershipBenefitFromDb(result);
  }

  async updateBenefit(id: string, params: MembershipBenefitUpdateParams): Promise<MembershipBenefit> {
    const now = unixTimestamp();
    const currentBenefit = await this.findBenefitById(id);

    if (!currentBenefit) {
      throw new Error(`Membership benefit with ID ${id} not found`);
    }

    // Always update the updatedAt timestamp
    const updatedParams = {
      ...params,
      updatedAt: now
    };

    const { sql, values, paramIndex } = buildUpdateQuery(
      'membership_benefit',
      updatedParams,
      membershipBenefitFields
    );

    // Add ID for WHERE clause
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update membership benefit with ID ${id}`);
    }

    return transformMembershipBenefitFromDb(result);
  }

  async deleteBenefit(id: string): Promise<boolean> {
    const result = await queryOne(
      'DELETE FROM "public"."membership_benefit" WHERE "id" = $1 RETURNING id',
      [id]
    );

    return !!result;
  }

  // User Membership Methods
  async findUserMembershipById(id: string): Promise<UserMembership | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."user_membership" WHERE "id" = $1',
      [id]
    );
    return result ? transformUserMembershipFromDb(result) : null;
  }

  async findUserMembershipWithTier(id: string): Promise<UserMembershipWithTier | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT m.*, t.id as t_id, t.name as t_name, t.description as t_description, 
      t.monthly_price, t.annual_price, t.level, t.is_active as t_is_active, 
      t.created_at as t_created_at, t.updated_at as t_updated_at
      FROM "public"."user_membership" m
      LEFT JOIN "public"."membership_tier" t ON m.tier_id = t.id
      WHERE m.id = $1`,
      [id]
    );

    if (!result) {
      return null;
    }

    const membership = transformUserMembershipFromDb(result);
    const tier: MembershipTier = {
      id: result.t_id,
      name: result.t_name,
      description: result.t_description || '',
      monthlyPrice: result.monthly_price,
      annualPrice: result.annual_price,
      level: result.level,
      isActive: result.t_is_active,
      createdAt: result.t_created_at,
      updatedAt: result.t_updated_at
    };

    return { ...membership, tier };
  }

  async findMembershipByUserId(userId: string): Promise<UserMembership | null> {
    const result = await queryOne<Record<string, any>>(
      'SELECT * FROM "public"."user_membership" WHERE "userId" = $1 AND "isActive" = true',
      [userId]
    );
    return result ? transformUserMembershipFromDb(result) : null;
  }

  async findMembershipByUserIdWithTier(userId: string): Promise<UserMembershipWithTier | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT m.*, t.id as t_id, t.name as t_name, t.description as t_description, 
      t.monthly_price, t.annual_price, t.level, t.is_active as t_is_active, 
      t.created_at as t_created_at, t.updated_at as t_updated_at
      FROM "public"."user_membership" m
      LEFT JOIN "public"."membership_tier" t ON m.tier_id = t.id
      WHERE m.user_id = $1 AND m.is_active = true`,
      [userId]
    );

    if (!result) {
      return null;
    }

    const membership = transformUserMembershipFromDb(result);
    const tier: MembershipTier = {
      id: result.t_id,
      name: result.t_name,
      description: result.t_description || '',
      monthlyPrice: result.monthly_price,
      annualPrice: result.annual_price,
      level: result.level,
      isActive: result.t_is_active,
      createdAt: result.t_created_at,
      updatedAt: result.t_updated_at
    };

    return { ...membership, tier };
  }

  async findAllUserMemberships(
    limit: number = 50, 
    offset: number = 0, 
    filter?: { isActive?: boolean, tierId?: string }
  ): Promise<UserMembership[]> {
    let sql = 'SELECT * FROM "public"."user_membership"';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter) {
      let paramIndex = 1;

      if (filter.isActive !== undefined) {
        conditions.push(`"isActive" = $${paramIndex++}`);
        params.push(filter.isActive);
      }

      if (filter.tierId) {
        conditions.push(`"tier_id" = $${paramIndex++}`);
        params.push(filter.tierId);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    sql += ' ORDER BY "createdAt" DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit.toString(), offset.toString());

    const results = await query<Record<string, any>[]>(sql, params);
    return results ? results.map(transformUserMembershipFromDb) : [];
  }

  async createUserMembership(params: UserMembershipCreateParams): Promise<UserMembership> {
    const now = unixTimestamp();
    const {
      userId,
      tierId,
      startDate,
      endDate,
      isActive,
      autoRenew,
      membershipType,
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod
    } = params;

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."user_membership" 
      ("userId", "tier_id", "start_date", "end_date", "isActive", "auto_renew", 
      "membership_type", "last_renewal_date", "next_renewal_date", "payment_method", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        userId, 
        tierId, 
        startDate, 
        endDate, 
        isActive, 
        autoRenew, 
        membershipType, 
        lastRenewalDate || null, 
        nextRenewalDate || null, 
        paymentMethod || null, 
        now, 
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create user membership');
    }

    return transformUserMembershipFromDb(result);
  }

  async updateUserMembership(id: string, params: UserMembershipUpdateParams): Promise<UserMembership> {
    const now = unixTimestamp();
    const currentMembership = await this.findUserMembershipById(id);

    if (!currentMembership) {
      throw new Error(`User membership with ID ${id} not found`);
    }

    // Always update the updatedAt timestamp
    const updatedParams = {
      ...params,
      updatedAt: now
    };

    const { sql, values, paramIndex } = buildUpdateQuery(
      'user_membership',
      updatedParams,
      userMembershipFields
    );

    // Add ID for WHERE clause
    values.push(id);

    const result = await queryOne<Record<string, any>>(sql, values);

    if (!result) {
      throw new Error(`Failed to update user membership with ID ${id}`);
    }

    return transformUserMembershipFromDb(result);
  }

  async cancelUserMembership(id: string): Promise<UserMembership> {
    const now = unixTimestamp();
    const currentMembership = await this.findUserMembershipById(id);

    if (!currentMembership) {
      throw new Error(`User membership with ID ${id} not found`);
    }

    const result = await queryOne<Record<string, any>>(
      `UPDATE "public"."user_membership" 
      SET "isActive" = false, "auto_renew" = false, "updatedAt" = $1
      WHERE "id" = $2 
      RETURNING *`,
      [now, id]
    );

    if (!result) {
      throw new Error(`Failed to cancel user membership with ID ${id}`);
    }

    return transformUserMembershipFromDb(result);
  }

  async getUserMembershipBenefits(userId: string): Promise<MembershipBenefit[]> {
    // Get user's active membership
    const membership = await this.findMembershipByUserId(userId);
    
    if (!membership) {
      return [];
    }
    
    // Get benefits for the tier
    return this.findBenefitsByTierId(membership.tierId);
  }
}
