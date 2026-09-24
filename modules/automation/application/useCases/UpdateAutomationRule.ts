import type { AutomationRule } from '../../domain/entities/AutomationRule';
import type {
  TriggerConfig,
  RuleCondition,
  ConditionMatchMode,
  RuleAction,
  ActionExecutionMode,
} from '../../domain/entities/AutomationRule';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';

export class UpdateAutomationRuleUseCase {
  constructor(private ruleRepo: AutomationRuleRepository) {}

  async execute(
    ruleId: string,
    params: Partial<{
      name: string;
      description: string;
      triggerConfig: TriggerConfig;
      conditions: RuleCondition[];
      conditionMatchMode: ConditionMatchMode;
      actions: RuleAction[];
      actionExecutionMode: ActionExecutionMode;
      isActive: boolean;
      priority: number;
    }>,
  ): Promise<AutomationRule> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new AutomationRuleNotFoundError(ruleId);

    rule.update(params);
    const updated = await this.ruleRepo.update(rule);
    if (!updated) throw new AutomationRuleNotFoundError(ruleId);
    return updated;
  }
}

