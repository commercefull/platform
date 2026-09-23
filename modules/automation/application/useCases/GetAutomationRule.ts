import type { AutomationRule } from '../../domain/entities/AutomationRule';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';

export class GetAutomationRuleUseCase {
  constructor(private ruleRepo: AutomationRuleRepository) {}

  async execute(ruleId: string): Promise<AutomationRule> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new AutomationRuleNotFoundError(ruleId);
    return rule;
  }
}

