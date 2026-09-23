import { ListAutomationRulesUseCase } from './ListAutomationRules';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { createAutomationRule, lazyMock } from '../../tests/testUtils';

describe('ListAutomationRulesUseCase', () => {
  it('should list rules and pass the activeOnly flag', async () => {
    const repo = lazyMock<AutomationRuleRepository>();
    repo.findAll.mockResolvedValue([createAutomationRule()]);

    const result = await new ListAutomationRulesUseCase(repo).execute(true);

    expect(result).toHaveLength(1);
    expect(repo.findAll).toHaveBeenCalledWith(true);
  });
});
