import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';

export class DeleteAutomationRuleUseCase {
  constructor(private ruleRepo: AutomationRuleRepository) {}

  async execute(ruleId: string): Promise<boolean> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new AutomationRuleNotFoundError(ruleId);
    return this.ruleRepo.delete(ruleId);
  }
}

