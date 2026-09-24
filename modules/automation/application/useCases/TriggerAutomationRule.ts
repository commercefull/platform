/**
 * TriggerAutomationRule Use Case
 *
 * Manually triggers an automation rule by ID — loads the rule and delegates
 * execution to `ExecuteAutomationRuleUseCase`.
 */

import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import { ExecuteAutomationRuleUseCase, type ExecutionResult } from './ExecuteAutomationRule';

export class TriggerAutomationRuleUseCase {
  constructor(
    private readonly ruleRepo: AutomationRuleRepository,
    private readonly executeRule: Pick<ExecuteAutomationRuleUseCase, 'execute'>,
  ) {}

  async execute(ruleId: string, context?: Record<string, unknown>): Promise<ExecutionResult> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new AutomationRuleNotFoundError(ruleId);

    return this.executeRule.execute(rule, context ?? {}, 'manual');
  }
}
