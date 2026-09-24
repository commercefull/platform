/**
 * Unit Tests for TriggerAutomationRuleUseCase
 */

import { lazyMock, createAutomationRule } from '../../tests/testUtils';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import { TriggerAutomationRuleUseCase } from './TriggerAutomationRule';
import type { ExecuteAutomationRuleUseCase, ExecutionResult } from './ExecuteAutomationRule';

describe('TriggerAutomationRuleUseCase', () => {
  let useCase: TriggerAutomationRuleUseCase;
  let ruleRepo: jest.Mocked<AutomationRuleRepository>;
  let executeRule: jest.Mocked<Pick<ExecuteAutomationRuleUseCase, 'execute'>>;

  beforeEach(() => {
    jest.clearAllMocks();
    ruleRepo = lazyMock<AutomationRuleRepository>();
    executeRule = { execute: jest.fn() };
    useCase = new TriggerAutomationRuleUseCase(ruleRepo, executeRule);
  });

  it('should throw AutomationRuleNotFoundError when the rule does not exist', async () => {
    ruleRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-rule')).rejects.toThrow(AutomationRuleNotFoundError);
    expect(executeRule.execute).not.toHaveBeenCalled();
  });

  it('should delegate to ExecuteAutomationRuleUseCase with manual trigger id', async () => {
    const rule = createAutomationRule();
    ruleRepo.findById.mockResolvedValue(rule);
    const expected: ExecutionResult = {
      ruleId: rule.automationRuleId,
      executionLogId: 'log-1',
      status: 'success',
      conditionResults: true,
      actionResults: [],
      durationMs: 5,
    };
    executeRule.execute.mockResolvedValue(expected);

    const result = await useCase.execute(rule.automationRuleId, { order: { id: 'o1' } });

    expect(executeRule.execute).toHaveBeenCalledWith(rule, { order: { id: 'o1' } }, 'manual');
    expect(result).toBe(expected);
  });

  it('should default context to an empty object', async () => {
    const rule = createAutomationRule();
    ruleRepo.findById.mockResolvedValue(rule);
    executeRule.execute.mockResolvedValue({} as ExecutionResult);

    await useCase.execute(rule.automationRuleId);

    expect(executeRule.execute).toHaveBeenCalledWith(rule, {}, 'manual');
  });
});
