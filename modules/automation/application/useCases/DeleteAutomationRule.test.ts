import { DeleteAutomationRuleUseCase } from './DeleteAutomationRule';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { createAutomationRule, lazyMock } from '../../tests/testUtils';

describe('DeleteAutomationRuleUseCase', () => {
  it('should delete the rule when it exists', async () => {
    const repo = lazyMock<AutomationRuleRepository>();
    repo.findById.mockResolvedValue(createAutomationRule());
    repo.delete.mockResolvedValue(true);

    const result = await new DeleteAutomationRuleUseCase(repo).execute('r1');

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('r1');
  });

  it('should throw AutomationRuleNotFoundError when the rule does not exist', async () => {
    const repo = lazyMock<AutomationRuleRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(new DeleteAutomationRuleUseCase(repo).execute('missing')).rejects.toThrow(AutomationRuleNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

