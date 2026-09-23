import { AutomationRule } from '../../domain/entities/AutomationRule';
import type {
  TriggerType,
  TriggerConfig,
  RuleCondition,
  ConditionMatchMode,
  RuleAction,
  ActionExecutionMode,
} from '../../domain/entities/AutomationRule';
import { InvalidAutomationRuleError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';

export class CreateAutomationRuleUseCase {
  constructor(private ruleRepo: AutomationRuleRepository) {}

  async execute(params: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig: TriggerConfig;
    conditions?: RuleCondition[];
    conditionMatchMode?: ConditionMatchMode;
    actions: RuleAction[];
    actionExecutionMode?: ActionExecutionMode;
    priority?: number;
    organizationId?: string;
    createdBy?: string;
  }): Promise<AutomationRule> {
    if (!params.actions || params.actions.length === 0) {
      throw new InvalidAutomationRuleError('At least one action is required');
    }

    if (params.triggerType === 'event' && !params.triggerConfig.eventName) {
      throw new InvalidAutomationRuleError('Event trigger requires eventName in triggerConfig');
    }

    if (params.triggerType === 'schedule' && !params.triggerConfig.cronExpression) {
      throw new InvalidAutomationRuleError('Schedule trigger requires cronExpression in triggerConfig');
    }

    const rule = AutomationRule.create(params);
    return this.ruleRepo.create(rule);
  }
}

