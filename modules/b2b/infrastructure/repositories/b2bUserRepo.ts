/**
 * B2B User Repository
 * Table: b2bUser
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bUser {
  b2bUserId: string;
  b2bCompanyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByCompany(companyId: string): Promise<B2bUser[]> {
  return (
    (await query<B2bUser[]>(
      `SELECT * FROM "b2bUser" WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
      [companyId],
    )) ?? []
  );
}

export async function findById(b2bUserId: string): Promise<B2bUser | null> {
  return queryOne<B2bUser>(
    `SELECT * FROM "b2bUser" WHERE "b2bUserId" = $1 AND "deletedAt" IS NULL`,
    [b2bUserId],
  );
}

export async function findByEmail(email: string): Promise<B2bUser | null> {
  return queryOne<B2bUser>(
    `SELECT * FROM "b2bUser" WHERE "email" = $1 AND "deletedAt" IS NULL`,
    [email],
  );
}

export async function create(data: {
  b2bCompanyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}): Promise<B2bUser> {
  const now = new Date().toISOString();
  return queryOne<B2bUser>(
    `INSERT INTO "b2bUser" ("b2bCompanyId", "email", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
     RETURNING *`,
    [
      data.b2bCompanyId,
      data.email,
      data.firstName ?? null,
      data.lastName ?? null,
      data.role ?? 'buyer',
      data.isActive ?? true,
      now,
    ],
  ) as Promise<B2bUser>;
}

export async function update(
  b2bUserId: string,
  data: { firstName?: string; lastName?: string; role?: string; isActive?: boolean },
): Promise<B2bUser | null> {
  const now = new Date().toISOString();
  return queryOne<B2bUser>(
    `UPDATE "b2bUser"
     SET "firstName" = COALESCE($1, "firstName"),
         "lastName"  = COALESCE($2, "lastName"),
         "role"      = COALESCE($3, "role"),
         "isActive"  = COALESCE($4, "isActive"),
         "updatedAt" = $5
     WHERE "b2bUserId" = $6 AND "deletedAt" IS NULL
     RETURNING *`,
    [data.firstName ?? null, data.lastName ?? null, data.role ?? null, data.isActive ?? null, now, b2bUserId],
  );
}

export async function softDelete(b2bUserId: string): Promise<void> {
  await query(
    `UPDATE "b2bUser" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "b2bUserId" = $2`,
    [new Date().toISOString(), b2bUserId],
  );
}
