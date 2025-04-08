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

export class MembershipRepo {
  // Membership Tier Methods
  async findTierById(id: string): Promise<MembershipTier | null> {
    return await queryOne<MembershipTier>('SELECT * FROM "public"."membership_tier" WHERE "id" = $1', [id]);
  }

  async findAllTiers(includeInactive: boolean = false): Promise<MembershipTier[]> {
    let sql = 'SELECT * FROM "public"."membership_tier"';
    
    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }
    
    sql += ' ORDER BY "level" ASC';
    
    const results = await query<MembershipTier[]>(sql, []);
    return results || [];
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

    const result = await queryOne<MembershipTier>(
      `INSERT INTO "public"."membership_tier" 
      ("name", "description", "monthlyPrice", "annualPrice", "level", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [name, description, monthlyPrice, annualPrice, level, isActive, now, now]
    );

    if (!result) {
      throw new Error('Failed to create membership tier');
    }

    return result;
  }

  async updateTier(id: string, params: MembershipTierUpdateParams): Promise<MembershipTier> {
    const now = unixTimestamp();
    const currentTier = await this.findTierById(id);
    
    if (!currentTier) {
      throw new Error(`Membership tier with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."membership_tier" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<MembershipTier>(sql, values);

    if (!result) {
      throw new Error(`Failed to update membership tier with ID ${id}`);
    }

    return result;
  }

  async deleteTier(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."membership_tier" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Membership Benefit Methods
  async findBenefitById(id: string): Promise<MembershipBenefit | null> {
    return await queryOne<MembershipBenefit>('SELECT * FROM "public"."membership_benefit" WHERE "id" = $1', [id]);
  }

  async findBenefitsByTierId(tierId: string): Promise<MembershipBenefit[]> {
    const results = await query<MembershipBenefit[]>(
      'SELECT * FROM "public"."membership_benefit" WHERE $1 = ANY("tierIds") AND "isActive" = true',
      [tierId]
    );
    return results || [];
  }

  async findAllBenefits(includeInactive: boolean = false): Promise<MembershipBenefit[]> {
    let sql = 'SELECT * FROM "public"."membership_benefit"';
    
    if (!includeInactive) {
      sql += ' WHERE "isActive" = true';
    }
    
    const results = await query<MembershipBenefit[]>(sql, []);
    return results || [];
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

    const result = await queryOne<MembershipBenefit>(
      `INSERT INTO "public"."membership_benefit" 
      ("tierIds", "name", "description", "benefitType", "discountPercentage", "discountAmount", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        tierIds,
        name,
        description,
        benefitType,
        discountPercentage || null,
        discountAmount || null,
        isActive,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create membership benefit');
    }

    return result;
  }

  async updateBenefit(id: string, params: MembershipBenefitUpdateParams): Promise<MembershipBenefit> {
    const now = unixTimestamp();
    const currentBenefit = await this.findBenefitById(id);
    
    if (!currentBenefit) {
      throw new Error(`Membership benefit with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."membership_benefit" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<MembershipBenefit>(sql, values);

    if (!result) {
      throw new Error(`Failed to update membership benefit with ID ${id}`);
    }

    return result;
  }

  async deleteBenefit(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."membership_benefit" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // User Membership Methods
  async findUserMembershipById(id: string): Promise<UserMembership | null> {
    return await queryOne<UserMembership>('SELECT * FROM "public"."user_membership" WHERE "id" = $1', [id]);
  }

  async findUserMembershipWithTier(id: string): Promise<UserMembershipWithTier | null> {
    const userMembership = await this.findUserMembershipById(id);
    
    if (!userMembership) {
      return null;
    }
    
    const tier = await this.findTierById(userMembership.tierId);
    
    if (!tier) {
      throw new Error(`Membership tier with ID ${userMembership.tierId} not found`);
    }
    
    return {
      ...userMembership,
      tier
    };
  }

  async findMembershipByUserId(userId: string): Promise<UserMembership | null> {
    return await queryOne<UserMembership>('SELECT * FROM "public"."user_membership" WHERE "userId" = $1 AND "isActive" = true', [userId]);
  }

  async findMembershipByUserIdWithTier(userId: string): Promise<UserMembershipWithTier | null> {
    const userMembership = await this.findMembershipByUserId(userId);
    
    if (!userMembership) {
      return null;
    }
    
    const tier = await this.findTierById(userMembership.tierId);
    
    if (!tier) {
      throw new Error(`Membership tier with ID ${userMembership.tierId} not found`);
    }
    
    return {
      ...userMembership,
      tier
    };
  }

  async findAllUserMemberships(
    limit: number = 50, 
    offset: number = 0, 
    filter?: { isActive?: boolean, tierId?: string }
  ): Promise<UserMembership[]> {
    let sql = 'SELECT * FROM "public"."user_membership" WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filter?.isActive !== undefined) {
      sql += ` AND "isActive" = $${paramIndex}`;
      params.push(filter.isActive);
      paramIndex++;
    }
    
    if (filter?.tierId) {
      sql += ` AND "tierId" = $${paramIndex}`;
      params.push(filter.tierId);
      paramIndex++;
    }
    
    sql += ' ORDER BY "createdAt" DESC';
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit.toString(), offset.toString());
    
    const results = await query<UserMembership[]>(sql, params);
    return results || [];
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

    // Check if user already has an active membership
    const existingMembership = await this.findMembershipByUserId(userId);
    if (existingMembership && isActive) {
      // Deactivate the existing membership
      await this.updateUserMembership(existingMembership.id, { isActive: false });
    }

    const result = await queryOne<UserMembership>(
      `INSERT INTO "public"."user_membership" 
      ("userId", "tierId", "startDate", "endDate", "isActive", "autoRenew", "membershipType", 
      "lastRenewalDate", "nextRenewalDate", "paymentMethod", "createdAt", "updatedAt") 
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

    return result;
  }

  async updateUserMembership(id: string, params: UserMembershipUpdateParams): Promise<UserMembership> {
    const now = unixTimestamp();
    const currentMembership = await this.findUserMembershipById(id);
    
    if (!currentMembership) {
      throw new Error(`User membership with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."user_membership" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<UserMembership>(sql, values);

    if (!result) {
      throw new Error(`Failed to update user membership with ID ${id}`);
    }

    return result;
  }

  async cancelUserMembership(id: string): Promise<UserMembership> {
    const now = unixTimestamp();
    const currentMembership = await this.findUserMembershipById(id);
    
    if (!currentMembership) {
      throw new Error(`User membership with ID ${id} not found`);
    }

    const result = await queryOne<UserMembership>(
      `UPDATE "public"."user_membership" 
      SET "isActive" = false, "autoRenew" = false, "updatedAt" = $1 
      WHERE "id" = $2 
      RETURNING *`,
      [now, id]
    );

    if (!result) {
      throw new Error(`Failed to cancel user membership with ID ${id}`);
    }

    return result;
  }

  async getUserMembershipBenefits(userId: string): Promise<MembershipBenefit[]> {
    const userMembership = await this.findMembershipByUserId(userId);
    
    if (!userMembership || !userMembership.isActive) {
      return [];
    }
    
    return this.findBenefitsByTierId(userMembership.tierId);
  }
}
