import type { AutomationRule } from '../../domain/entities/AutomationRule';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';

export class ListAutomationRulesUseCase {
  constructor(private ruleRepo: AutomationRuleRepository) {}

  async execute(activeOnly?: boolean): Promise<AutomationRule[]> {
    return this.ruleRepo.findAll(activeOnly);
  }
}
