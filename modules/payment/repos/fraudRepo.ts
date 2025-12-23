/**
 * Fraud Repository
 * Handles CRUD operations for fraud rules, checks, and blacklists
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type RuleType = 'velocity' | 'amount' | 'location' | 'device' | 'pattern' | 'blacklist' | 'custom';
export type RuleAction = 'flag' | 'block' | 'review' | 'allow';
export type CheckStatus = 'pending' | 'passed' | 'flagged' | 'blocked' | 'reviewed' | 'overridden';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type BlacklistType = 'email' | 'ip' | 'phone' | 'address' | 'card_bin' | 'device_id' | 'customer';

export interface FraudRule {
  fraudRuleId: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  entityType: string;
  conditions: Record<string, any>;
  action: RuleAction;
  riskScore: number;
  priority: number;
  isActive: boolean;
  triggerCount: number;
  lastTriggeredAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudCheck {
  fraudCheckId: string;
  orderId?: string;
  customerId?: string;
  checkType: string;
  status: CheckStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRules?: any[];
  signals?: Record<string, any>;
  deviceFingerprint?: Record<string, any>;
  ipAddress?: string;
  ipCountry?: string;
  ipCity?: string;
  ipIsProxy: boolean;
  ipIsVpn: boolean;
  ipIsTor: boolean;
  billingCountry?: string;
  shippingCountry?: string;
  addressMismatch: boolean;
  highRiskCountry: boolean;
  previousOrders: number;
  previousChargebacks: number;
  orderAmount?: number;
  currency?: string;
  isFirstOrder: boolean;
  isGuestCheckout: boolean;
  paymentMethod?: string;
  cardBin?: string;
  cardCountry?: string;
  cardBinMismatch: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewDecision?: string;
  reviewNotes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudBlacklist {
  fraudBlacklistId: string;
  type: BlacklistType;
  value: string;
  reason?: string;
  source: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  isActive: boolean;
  expiresAt?: Date;
  addedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Fraud Rules
// ============================================================================

export async function getRule(fraudRuleId: string): Promise<FraudRule | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "fraudRule" WHERE "fraudRuleId" = $1', [fraudRuleId]);
  return row ? mapToRule(row) : null;
}

export async function getRules(activeOnly: boolean = true): Promise<FraudRule[]> {
  let whereClause = '1=1';
  if (activeOnly) {
    whereClause = '"isActive" = true';
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "fraudRule" WHERE ${whereClause} ORDER BY "priority" DESC, "riskScore" DESC`,
  );
  return (rows || []).map(mapToRule);
}

export async function saveRule(
  rule: Partial<FraudRule> & {
    name: string;
    ruleType: RuleType;
    conditions: Record<string, any>;
  },
): Promise<FraudRule> {
  const now = new Date().toISOString();

  if (rule.fraudRuleId) {
    await query(
      `UPDATE "fraudRule" SET
        "name" = $1, "description" = $2, "ruleType" = $3, "entityType" = $4,
        "conditions" = $5, "action" = $6, "riskScore" = $7, "priority" = $8,
        "isActive" = $9, "metadata" = $10, "updatedAt" = $11
      WHERE "fraudRuleId" = $12`,
      [
        rule.name,
        rule.description,
        rule.ruleType,
        rule.entityType || 'order',
        JSON.stringify(rule.conditions),
        rule.action || 'flag',
        rule.riskScore || 0,
        rule.priority || 0,
        rule.isActive !== false,
        rule.metadata ? JSON.stringify(rule.metadata) : null,
        now,
        rule.fraudRuleId,
      ],
    );
    return (await getRule(rule.fraudRuleId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "fraudRule" (
        "name", "description", "ruleType", "entityType", "conditions",
        "action", "riskScore", "priority", "isActive", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        rule.name,
        rule.description,
        rule.ruleType,
        rule.entityType || 'order',
        JSON.stringify(rule.conditions),
        rule.action || 'flag',
        rule.riskScore || 0,
        rule.priority || 0,
        true,
        rule.metadata ? JSON.stringify(rule.metadata) : null,
        now,
        now,
      ],
    );
    return mapToRule(result!);
  }
}

export async function deleteRule(fraudRuleId: string): Promise<void> {
  await query('UPDATE "fraudRule" SET "isActive" = false, "updatedAt" = $1 WHERE "fraudRuleId" = $2', [
    new Date().toISOString(),
    fraudRuleId,
  ]);
}

export async function incrementRuleTrigger(fraudRuleId: string): Promise<void> {
  await query(
    `UPDATE "fraudRule" SET 
      "triggerCount" = "triggerCount" + 1, "lastTriggeredAt" = $1, "updatedAt" = $1
     WHERE "fraudRuleId" = $2`,
    [new Date().toISOString(), fraudRuleId],
  );
}

// ============================================================================
// Fraud Checks
// ============================================================================

export async function getCheck(fraudCheckId: string): Promise<FraudCheck | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "fraudCheck" WHERE "fraudCheckId" = $1', [fraudCheckId]);
  return row ? mapToCheck(row) : null;
}

export async function getCheckByOrderId(orderId: string): Promise<FraudCheck | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "fraudCheck" WHERE "orderId" = $1 ORDER BY "createdAt" DESC LIMIT 1', [
    orderId,
  ]);
  return row ? mapToCheck(row) : null;
}

export async function getChecks(
  filters?: { status?: CheckStatus; riskLevel?: RiskLevel; customerId?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: FraudCheck[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.riskLevel) {
    whereClause += ` AND "riskLevel" = $${paramIndex++}`;
    params.push(filters.riskLevel);
  }
  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "fraudCheck" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "fraudCheck" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToCheck),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getPendingReviews(): Promise<FraudCheck[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "fraudCheck" WHERE "status" IN ('flagged', 'blocked') 
     AND "reviewedAt" IS NULL ORDER BY "riskScore" DESC, "createdAt" ASC`,
  );
  return (rows || []).map(mapToCheck);
}

export async function createCheck(check: {
  orderId?: string;
  customerId?: string;
  checkType: string;
  orderAmount?: number;
  currency?: string;
  ipAddress?: string;
  deviceFingerprint?: Record<string, any>;
  billingCountry?: string;
  shippingCountry?: string;
  paymentMethod?: string;
  cardBin?: string;
  isGuestCheckout?: boolean;
}): Promise<FraudCheck> {
  const now = new Date().toISOString();

  // Get customer history
  let previousOrders = 0;
  let previousChargebacks = 0;
  let isFirstOrder = true;

  if (check.customerId) {
    const history = await queryOne<{ orders: string; chargebacks: string }>(
      `SELECT 
        COUNT(*) as orders,
        COUNT(*) FILTER (WHERE "status" = 'blocked') as chargebacks
       FROM "fraudCheck" WHERE "customerId" = $1`,
      [check.customerId],
    );
    previousOrders = parseInt(history?.orders || '0');
    previousChargebacks = parseInt(history?.chargebacks || '0');
    isFirstOrder = previousOrders === 0;
  }

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "fraudCheck" (
      "orderId", "customerId", "checkType", "status", "riskScore", "riskLevel",
      "deviceFingerprint", "ipAddress", "billingCountry", "shippingCountry",
      "addressMismatch", "previousOrders", "previousChargebacks", "orderAmount",
      "currency", "isFirstOrder", "isGuestCheckout", "paymentMethod", "cardBin",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, 'pending', 0, 'low', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      check.orderId,
      check.customerId,
      check.checkType,
      check.deviceFingerprint ? JSON.stringify(check.deviceFingerprint) : null,
      check.ipAddress,
      check.billingCountry,
      check.shippingCountry,
      check.billingCountry !== check.shippingCountry,
      previousOrders,
      previousChargebacks,
      check.orderAmount,
      check.currency,
      isFirstOrder,
      check.isGuestCheckout || false,
      check.paymentMethod,
      check.cardBin,
      now,
      now,
    ],
  );

  return mapToCheck(result!);
}

export async function runFraudCheck(fraudCheckId: string): Promise<FraudCheck> {
  const check = await getCheck(fraudCheckId);
  if (!check) throw new Error('Fraud check not found');

  const rules = await getRules(true);
  const triggeredRules: any[] = [];
  let totalRiskScore = 0;
  let highestAction: RuleAction = 'allow';

  // Check blacklists first
  const blacklistChecks = await Promise.all([
    check.ipAddress ? isBlacklisted('ip', check.ipAddress) : false,
    check.customerId ? isBlacklisted('customer', check.customerId) : false,
    check.cardBin ? isBlacklisted('card_bin', check.cardBin) : false,
  ]);

  if (blacklistChecks.some(b => b)) {
    totalRiskScore = 100;
    highestAction = 'block';
    triggeredRules.push({ type: 'blacklist', action: 'block', riskScore: 100 });
  }

  // Evaluate rules
  for (const rule of rules) {
    const triggered = evaluateRule(rule, check);
    if (triggered) {
      triggeredRules.push({
        fraudRuleId: rule.fraudRuleId,
        name: rule.name,
        action: rule.action,
        riskScore: rule.riskScore,
      });
      totalRiskScore += rule.riskScore;
      await incrementRuleTrigger(rule.fraudRuleId);

      if (actionPriority(rule.action) > actionPriority(highestAction)) {
        highestAction = rule.action;
      }
    }
  }

  // Determine risk level and status
  const riskLevel = getRiskLevel(totalRiskScore);
  const status = getCheckStatus(highestAction, riskLevel);

  const now = new Date().toISOString();
  await query(
    `UPDATE "fraudCheck" SET 
      "status" = $1, "riskScore" = $2, "riskLevel" = $3, "triggeredRules" = $4, "updatedAt" = $5
     WHERE "fraudCheckId" = $6`,
    [status, Math.min(totalRiskScore, 100), riskLevel, JSON.stringify(triggeredRules), now, fraudCheckId],
  );

  return (await getCheck(fraudCheckId))!;
}

export async function reviewCheck(
  fraudCheckId: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string,
  notes?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const newStatus = decision === 'approved' ? 'overridden' : 'blocked';

  await query(
    `UPDATE "fraudCheck" SET 
      "status" = $1, "reviewedBy" = $2, "reviewedAt" = $3, 
      "reviewDecision" = $4, "reviewNotes" = $5, "updatedAt" = $3
     WHERE "fraudCheckId" = $6`,
    [newStatus, reviewedBy, now, decision, notes, fraudCheckId],
  );
}

// ============================================================================
// Blacklist
// ============================================================================

export async function getBlacklistEntry(fraudBlacklistId: string): Promise<FraudBlacklist | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "fraudBlacklist" WHERE "fraudBlacklistId" = $1', [fraudBlacklistId]);
  return row ? mapToBlacklist(row) : null;
}

export async function getBlacklist(
  filters?: { type?: BlacklistType; isActive?: boolean },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: FraudBlacklist[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.type) {
    whereClause += ` AND "type" = $${paramIndex++}`;
    params.push(filters.type);
  }
  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "fraudBlacklist" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "fraudBlacklist" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToBlacklist),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function isBlacklisted(type: BlacklistType, value: string): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "fraudBlacklist" 
     WHERE "type" = $1 AND "value" = $2 AND "isActive" = true
     AND ("expiresAt" IS NULL OR "expiresAt" > NOW())`,
    [type, value.toLowerCase()],
  );
  return parseInt(row?.count || '0') > 0;
}

export async function addToBlacklist(entry: {
  type: BlacklistType;
  value: string;
  reason?: string;
  source?: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  expiresAt?: Date;
  addedBy?: string;
}): Promise<FraudBlacklist> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "fraudBlacklist" (
      "type", "value", "reason", "source", "relatedOrderId", "relatedCustomerId",
      "isActive", "expiresAt", "addedBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10)
    ON CONFLICT ("type", "value") DO UPDATE SET
      "isActive" = true, "reason" = COALESCE($3, "fraudBlacklist"."reason"),
      "expiresAt" = $7, "updatedAt" = $10
    RETURNING *`,
    [
      entry.type,
      entry.value.toLowerCase(),
      entry.reason,
      entry.source || 'manual',
      entry.relatedOrderId,
      entry.relatedCustomerId,
      entry.expiresAt?.toISOString(),
      entry.addedBy,
      now,
      now,
    ],
  );

  return mapToBlacklist(result!);
}

export async function removeFromBlacklist(fraudBlacklistId: string): Promise<void> {
  await query('UPDATE "fraudBlacklist" SET "isActive" = false, "updatedAt" = $1 WHERE "fraudBlacklistId" = $2', [
    new Date().toISOString(),
    fraudBlacklistId,
  ]);
}

export async function expireBlacklistEntries(): Promise<number> {
  const result = await query(
    `UPDATE "fraudBlacklist" SET "isActive" = false, "updatedAt" = $1
     WHERE "isActive" = true AND "expiresAt" < NOW()`,
    [new Date().toISOString()],
  );
  return (result as any)?.rowCount || 0;
}

// ============================================================================
// Helpers
// ============================================================================

function evaluateRule(rule: FraudRule, check: FraudCheck): boolean {
  const conditions = rule.conditions;

  switch (rule.ruleType) {
    case 'amount':
      if (conditions.minAmount && (check.orderAmount || 0) < conditions.minAmount) return false;
      if (conditions.maxAmount && (check.orderAmount || 0) > conditions.maxAmount) return true;
      return false;

    case 'location':
      if (conditions.highRiskCountries?.includes(check.billingCountry)) return true;
      if (conditions.highRiskCountries?.includes(check.shippingCountry)) return true;
      if (conditions.requireAddressMatch && check.addressMismatch) return true;
      return false;

    case 'velocity':
      if (conditions.maxOrdersPerDay && check.previousOrders >= conditions.maxOrdersPerDay) return true;
      return false;

    case 'pattern':
      if (conditions.firstOrderHighValue && check.isFirstOrder && (check.orderAmount || 0) > (conditions.threshold || 500)) return true;
      if (conditions.guestCheckoutHighValue && check.isGuestCheckout && (check.orderAmount || 0) > (conditions.threshold || 300))
        return true;
      return false;

    case 'device':
      if (conditions.blockProxy && check.ipIsProxy) return true;
      if (conditions.blockVpn && check.ipIsVpn) return true;
      if (conditions.blockTor && check.ipIsTor) return true;
      return false;

    default:
      return false;
  }
}

function actionPriority(action: RuleAction): number {
  switch (action) {
    case 'block':
      return 4;
    case 'review':
      return 3;
    case 'flag':
      return 2;
    case 'allow':
      return 1;
    default:
      return 0;
  }
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function getCheckStatus(action: RuleAction, riskLevel: RiskLevel): CheckStatus {
  if (action === 'block') return 'blocked';
  if (action === 'review' || riskLevel === 'critical' || riskLevel === 'high') return 'flagged';
  if (action === 'flag' || riskLevel === 'medium') return 'flagged';
  return 'passed';
}

function mapToRule(row: Record<string, any>): FraudRule {
  return {
    fraudRuleId: row.fraudRuleId,
    name: row.name,
    description: row.description,
    ruleType: row.ruleType,
    entityType: row.entityType,
    conditions: row.conditions || {},
    action: row.action,
    riskScore: parseInt(row.riskScore) || 0,
    priority: parseInt(row.priority) || 0,
    isActive: Boolean(row.isActive),
    triggerCount: parseInt(row.triggerCount) || 0,
    lastTriggeredAt: row.lastTriggeredAt ? new Date(row.lastTriggeredAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToCheck(row: Record<string, any>): FraudCheck {
  return {
    fraudCheckId: row.fraudCheckId,
    orderId: row.orderId,
    customerId: row.customerId,
    checkType: row.checkType,
    status: row.status,
    riskScore: parseInt(row.riskScore) || 0,
    riskLevel: row.riskLevel,
    triggeredRules: row.triggeredRules,
    signals: row.signals,
    deviceFingerprint: row.deviceFingerprint,
    ipAddress: row.ipAddress,
    ipCountry: row.ipCountry,
    ipCity: row.ipCity,
    ipIsProxy: Boolean(row.ipIsProxy),
    ipIsVpn: Boolean(row.ipIsVpn),
    ipIsTor: Boolean(row.ipIsTor),
    billingCountry: row.billingCountry,
    shippingCountry: row.shippingCountry,
    addressMismatch: Boolean(row.addressMismatch),
    highRiskCountry: Boolean(row.highRiskCountry),
    previousOrders: parseInt(row.previousOrders) || 0,
    previousChargebacks: parseInt(row.previousChargebacks) || 0,
    orderAmount: row.orderAmount ? parseFloat(row.orderAmount) : undefined,
    currency: row.currency,
    isFirstOrder: Boolean(row.isFirstOrder),
    isGuestCheckout: Boolean(row.isGuestCheckout),
    paymentMethod: row.paymentMethod,
    cardBin: row.cardBin,
    cardCountry: row.cardCountry,
    cardBinMismatch: Boolean(row.cardBinMismatch),
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : undefined,
    reviewDecision: row.reviewDecision,
    reviewNotes: row.reviewNotes,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBlacklist(row: Record<string, any>): FraudBlacklist {
  return {
    fraudBlacklistId: row.fraudBlacklistId,
    type: row.type,
    value: row.value,
    reason: row.reason,
    source: row.source,
    relatedOrderId: row.relatedOrderId,
    relatedCustomerId: row.relatedCustomerId,
    isActive: Boolean(row.isActive),
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    addedBy: row.addedBy,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
