/**
 * Admin User Management Repository
 * Handles CRUD for admin users in the "user" table (userType = 'admin')
 * and role assignments in "adminUserRole"
 */

import { query, queryOne } from '../../../../libs/db';
import type { IdentityAdminUser } from 'libs/db/types';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export type AdminUserRecord = IdentityAdminUser & { roleId?: string; roleName?: string };

export interface CreateAdminUserParams {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export async function listAdminUsers(filters: { status?: string; limit?: number; offset?: number }): Promise<{ users: AdminUserRecord[]; total: number }> {
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

export async function findAdminUserById(userId: string): Promise<AdminUserRecord | null> {
  return queryOne<AdminUserRecord>(
    `SELECT u.*, r."name" as "roleName", r."roleId"
     FROM "user" u
     LEFT JOIN "adminUserRole" aur ON u."userId" = aur."userId"
     LEFT JOIN "role" r ON aur."roleId" = r."roleId"
     WHERE u."userId" = $1`,
    [userId],
  );
}

export async function findAdminUserByEmail(email: string): Promise<{ userId: string } | null> {
  return queryOne<{ userId: string }>(`SELECT "userId" FROM "user" WHERE "email" = $1`, [email.toLowerCase()]);
}

export async function createAdminUser(params: CreateAdminUserParams): Promise<string> {
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

export async function updateAdminUser(userId: string, updates: { firstName?: string; lastName?: string; status?: string; roleId?: string }): Promise<void> {
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

export async function deleteAdminUser(userId: string): Promise<void> {
  await query(`DELETE FROM "adminUserRole" WHERE "userId" = $1`, [userId]);
  await query(`DELETE FROM "user" WHERE "userId" = $1 AND "userType" = 'admin'`, [userId]);
}
