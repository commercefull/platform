import { CreateAutomationRuleUseCase } from './CreateAutomationRule';
import { InvalidAutomationRuleError } from '../../domain/errors/AutomationErrors';
import type { AutomationRuleRepository } from '../../domain/repositories/AutomationRepository';
import { lazyMock, RULE_ACTION } from '../../tests/testUtils';

describe('CreateAutomationRuleUseCase', () => {
  let useCase: CreateAutomationRuleUseCase;
  let repo: jest.Mocked<AutomationRuleRepository>;

  beforeEach(() => {
    repo = lazyMock<AutomationRuleRepository>();
    repo.create.mockImplementation(async r => r);
    useCase = new CreateAutomationRuleUseCase(repo);
  });

  it('should create a rule when actions and a valid trigger are provided', async () => {
    const result = await useCase.execute({
      name: 'Order Alert',
      triggerType: 'event',
      triggerConfig: { eventName: 'order.created' },
      actions: [RULE_ACTION],
    });

    expect(result.name).toBe('Order Alert');
    expect(result.isActive).toBe(true);
    expect(repo.create).toHaveBeenCalled();
  });

  it('should throw InvalidAutomationRuleError when no actions are provided', async () => {
    await expect(
      useCase.execute({ name: 'X', triggerType: 'manual', triggerConfig: {}, actions: [] }),
    ).rejects.toThrow(InvalidAutomationRuleError);
  });

  it('should throw InvalidAutomationRuleError when an event trigger lacks eventName', async () => {
    await expect(
      useCase.execute({ name: 'X', triggerType: 'event', triggerConfig: {}, actions: [RULE_ACTION] }),
    ).rejects.toThrow(InvalidAutomationRuleError);
  });

  it('should throw InvalidAutomationRuleError when a schedule trigger lacks cronExpression', async () => {
    await expect(
      useCase.execute({ name: 'X', triggerType: 'schedule', triggerConfig: {}, actions: [RULE_ACTION] }),
    ).rejects.toThrow(InvalidAutomationRuleError);
  });
});

