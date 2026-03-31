import { query, queryOne } from '../../../../libs/db';

export interface FulfillmentRule {
  fulfillmentRuleId: string;
  name: string;
  priority: number;
  conditions: Record<string, any>;
  action: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findActive(): Promise<FulfillmentRule[]> {
  return (await query<FulfillmentRule[]>(
    `SELECT * FROM "fulfillmentRule" WHERE "isActive" = true ORDER BY priority ASC`,
  )) || [];
}

export async function findById(fulfillmentRuleId: string): Promise<FulfillmentRule | null> {
  return queryOne<FulfillmentRule>(`SELECT * FROM "fulfillmentRule" WHERE "fulfillmentRuleId" = $1`, [fulfillmentRuleId]);
}

export async function create(params: Omit<FulfillmentRule, 'fulfillmentRuleId' | 'createdAt' | 'updatedAt'>): Promise<FulfillmentRule | null> {
  const now = new Date();
  return queryOne<FulfillmentRule>(
    `INSERT INTO "fulfillmentRule" (name, priority, conditions, action, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.name, params.priority, JSON.stringify(params.conditions), JSON.stringify(params.action), params.isActive, now, now],
  );
}

export async function updatePriority(fulfillmentRuleId: string, priority: number): Promise<void> {
  await query(`UPDATE "fulfillmentRule" SET priority = $1, "updatedAt" = $2 WHERE "fulfillmentRuleId" = $3`, [priority, new Date(), fulfillmentRuleId]);
}

export default { findActive, findById, create, updatePriority };
