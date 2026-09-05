/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Role Policy Repository
 *
 * Loads and caches per-organization role policies from the rolePolicy table.
 * Falls back to system default policies when no org-specific policy exists.
 */

import { query, queryOne } from '../db';
import { logger } from '../logger';
import type { RolePolicy, PermissionRule } from './types';
import { DEFAULT_ROLE_POLICIES} from './defaultRoles';
import { setOrgPolicyCache, clearOrgPolicyCache } from './checkPermission';

interface RolePolicyRow {
  rolePolicyId: string;
  roleName: string;
  description: string | null;
  permissions: PermissionRule[];
  isSystem: boolean;
  isActive: boolean;
  organizationId: string | null;
  storeId: string | null;
}

function rowToPolicy(row: RolePolicyRow): RolePolicy {
  return {
    roleName: row.roleName,
    description: row.description ?? undefined,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    isSystem: row.isSystem,
    isActive: row.isActive,
  };
}

/**
 * Load all org-specific role policies from the database and populate the cache.
 * Called on app boot and can be refreshed on-demand.
 */
export async function loadOrgRolePolicies(): Promise<void> {
  try {
    const rows = await query<RolePolicyRow[]>(
      'SELECT * FROM "rolePolicy" WHERE "isActive" = true AND "organizationId" IS NOT NULL',
    );

    const cache = new Map<string, RolePolicy[]>();

    for (const row of rows ?? []) {
      const orgId = row.organizationId!;
      if (!cache.has(orgId)) {
        cache.set(orgId, []);
      }
      cache.get(orgId)!.push(rowToPolicy(row));
    }

    setOrgPolicyCache(cache);
    logger.info('Organization role policies loaded', { orgCount: cache.size });
  } catch (err: unknown) {
    logger.warn('Failed to load org role policies, using defaults only', {
      error: (err as Error).message,
    });
    clearOrgPolicyCache();
  }
}

/**
 * Get all role policies for a given organization.
 * Combines org-specific overrides with system defaults.
 */
async function getRolePoliciesForOrg(organizationId: string): Promise<RolePolicy[]> {
  const rows = await query<RolePolicyRow[]>(
    'SELECT * FROM "rolePolicy" WHERE "organizationId" = $1 AND "isActive" = true',
    [organizationId],
  );

  const orgPolicies = (rows ?? []).map(rowToPolicy);
  const systemPolicies = DEFAULT_ROLE_POLICIES;

  // Org policies override system defaults with the same roleName
  const byName = new Map<string, RolePolicy>();
  for (const p of systemPolicies) {
    byName.set(p.roleName, p);
  }
  for (const p of orgPolicies) {
    byName.set(p.roleName, p);
  }

  return Array.from(byName.values());
}

/**
 * Create or update a role policy for a specific organization.
 */
async function upsertOrgRolePolicy(
  organizationId: string,
  roleName: string,
  permissions: PermissionRule[],
  description?: string,
): Promise<RolePolicy> {
  const existing = await queryOne<{ rolePolicyId: string }>(
    'SELECT "rolePolicyId" FROM "rolePolicy" WHERE "organizationId" = $1 AND "roleName" = $2',
    [organizationId, roleName],
  );

  if (existing) {
    const row = await queryOne<RolePolicyRow>(
      `UPDATE "rolePolicy" SET "permissions" = $1, "description" = $2, "updatedAt" = NOW()
       WHERE "rolePolicyId" = $3 RETURNING *`,
      [JSON.stringify(permissions), description ?? null, existing.rolePolicyId],
    );
    await loadOrgRolePolicies();
    return rowToPolicy(row!);
  }

  const row = await queryOne<RolePolicyRow>(
    `INSERT INTO "rolePolicy" ("organizationId", "roleName", "description", "permissions", "isSystem", "isActive")
     VALUES ($1, $2, $3, $4, false, true) RETURNING *`,
    [organizationId, roleName, description ?? null, JSON.stringify(permissions)],
  );
  await loadOrgRolePolicies();
  return rowToPolicy(row!);
}

/**
 * Delete a custom org-specific role policy.
 * The system default will take effect after deletion.
 */
async function deleteOrgRolePolicy(
  organizationId: string,
  roleName: string,
): Promise<void> {
  await queryOne(
    `DELETE FROM "rolePolicy" WHERE "organizationId" = $1 AND "roleName" = $2 AND "isSystem" = false`,
    [organizationId, roleName],
  );
  await loadOrgRolePolicies();
}

/**
 * List all role policies (system + org-specific) for display.
 */
async function listAllRolePolicies(organizationId?: string): Promise<RolePolicy[]> {
  if (organizationId) {
    return getRolePoliciesForOrg(organizationId);
  }
  return DEFAULT_ROLE_POLICIES;
}
