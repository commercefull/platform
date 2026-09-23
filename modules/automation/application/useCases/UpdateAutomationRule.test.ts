import { UpdateAutomationRuleUseCase } from './UpdateAutomationRule';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { createAutomationRule, lazyMock } from '../../tests/testUtils';

describe('UpdateAutomationRuleUseCase', () => {
  let useCase: UpdateAutomationRuleUseCase;
  let repo: jest.Mocked<AutomationRuleRepository>;

  beforeEach(() => {
    repo = lazyMock<AutomationRuleRepository>();
    repo.findById.mockResolvedValue(createAutomationRule());
    repo.update.mockImplementation(async r => r);
    useCase = new UpdateAutomationRuleUseCase(repo);
  });

  it('should update the rule when it exists', async () => {
    const result = await useCase.execute('r1', { name: 'Renamed', isActive: false });

    expect(result.name).toBe('Renamed');
    expect(repo.update).toHaveBeenCalled();
  });

  it('should throw AutomationRuleNotFoundError when the rule does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', { name: 'X' })).rejects.toThrow(AutomationRuleNotFoundError);
  });
});

