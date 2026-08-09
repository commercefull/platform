/**
 * Role Repository
 * Handles CRUD for roles and role assignments
 */

import { query, queryOne } from '../../../../libs/db';
import type { Role } from 'libs/db/types';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export type RoleRecord = Role & { userCount?: number };

export async function listRoles(): Promise<(RoleRecord & { userCount: number })[]> {
  const rows = await query<(RoleRecord & { userCount: number })[]>(
    `SELECT r.*,
      (SELECT COUNT(*) FROM "adminUserRole" aur WHERE aur."roleId" = r."roleId") as "userCount"
     FROM "role" r
     ORDER BY r."name"`,
  );
  return rows || [];
}

export async function findRoleById(roleId: string): Promise<RoleRecord | null> {
  return queryOne<RoleRecord>(`SELECT * FROM "role" WHERE "roleId" = $1`, [roleId]);
}

export async function createRole(params: { name: string; description?: string; permissions: string[] }): Promise<string> {
  const roleId = uuidv4();
  const now = new Date();

  await query(
    `INSERT INTO "role" ("roleId", "name", "description", "permissions", "isSystem", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [roleId, params.name, params.description || null, JSON.stringify(params.permissions || []), false, now, now],
  );

  return roleId;
}

export async function updateRole(roleId: string, updates: { name?: string; description?: string; permissions?: string[] }): Promise<void> {
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

export async function deleteRole(roleId: string): Promise<void> {
  await query(`DELETE FROM "role" WHERE "roleId" = $1`, [roleId]);
}

export async function countRoleAssignments(roleId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "adminUserRole" WHERE "roleId" = $1`, [roleId]);
  return parseInt(result?.count || '0');
}
