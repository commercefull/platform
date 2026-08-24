import { query, queryOne } from '../../../../libs/db';
import type { AutomationRuleRepository, ExecutionLogRepository } from '../../domain/repositories/AutomationRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';
import type {
  TriggerType, TriggerConfig, RuleCondition, ConditionMatchMode,
  RuleAction, ActionExecutionMode,
} from '../../domain/entities/AutomationRule';
import { AutomationValidationError } from '../../domain/errors/AutomationErrors';

interface RuleDbRow {
  automationRuleId: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: TriggerConfig;
  conditions: RuleCondition[];
  conditionMatchMode: string;
  actions: RuleAction[];
  actionExecutionMode: string;
  isActive: boolean;
  priority: number;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastTriggeredAt: Date | null;
  lastExecutedAt: Date | null;
  organizationId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

function rowToEntity(row: RuleDbRow): AutomationRule {
  return AutomationRule.reconstitute({
    ...row,
    triggerType: row.triggerType as TriggerType,
    conditionMatchMode: row.conditionMatchMode as ConditionMatchMode,
    actionExecutionMode: row.actionExecutionMode as ActionExecutionMode,
  });
}

export class AutomationRuleRepositoryImpl implements AutomationRuleRepository {
  async findById(id: string): Promise<AutomationRule | null> {
    const row = await queryOne<RuleDbRow>(
      `SELECT * FROM "automationRule" WHERE "automationRuleId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async findAll(activeOnly = false): Promise<AutomationRule[]> {
    let sql = `SELECT * FROM "automationRule" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC, "createdAt" DESC`;
    const rows = await query<RuleDbRow[]>(sql);
    return (rows || []).map(rowToEntity);
  }

  async findByTriggerType(triggerType: TriggerType, activeOnly = false): Promise<AutomationRule[]> {
    let sql = `SELECT * FROM "automationRule" WHERE "triggerType" = $1 AND "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC`;
    const rows = await query<RuleDbRow[]>(sql, [triggerType]);
    return (rows || []).map(rowToEntity);
  }

  async findByEventName(eventName: string, activeOnly = false): Promise<AutomationRule[]> {
    let sql = `SELECT * FROM "automationRule" WHERE "triggerType" = 'event' AND "deletedAt" IS NULL AND "triggerConfig"->>'eventName' = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC`;
    const rows = await query<RuleDbRow[]>(sql, [eventName]);
    return (rows || []).map(rowToEntity);
  }

  async findByOrganization(organizationId: string, activeOnly = false): Promise<AutomationRule[]> {
    let sql = `SELECT * FROM "automationRule" WHERE "organizationId" = $1 AND "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "priority" DESC, "createdAt" DESC`;
    const rows = await query<RuleDbRow[]>(sql, [organizationId]);
    return (rows || []).map(rowToEntity);
  }

  async create(rule: AutomationRule): Promise<AutomationRule> {
    const props = rule.toJSON();
    const row = await queryOne<RuleDbRow>(
      `INSERT INTO "automationRule" (
        "name", "description", "triggerType", "triggerConfig", "conditions",
        "conditionMatchMode", "actions", "actionExecutionMode", "isActive",
        "priority", "executionCount", "successCount", "failureCount",
        "lastTriggeredAt", "lastExecutedAt", "organizationId", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        props.name, props.description, props.triggerType,
        JSON.stringify(props.triggerConfig), JSON.stringify(props.conditions),
        props.conditionMatchMode, JSON.stringify(props.actions), props.actionExecutionMode,
        props.isActive, props.priority, props.executionCount, props.successCount,
        props.failureCount, props.lastTriggeredAt, props.lastExecutedAt,
        props.organizationId, props.createdBy, props.createdAt, props.updatedAt,
      ],
    );
    if (!row) throw new AutomationValidationError('Failed to create automation rule');
    return rowToEntity(row);
  }

  async update(rule: AutomationRule): Promise<AutomationRule | null> {
    const props = rule.toJSON();
    const row = await queryOne<RuleDbRow>(
      `UPDATE "automationRule" SET
        "name" = $1, "description" = $2, "triggerConfig" = $3, "conditions" = $4,
        "conditionMatchMode" = $5, "actions" = $6, "actionExecutionMode" = $7,
        "isActive" = $8, "priority" = $9, "executionCount" = $10, "successCount" = $11,
        "failureCount" = $12, "lastTriggeredAt" = $13, "lastExecutedAt" = $14, "updatedAt" = NOW()
       WHERE "automationRuleId" = $15 AND "deletedAt" IS NULL RETURNING *`,
      [
        props.name, props.description, JSON.stringify(props.triggerConfig),
        JSON.stringify(props.conditions), props.conditionMatchMode,
        JSON.stringify(props.actions), props.actionExecutionMode,
        props.isActive, props.priority, props.executionCount, props.successCount,
        props.failureCount, props.lastTriggeredAt, props.lastExecutedAt, props.automationRuleId,
      ],
    );
    return row ? rowToEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const row = await queryOne<{ automationRuleId: string }>(
      `UPDATE "automationRule" SET "deletedAt" = NOW() WHERE "automationRuleId" = $1 AND "deletedAt" IS NULL RETURNING "automationRuleId"`,
      [id],
    );
    return !!row;
  }

  async activate(id: string): Promise<AutomationRule | null> {
    const row = await queryOne<RuleDbRow>(
      `UPDATE "automationRule" SET "isActive" = true, "updatedAt" = NOW() WHERE "automationRuleId" = $1 AND "deletedAt" IS NULL RETURNING *`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async deactivate(id: string): Promise<AutomationRule | null> {
    const row = await queryOne<RuleDbRow>(
      `UPDATE "automationRule" SET "isActive" = false, "updatedAt" = NOW() WHERE "automationRuleId" = $1 AND "deletedAt" IS NULL RETURNING *`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "automationRule" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export class ExecutionLogRepositoryImpl implements ExecutionLogRepository {
  async create(params: {
    automationRuleId: string;
    triggerType: string;
    triggerEventId?: string;
    correlationId?: string;
    triggerData?: unknown;
    status: string;
    organizationId?: string;
  }): Promise<string> {
    const row = await queryOne<{ executionLogId: string }>(
      `INSERT INTO "automationExecutionLog" (
        "automationRuleId", "triggerType", "triggerEventId", "correlationId",
        "triggerData", "status", "organizationId", "startedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING "executionLogId"`,
      [
        params.automationRuleId, params.triggerType, params.triggerEventId ?? null,
        params.correlationId ?? null, params.triggerData ? JSON.stringify(params.triggerData) : null,
        params.status, params.organizationId ?? null,
      ],
    );
    return row?.executionLogId ?? '';
  }

  async update(id: string, params: {
    status: string;
    conditionResults?: unknown;
    actionResults?: unknown;
    errorMessage?: string;
    durationMs?: number;
    completedAt?: Date;
  }): Promise<void> {
    await query(
      `UPDATE "automationExecutionLog" SET
        "status" = $1, "conditionResults" = $2, "actionResults" = $3,
        "errorMessage" = $4, "durationMs" = $5, "completedAt" = $6
       WHERE "executionLogId" = $7`,
      [
        params.status,
        params.conditionResults ? JSON.stringify(params.conditionResults) : null,
        params.actionResults ? JSON.stringify(params.actionResults) : null,
        params.errorMessage ?? null,
        params.durationMs ?? null,
        params.completedAt ?? new Date(),
        id,
      ],
    );
  }

  async findByRule(ruleId: string, limit = 50): Promise<unknown[]> {
    const rows = await query<unknown[]>(
      `SELECT * FROM "automationExecutionLog" WHERE "automationRuleId" = $1 ORDER BY "startedAt" DESC LIMIT $2`,
      [ruleId, limit],
    );
    return rows || [];
  }

  async findByCorrelationId(correlationId: string): Promise<unknown[]> {
    const rows = await query<unknown[]>(
      `SELECT * FROM "automationExecutionLog" WHERE "correlationId" = $1 ORDER BY "startedAt" DESC`,
      [correlationId],
    );
    return rows || [];
  }

  async findRecent(limit = 50): Promise<unknown[]> {
    const rows = await query<unknown[]>(
      `SELECT * FROM "automationExecutionLog" ORDER BY "startedAt" DESC LIMIT $1`,
      [limit],
    );
    return rows || [];
  }

  async countByRule(ruleId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "automationExecutionLog" WHERE "automationRuleId" = $1`,
      [ruleId],
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByStatus(status: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "automationExecutionLog" WHERE "status" = $1`,
      [status],
    );
    return result ? parseInt(result.count, 10) : 0;
  }
}
