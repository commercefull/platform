/**
 * Organization Repository
 * 
 * Manages multi-tenant organizations and their hierarchies.
 */

import { query, queryOne } from '../../../libs/db';
import { Organization } from '../../../libs/db/dataModelTypes';

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  type?: 'single' | 'multi_store' | 'marketplace' | 'b2b';
  settings?: Record<string, unknown>;
}

export interface UpdateOrganizationParams {
  name?: string;
  slug?: string;
  type?: 'single' | 'multi_store' | 'marketplace' | 'b2b';
  settings?: Record<string, unknown>;
}

function generateId(): string {
  return `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function create(params: CreateOrganizationParams): Promise<Organization> {
  const organizationId = generateId();
  const now = new Date();

  const sql = `
    INSERT INTO "organization" (
      "organizationId", "name", "slug", "type", "settings", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await query<{ rows: Organization[] }>(sql, [
    organizationId,
    params.name,
    params.slug,
    params.type || 'single',
    JSON.stringify(params.settings || {}),
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(organizationId: string): Promise<Organization | null> {
  const result = await queryOne<Organization>(
    'SELECT * FROM "organization" WHERE "organizationId" = $1 AND "deletedAt" IS NULL',
    [organizationId]
  );
  return result;
}

export async function findBySlug(slug: string): Promise<Organization | null> {
  const result = await queryOne<Organization>(
    'SELECT * FROM "organization" WHERE "slug" = $1 AND "deletedAt" IS NULL',
    [slug]
  );
  return result;
}

export async function findAll(): Promise<Organization[]> {
  const result = await query<{ rows: Organization[] }>(
    'SELECT * FROM "organization" WHERE "deletedAt" IS NULL ORDER BY "name" ASC'
  );
  return result?.rows ?? [];
}

export async function update(
  organizationId: string,
  params: UpdateOrganizationParams
): Promise<Organization | null> {
  const updates: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [new Date()];
  let paramIndex = 2;

  if (params.name !== undefined) {
    updates.push(`"name" = $${paramIndex++}`);
    values.push(params.name);
  }
  if (params.slug !== undefined) {
    updates.push(`"slug" = $${paramIndex++}`);
    values.push(params.slug);
  }
  if (params.type !== undefined) {
    updates.push(`"type" = $${paramIndex++}`);
    values.push(params.type);
  }
  if (params.settings !== undefined) {
    updates.push(`"settings" = $${paramIndex++}`);
    values.push(JSON.stringify(params.settings));
  }

  values.push(organizationId);
  const sql = `
    UPDATE "organization" 
    SET ${updates.join(', ')}
    WHERE "organizationId" = $${paramIndex} AND "deletedAt" IS NULL
    RETURNING *
  `;

  const result = await query<{ rows: Organization[] }>(sql, values);
  return result?.rows?.[0] ?? null;
}

export async function softDelete(organizationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "organization" SET "deletedAt" = $1 WHERE "organizationId" = $2 AND "deletedAt" IS NULL',
    [new Date(), organizationId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function getStoresByOrganization(organizationId: string): Promise<any[]> {
  const result = await query<{ rows: any[] }>(
    'SELECT * FROM "store" WHERE "organizationId" = $1 ORDER BY "name" ASC',
    [organizationId]
  );
  return result?.rows ?? [];
}

export async function getChannelsByOrganization(organizationId: string): Promise<any[]> {
  const result = await query<{ rows: any[] }>(
    'SELECT * FROM "channel" WHERE "organizationId" = $1 ORDER BY "name" ASC',
    [organizationId]
  );
  return result?.rows ?? [];
}

export default {
  create,
  findById,
  findBySlug,
  findAll,
  update,
  softDelete,
  getStoresByOrganization,
  getChannelsByOrganization,
};
