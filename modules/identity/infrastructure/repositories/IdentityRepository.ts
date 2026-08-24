/**
 * Consolidated Identity Repository
 *
 * Merges: AdminRepository, identityAdminUserManagementRepo, roleRepo, StoreUserRepository
 * Aggregates: admin user, role, store-user assignment
 */

import { generateUUID as uuidv4 } from '../../../../libs/uuid';
import { query, queryOne } from '../../../../libs/db';
import type { StoreUser as DbStoreUser, IdentityAdminUser, Role } from '../../../../libs/db/types';
import { UserStoreAssignment, StoreRole } from '../../domain/entities/UserStoreAssignment';
import { StoreUserRepository as IStoreUserRepository } from '../../domain/repositories/StoreUserRepository';

// ============================================================================
// Types — Admin User (from AdminRepository)
// ============================================================================

export interface AdminUser {
  adminId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'support' | 'operations';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminInput {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  permissions: string[];
  status: string;
}

// ============================================================================
// Types — Admin User Management (from identityAdminUserManagementRepo)
// ============================================================================

export type AdminUserRecord = IdentityAdminUser & { roleId?: string; roleName?: string };

export interface CreateAdminUserParams {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

// ============================================================================
// Types — Role (from roleRepo)
// ============================================================================

export type RoleRecord = Role & { userCount?: number };

// ============================================================================
// Identity Repository Class
// ============================================================================

export class IdentityRepository implements IStoreUserRepository {
  private readonly adminTable = 'adminUser';
  private readonly storeUserTable = 'userStore';

  // ==========================================================================
  // Admin User (from AdminRepository)
  // ==========================================================================

  async findAdminByEmail(email: string): Promise<AdminUser | null> {
    const sql = `
      SELECT "adminId", "email", "name", "passwordHash", "role",
             "permissions", "status", "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.adminTable}"
      WHERE "email" = $1 AND "deletedAt" IS NULL
    `;
    const result = await queryOne<AdminUser>(sql, [email.toLowerCase()]);
    if (result) {
      result.permissions = result.permissions || [];
    }
    return result;
  }

  async findAdminById(adminId: string): Promise<AdminUser | null> {
    const sql = `
      SELECT "adminId", "email", "name", "passwordHash", "role",
             "permissions", "status", "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.adminTable}"
      WHERE "adminId" = $1 AND "deletedAt" IS NULL
    `;
    const result = await queryOne<AdminUser>(sql, [adminId]);
    if (result) {
      result.permissions = result.permissions || [];
    }
    return result;
  }

  async createAdmin(input: CreateAdminInput): Promise<AdminUser> {
    const adminId = uuidv4();
    const now = new Date();

    const sql = `
      INSERT INTO "${this.adminTable}"
        ("adminId", "email", "name", "passwordHash", "role", "permissions", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING "adminId", "email", "name", "role", "permissions", "status", "createdAt", "updatedAt"
    `;

    const result = await queryOne<AdminUser>(sql, [
      adminId,
      input.email.toLowerCase(),
      input.name,
      input.passwordHash,
      input.role,
      JSON.stringify(input.permissions),
      input.status,
      now,
      now,
    ]);

    return result!;
  }

  async updateAdmin(adminId: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`"name" = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.role !== undefined) {
      fields.push(`"role" = $${paramIndex++}`);
      values.push(updates.role);
    }
    if (updates.permissions !== undefined) {
      fields.push(`"permissions" = $${paramIndex++}`);
      values.push(JSON.stringify(updates.permissions));
    }
    if (updates.status !== undefined) {
      fields.push(`"status" = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`"passwordHash" = $${paramIndex++}`);
      values.push(updates.passwordHash);
    }

    if (fields.length === 0) {
      return this.findAdminById(adminId);
    }

    fields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(adminId);

    const sql = `
      UPDATE "${this.adminTable}"
      SET ${fields.join(', ')}
      WHERE "adminId" = $${paramIndex}
      RETURNING "adminId", "email", "name", "role", "permissions", "status", "createdAt", "updatedAt"
    `;

    return queryOne<AdminUser>(sql, values);
  }

  async deleteAdmin(adminId: string): Promise<boolean> {
    const sql = `
      UPDATE "${this.adminTable}"
      SET "deletedAt" = $1, "updatedAt" = $1
      WHERE "adminId" = $2 AND "deletedAt" IS NULL
      RETURNING "adminId"
    `;
    const result = await queryOne<{ adminId: string }>(sql, [new Date(), adminId]);
    return result !== null;
  }

  async listAllAdmins(): Promise<AdminUser[]> {
    const sql = `
      SELECT "adminId", "email", "name", "role", "permissions", "status",
             "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.adminTable}"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;
    return (await query<AdminUser[]>(sql)) || [];
  }

  async updateAdminLastLogin(adminId: string): Promise<void> {
    const sql = `
      UPDATE "${this.adminTable}"
      SET "lastLoginAt" = $1, "updatedAt" = $1
      WHERE "adminId" = $2
    `;
    await query(sql, [new Date(), adminId]);
  }

  // ==========================================================================
  // Admin User Management (from identityAdminUserManagementRepo)
  // ==========================================================================

  async listManagedAdminUsers(filters: { status?: string; limit?: number; offset?: number }): Promise<{ users: AdminUserRecord[]; total: number }> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    let whereClause = `WHERE "userType" = 'admin'`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(filters.status);
    }

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "user" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const users = await query<AdminUserRecord[]>(
      `SELECT u.*, r."name" as "roleName"
       FROM "user" u
       LEFT JOIN "adminUserRole" aur ON u."userId" = aur."userId"
       LEFT JOIN "role" r ON aur."roleId" = r."roleId"
       ${whereClause}
       ORDER BY u."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset],
    );

    return { users: users || [], total };
  }

  async findManagedAdminUserById(userId: string): Promise<AdminUserRecord | null> {
    return queryOne<AdminUserRecord>(
      `SELECT u.*, r."name" as "roleName", r."roleId"
       FROM "user" u
       LEFT JOIN "adminUserRole" aur ON u."userId" = aur."userId"
       LEFT JOIN "role" r ON aur."roleId" = r."roleId"
       WHERE u."userId" = $1`,
      [userId],
    );
  }

  async findManagedAdminUserByEmail(email: string): Promise<{ userId: string } | null> {
    return queryOne<{ userId: string }>(`SELECT "userId" FROM "user" WHERE "email" = $1`, [email.toLowerCase()]);
  }

  async createManagedAdminUser(params: CreateAdminUserParams): Promise<string> {
    const userId = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO "user" (
        "userId", "email", "passwordHash", "userType", "status",
        "firstName", "lastName", "emailVerified", "phoneVerified",
        "mfaEnabled", "loginCount", "failedLoginAttempts", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId,
        params.email.toLowerCase(),
        params.passwordHash,
        'admin',
        'active',
        params.firstName || null,
        params.lastName || null,
        true,
        false,
        false,
        0,
        0,
        now,
        now,
      ],
    );

    if (params.roleId) {
      await query(
        `INSERT INTO "adminUserRole" ("userId", "roleId", "createdAt")
         VALUES ($1, $2, $3)`,
        [userId, params.roleId, now],
      );
    }

    return userId;
  }

  async updateManagedAdminUser(userId: string, updates: { firstName?: string; lastName?: string; status?: string; roleId?: string }): Promise<void> {
    const now = new Date();

    await query(
      `UPDATE "user" SET
        "firstName" = COALESCE($1, "firstName"),
        "lastName" = COALESCE($2, "lastName"),
        "status" = COALESCE($3, "status"),
        "updatedAt" = $4
       WHERE "userId" = $5`,
      [updates.firstName, updates.lastName, updates.status, now, userId],
    );

    if (updates.roleId !== undefined) {
      await query(`DELETE FROM "adminUserRole" WHERE "userId" = $1`, [userId]);
      if (updates.roleId) {
        await query(
          `INSERT INTO "adminUserRole" ("userId", "roleId", "createdAt")
           VALUES ($1, $2, $3)`,
          [userId, updates.roleId, now],
        );
      }
    }
  }

  async deleteManagedAdminUser(userId: string): Promise<void> {
    await query(`DELETE FROM "adminUserRole" WHERE "userId" = $1`, [userId]);
    await query(`DELETE FROM "user" WHERE "userId" = $1 AND "userType" = 'admin'`, [userId]);
  }

  // ==========================================================================
  // Roles (from roleRepo)
  // ==========================================================================

  async listRoles(): Promise<(RoleRecord & { userCount: number })[]> {
    const rows = await query<(RoleRecord & { userCount: number })[]>(
      `SELECT r.*,
        (SELECT COUNT(*) FROM "adminUserRole" aur WHERE aur."roleId" = r."roleId") as "userCount"
       FROM "role" r
       ORDER BY r."name"`,
    );
    return rows || [];
  }

  async findRoleById(roleId: string): Promise<RoleRecord | null> {
    return queryOne<RoleRecord>(`SELECT * FROM "role" WHERE "roleId" = $1`, [roleId]);
  }

  async createRole(params: { name: string; description?: string; permissions: string[] }): Promise<string> {
    const roleId = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO "role" ("roleId", "name", "description", "permissions", "isSystem", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roleId, params.name, params.description || null, JSON.stringify(params.permissions || []), false, now, now],
    );

    return roleId;
  }

  async updateRole(roleId: string, updates: { name?: string; description?: string; permissions?: string[] }): Promise<void> {
    const now = new Date();

    await query(
      `UPDATE "role" SET
        "name" = COALESCE($1, "name"),
        "description" = COALESCE($2, "description"),
        "permissions" = COALESCE($3, "permissions"),
        "updatedAt" = $4
       WHERE "roleId" = $5`,
      [updates.name, updates.description, updates.permissions ? JSON.stringify(updates.permissions) : null, now, roleId],
    );
  }

  async deleteRole(roleId: string): Promise<void> {
    await query(`DELETE FROM "role" WHERE "roleId" = $1`, [roleId]);
  }

  async countRoleAssignments(roleId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "adminUserRole" WHERE "roleId" = $1`, [roleId]);
    return parseInt(result?.count || '0');
  }

  // ==========================================================================
  // Store-User Assignments (from StoreUserRepository)
  // Implements IStoreUserRepository interface
  // ==========================================================================

  async findByUserId(userId: string): Promise<UserStoreAssignment[]> {
    return this.findStoreUsersByUserId(userId);
  }

  async findByStoreId(storeId: string): Promise<UserStoreAssignment[]> {
    return this.findStoreUsersByStoreId(storeId);
  }

  async findByUserAndStore(userId: string, storeId: string): Promise<UserStoreAssignment | null> {
    return this.findStoreUserByUserAndStore(userId, storeId);
  }

  async save(assignment: UserStoreAssignment): Promise<UserStoreAssignment> {
    return this.saveStoreUser(assignment);
  }

  async delete(userStoreId: string): Promise<void> {
    return this.deleteStoreUser(userStoreId);
  }

  async findStoreUsersByUserId(userId: string): Promise<UserStoreAssignment[]> {
    const rows = await query<DbStoreUser[]>(
      `SELECT * FROM "${this.storeUserTable}" WHERE "userId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [userId],
    );
    return (rows || []).map(row => this.mapToAssignment(row));
  }

  async findStoreUsersByStoreId(storeId: string): Promise<UserStoreAssignment[]> {
    const rows = await query<DbStoreUser[]>(
      `SELECT * FROM "${this.storeUserTable}" WHERE "storeId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [storeId],
    );
    return (rows || []).map(row => this.mapToAssignment(row));
  }

  async findStoreUserByUserAndStore(userId: string, storeId: string): Promise<UserStoreAssignment | null> {
    const row = await queryOne<DbStoreUser>(`SELECT * FROM "${this.storeUserTable}" WHERE "userId" = $1 AND "storeId" = $2`, [
      userId,
      storeId,
    ]);
    return row ? this.mapToAssignment(row) : null;
  }

  async findPrimaryStore(userId: string): Promise<UserStoreAssignment | null> {
    const row = await queryOne<DbStoreUser>(
      `SELECT * FROM "${this.storeUserTable}" WHERE "userId" = $1 AND "isPrimary" = true ORDER BY "createdAt" ASC LIMIT 1`,
      [userId],
    );
    return row ? this.mapToAssignment(row) : null;
  }

  async saveStoreUser(assignment: UserStoreAssignment): Promise<UserStoreAssignment> {
    const existing = await queryOne<{ userStoreId: string }>(`SELECT "userStoreId" FROM "${this.storeUserTable}" WHERE "userStoreId" = $1`, [
      assignment.userStoreId,
    ]);

    const payload = assignment.toJSON();

    if (payload.isPrimary) {
      await query(`UPDATE "${this.storeUserTable}" SET "isPrimary" = false, "updatedAt" = NOW() WHERE "userId" = $1 AND "userStoreId" <> $2`, [
        payload.userId,
        payload.userStoreId,
      ]);
    }

    if (existing) {
      await query(
        `UPDATE "${this.storeUserTable}" SET
          "userId" = $1,
          "storeId" = $2,
          "role" = $3,
          "isPrimary" = $4,
          "isActive" = $5,
          "permissions" = $6,
          "updatedAt" = $7
        WHERE "userStoreId" = $8`,
        [
          payload.userId,
          payload.storeId,
          payload.role,
          payload.isPrimary,
          payload.isActive,
          JSON.stringify(payload.permissions),
          payload.updatedAt,
          payload.userStoreId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "${this.storeUserTable}" (
          "userStoreId", "userId", "storeId", "role", "isPrimary", "isActive", "permissions", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          payload.userStoreId,
          payload.userId,
          payload.storeId,
          payload.role,
          payload.isPrimary,
          payload.isActive,
          JSON.stringify(payload.permissions),
          payload.createdAt,
          payload.updatedAt,
        ],
      );
    }

    return (await this.findStoreUserByUserAndStore(payload.userId, payload.storeId)) as UserStoreAssignment;
  }

  async deleteStoreUser(userStoreId: string): Promise<void> {
    await query(`DELETE FROM "${this.storeUserTable}" WHERE "userStoreId" = $1`, [userStoreId]);
  }

  private mapToAssignment(row: DbStoreUser): UserStoreAssignment {
    return UserStoreAssignment.reconstitute({
      userStoreId: row.userStoreId,
      userId: row.userId,
      storeId: row.storeId,
      role: row.role as StoreRole,
      isPrimary: Boolean(row.isPrimary),
      isActive: Boolean(row.isActive),
      permissions: Array.isArray(row.permissions) ? row.permissions.map(p => String(p)) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new IdentityRepository();
