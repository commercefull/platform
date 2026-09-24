import { GetAutomationRuleUseCase } from './GetAutomationRule';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { createAutomationRule, lazyMock } from '../../tests/testUtils';

describe('GetAutomationRuleUseCase', () => {
  it('should return the rule when it exists', async () => {
    const repo = lazyMock<AutomationRuleRepository>();
    repo.findById.mockResolvedValue(createAutomationRule());

    const result = await new GetAutomationRuleUseCase(repo).execute('r1');

    expect(result.name).toBe('Order Alert');
  });

  it('should throw AutomationRuleNotFoundError when the rule does not exist', async () => {
    const repo = lazyMock<AutomationRuleRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(new GetAutomationRuleUseCase(repo).execute('missing')).rejects.toThrow(AutomationRuleNotFoundError);
  });
});

