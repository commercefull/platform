import type { AutomationRule } from '../entities/AutomationRule';
import type { TriggerType } from '../entities/AutomationRule';

export interface AutomationRuleRepository {
  findById(id: string): Promise<AutomationRule | null>;
  findAll(activeOnly?: boolean): Promise<AutomationRule[]>;
  findByTriggerType(triggerType: TriggerType, activeOnly?: boolean): Promise<AutomationRule[]>;
  findByEventName(eventName: string, activeOnly?: boolean): Promise<AutomationRule[]>;
  findByOrganization(organizationId: string, activeOnly?: boolean): Promise<AutomationRule[]>;

  create(rule: AutomationRule): Promise<AutomationRule>;
  update(rule: AutomationRule): Promise<AutomationRule | null>;
  delete(id: string): Promise<boolean>;
  activate(id: string): Promise<AutomationRule | null>;
  deactivate(id: string): Promise<AutomationRule | null>;

  count(activeOnly?: boolean): Promise<number>;
}

export interface ExecutionLogRepository {
  create(params: {
    automationRuleId: string;
    triggerType: string;
    triggerEventId?: string;
    correlationId?: string;
    triggerData?: unknown;
    status: string;
    organizationId?: string;
  }): Promise<string>;

  update(id: string, params: {
    status: string;
    conditionResults?: unknown;
    actionResults?: unknown;
    errorMessage?: string;
    durationMs?: number;
    completedAt?: Date;
  }): Promise<void>;

  findByRule(ruleId: string, limit?: number): Promise<unknown[]>;
  findByCorrelationId(correlationId: string): Promise<unknown[]>;
  findRecent(limit?: number): Promise<unknown[]>;
  countByRule(ruleId: string): Promise<number>;
  countByStatus(status: string): Promise<number>;
}
