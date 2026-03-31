import { query, queryOne } from '../../../../libs/db';

export interface FulfillmentNetworkRule {
  fulfillmentNetworkRuleId: string;
  name: string;
  organizationId?: string;
  priority: number;
  conditions: Record<string, any>;
  routingStrategy: string;
  locationIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findActive(organizationId?: string): Promise<FulfillmentNetworkRule[]> {
  const sql = organizationId
    ? `SELECT * FROM "fulfillmentNetworkRule" WHERE "isActive" = true AND ("organizationId" = $1 OR "organizationId" IS NULL) ORDER BY priority ASC`
    : `SELECT * FROM "fulfillmentNetworkRule" WHERE "isActive" = true ORDER BY priority ASC`;
  return (await query<FulfillmentNetworkRule[]>(sql, organizationId ? [organizationId] : [])) || [];
}

export async function create(params: Omit<FulfillmentNetworkRule, 'fulfillmentNetworkRuleId' | 'createdAt' | 'updatedAt'>): Promise<FulfillmentNetworkRule | null> {
  const now = new Date();
  return queryOne<FulfillmentNetworkRule>(
    `INSERT INTO "fulfillmentNetworkRule" (name, "organizationId", priority, conditions, "routingStrategy", "locationIds", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [params.name, params.organizationId || null, params.priority, JSON.stringify(params.conditions), params.routingStrategy, params.locationIds ? JSON.stringify(params.locationIds) : null, params.isActive, now, now],
  );
}

export default { findActive, create };
