/**
 * Social Account Repository
 *
 * Handles persistence for OAuth/social login accounts.
 */

import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { IdentitySocialAccount } from '../../../libs/db/types';
import { SocialAccount, SocialProvider, UserType } from '../domain/entities/SocialAccount';

// ============================================================================
// Types
// ============================================================================

export type DbSocialAccount = IdentitySocialAccount;

export interface CreateSocialAccountInput {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
  providerUserId: string;
  providerEmail?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  providerData?: Record<string, any>;
  lastLoginIp?: string;
}

// ============================================================================
// Repository
// ============================================================================

export class SocialAccountRepo {
  /**
   * Transform database record to entity
   */
  private toEntity(record: DbSocialAccount): SocialAccount {
    return SocialAccount.create({
      socialAccountId: record.socialAccountId,
      userId: record.userId,
      userType: record.userType as UserType,
      provider: record.provider as SocialProvider,
      providerUserId: record.providerUserId,
      providerEmail: record.providerEmail || undefined,
      displayName: record.displayName || undefined,
      firstName: record.firstName || undefined,
      lastName: record.lastName || undefined,
      avatarUrl: record.avatarUrl || undefined,
      profileUrl: record.profileUrl || undefined,
      accessToken: record.accessToken || undefined,
      refreshToken: record.refreshToken || undefined,
      tokenExpiresAt: record.tokenExpiresAt ? new Date(record.tokenExpiresAt) : undefined,
      scopes: record.scopes ? JSON.parse(record.scopes) : undefined,
      isActive: record.isActive,
      isPrimary: record.isPrimary,
      providerData: record.providerData as Record<string, any> | undefined,
      lastUsedAt: record.lastUsedAt ? new Date(record.lastUsedAt) : undefined,
      lastLoginIp: record.lastLoginIp || undefined,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }

  /**
   * Create a new social account
   */
  async create(input: CreateSocialAccountInput): Promise<SocialAccount> {
    const socialAccountId = generateUUID();
    const now = new Date();

    const sql = `
      INSERT INTO "identitySocialAccount" (
        "socialAccountId", "userId", "userType", "provider", "providerUserId",
        "providerEmail", "displayName", "firstName", "lastName", "avatarUrl",
        "profileUrl", "accessToken", "refreshToken", "tokenExpiresAt", "scopes",
        "isActive", "isPrimary", "providerData", "lastUsedAt", "lastLoginIp",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const record = await queryOne<DbSocialAccount>(sql, [
      socialAccountId,
      input.userId,
      input.userType,
      input.provider,
      input.providerUserId,
      input.providerEmail || null,
      input.displayName || null,
      input.firstName || null,
      input.lastName || null,
      input.avatarUrl || null,
      input.profileUrl || null,
      input.accessToken || null,
      input.refreshToken || null,
      input.tokenExpiresAt || null,
      input.scopes ? JSON.stringify(input.scopes) : null,
      true,
      false,
      input.providerData ? JSON.stringify(input.providerData) : null,
      now,
      input.lastLoginIp || null,
      now,
      now,
    ]);

    if (!record) {
      throw new Error('Failed to create social account');
    }

    return this.toEntity(record);
  }

  /**
   * Find by social account ID
   */
  async findById(socialAccountId: string): Promise<SocialAccount | null> {
    const sql = `SELECT * FROM "identitySocialAccount" WHERE "socialAccountId" = $1`;
    const record = await queryOne<DbSocialAccount>(sql, [socialAccountId]);
    return record ? this.toEntity(record) : null;
  }

  /**
   * Find by provider and provider user ID
   */
  async findByProviderUserId(provider: SocialProvider, providerUserId: string): Promise<SocialAccount | null> {
    const sql = `SELECT * FROM "identitySocialAccount" WHERE "provider" = $1 AND "providerUserId" = $2`;
    const record = await queryOne<DbSocialAccount>(sql, [provider, providerUserId]);
    return record ? this.toEntity(record) : null;
  }

  /**
   * Find by provider email
   */
  async findByProviderEmail(provider: SocialProvider, email: string): Promise<SocialAccount | null> {
    const sql = `SELECT * FROM "identitySocialAccount" WHERE "provider" = $1 AND "providerEmail" = $2`;
    const record = await queryOne<DbSocialAccount>(sql, [provider, email]);
    return record ? this.toEntity(record) : null;
  }

  /**
   * Find all social accounts for a user
   */
  async findByUserId(userId: string, userType: UserType): Promise<SocialAccount[]> {
    const sql = `SELECT * FROM "identitySocialAccount" WHERE "userId" = $1 AND "userType" = $2 ORDER BY "createdAt" ASC`;
    const records = await query<DbSocialAccount[]>(sql, [userId, userType]);
    return records ? records.map(r => this.toEntity(r)) : [];
  }

  /**
   * Find a specific provider account for a user
   */
  async findByUserAndProvider(userId: string, userType: UserType, provider: SocialProvider): Promise<SocialAccount | null> {
    const sql = `SELECT * FROM "identitySocialAccount" WHERE "userId" = $1 AND "userType" = $2 AND "provider" = $3`;
    const record = await queryOne<DbSocialAccount>(sql, [userId, userType, provider]);
    return record ? this.toEntity(record) : null;
  }

  /**
   * Update social account
   */
  async update(socialAccountId: string, updates: Partial<CreateSocialAccountInput>): Promise<SocialAccount | null> {
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.scopes) {
      updateData.scopes = JSON.stringify(updates.scopes);
    }
    if (updates.providerData) {
      updateData.providerData = JSON.stringify(updates.providerData);
    }

    const sql = `
      UPDATE "identitySocialAccount" 
      SET 
        "userId" = COALESCE($2, "userId"),
        "userType" = COALESCE($3, "userType"),
        "provider" = COALESCE($4, "provider"),
        "providerUserId" = COALESCE($5, "providerUserId"),
        "providerEmail" = COALESCE($6, "providerEmail"),
        "displayName" = COALESCE($7, "displayName"),
        "firstName" = COALESCE($8, "firstName"),
        "lastName" = COALESCE($9, "lastName"),
        "avatarUrl" = COALESCE($10, "avatarUrl"),
        "profileUrl" = COALESCE($11, "profileUrl"),
        "accessToken" = COALESCE($12, "accessToken"),
        "refreshToken" = COALESCE($13, "refreshToken"),
        "tokenExpiresAt" = COALESCE($14, "tokenExpiresAt"),
        "scopes" = COALESCE($15, "scopes"),
        "providerData" = COALESCE($16, "providerData"),
        "lastLoginIp" = COALESCE($17, "lastLoginIp"),
        "updatedAt" = $18
      WHERE "socialAccountId" = $1
      RETURNING *
    `;

    const record = await queryOne<DbSocialAccount>(sql, [
      socialAccountId,
      updates.userId || null,
      updates.userType || null,
      updates.provider || null,
      updates.providerUserId || null,
      updates.providerEmail || null,
      updates.displayName || null,
      updates.firstName || null,
      updates.lastName || null,
      updates.avatarUrl || null,
      updates.profileUrl || null,
      updates.accessToken || null,
      updates.refreshToken || null,
      updates.tokenExpiresAt || null,
      updates.scopes ? JSON.stringify(updates.scopes) : null,
      updates.providerData ? JSON.stringify(updates.providerData) : null,
      updates.lastLoginIp || null,
      new Date(),
    ]);

    return record ? this.toEntity(record) : null;
  }

  /**
   * Update tokens for a social account
   */
  async updateTokens(socialAccountId: string, accessToken: string, refreshToken?: string, tokenExpiresAt?: Date): Promise<void> {
    const sql = `
      UPDATE "identitySocialAccount" 
      SET "accessToken" = $2, 
          "refreshToken" = COALESCE($3, "refreshToken"),
          "tokenExpiresAt" = COALESCE($4, "tokenExpiresAt"),
          "updatedAt" = $5
      WHERE "socialAccountId" = $1
    `;
    await query(sql, [socialAccountId, accessToken, refreshToken || null, tokenExpiresAt || null, new Date()]);
  }

  /**
   * Record a login event
   */
  async recordLogin(socialAccountId: string, ip?: string): Promise<void> {
    const sql = `
      UPDATE "identitySocialAccount" 
      SET "lastUsedAt" = $2, "lastLoginIp" = COALESCE($3, "lastLoginIp"), "updatedAt" = $2
      WHERE "socialAccountId" = $1
    `;
    await query(sql, [socialAccountId, new Date(), ip || null]);
  }

  /**
   * Deactivate a social account (unlink)
   */
  async deactivate(socialAccountId: string): Promise<void> {
    const sql = `UPDATE "identitySocialAccount" SET "isActive" = false, "updatedAt" = $2 WHERE "socialAccountId" = $1`;
    await query(sql, [socialAccountId, new Date()]);
  }

  /**
   * Delete a social account
   */
  async delete(socialAccountId: string): Promise<boolean> {
    const sql = `DELETE FROM "identitySocialAccount" WHERE "socialAccountId" = $1`;
    await query(sql, [socialAccountId]);
    return true;
  }

  /**
   * Delete all social accounts for a user
   */
  async deleteByUserId(userId: string, userType: UserType): Promise<void> {
    const sql = `DELETE FROM "identitySocialAccount" WHERE "userId" = $1 AND "userType" = $2`;
    await query(sql, [userId, userType]);
  }

  /**
   * Set a social account as primary
   */
  async setPrimary(userId: string, userType: UserType, socialAccountId: string): Promise<void> {
    // Clear primary flag from all accounts
    const clearSql = `UPDATE "identitySocialAccount" SET "isPrimary" = false, "updatedAt" = $3 WHERE "userId" = $1 AND "userType" = $2`;
    await query(clearSql, [userId, userType, new Date()]);

    // Set the specified account as primary
    const setSql = `UPDATE "identitySocialAccount" SET "isPrimary" = true, "updatedAt" = $2 WHERE "socialAccountId" = $1`;
    await query(setSql, [socialAccountId, new Date()]);
  }

  /**
   * Get count of linked providers for a user
   */
  async getLinkedProviderCount(userId: string, userType: UserType): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM "identitySocialAccount" WHERE "userId" = $1 AND "userType" = $2 AND "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql, [userId, userType]);
    return parseInt(result?.count || '0', 10);
  }

  /**
   * Check if a provider is already linked to any user
   */
  async isProviderLinked(provider: SocialProvider, providerUserId: string): Promise<boolean> {
    const sql = `SELECT 1 FROM "identitySocialAccount" WHERE "provider" = $1 AND "providerUserId" = $2 LIMIT 1`;
    const record = await queryOne(sql, [provider, providerUserId]);
    return !!record;
  }
}
