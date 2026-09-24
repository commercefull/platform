/**
 * Unit Tests for ExecuteAutomationRuleUseCase
 */

jest.mock('../../domain/services/ConditionEvaluator', () => ({
  evaluateConditions: jest.fn(),
}));
jest.mock('../../domain/services/ActionExecutor', () => ({
  executeActions: jest.fn(),
}));
jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { lazyMock, createAutomationRule } from '../../tests/testUtils';
import { evaluateConditions } from '../../domain/services/ConditionEvaluator';
import { executeActions } from '../../domain/services/ActionExecutor';
import type { AutomationRuleRepository, ExecutionLogRepository } from '../../domain/repositories/AutomationRepository';
import { ExecuteAutomationRuleUseCase } from './ExecuteAutomationRule';

const mockEvaluateConditions = evaluateConditions as jest.Mock;
const mockExecuteActions = executeActions as jest.Mock;

describe('ExecuteAutomationRuleUseCase', () => {
  let useCase: ExecuteAutomationRuleUseCase;
  let ruleRepo: jest.Mocked<AutomationRuleRepository>;
  let logRepo: jest.Mocked<ExecutionLogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    ruleRepo = lazyMock<AutomationRuleRepository>();
    logRepo = lazyMock<ExecutionLogRepository>();
    useCase = new ExecuteAutomationRuleUseCase(ruleRepo, logRepo, new Map());
    logRepo.create.mockResolvedValue('log-1');
    logRepo.update.mockResolvedValue(undefined);
    ruleRepo.update.mockResolvedValue(null);
    mockExecuteActions.mockResolvedValue([{ action: 'send_notification', success: true }]);
  });

  it('should mark the execution skipped when conditions are not met', async () => {
    mockEvaluateConditions.mockReturnValue(false);
    const rule = createAutomationRule();

    const result = await useCase.execute(rule, { order: { id: 'o1' } });

    expect(result.status).toBe('skipped');
    expect(result.conditionResults).toBe(false);
    expect(logRepo.update).toHaveBeenCalledWith('log-1', expect.objectContaining({ status: 'skipped' }));
    expect(mockExecuteActions).not.toHaveBeenCalled();
    expect(ruleRepo.update).toHaveBeenCalledWith(rule);
  });

  it('should succeed when conditions pass and all actions succeed', async () => {
    mockEvaluateConditions.mockReturnValue(true);
    const rule = createAutomationRule();

    const result = await useCase.execute(rule, { order: { id: 'o1' } }, 'evt-1', 'corr-1');

    expect(result.status).toBe('success');
    expect(result.conditionResults).toBe(true);
    expect(result.actionResults).toHaveLength(1);
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ triggerEventId: 'evt-1', correlationId: 'corr-1', status: 'running' }),
    );
    expect(logRepo.update).toHaveBeenCalledWith('log-1', expect.objectContaining({ status: 'success' }));
    expect(ruleRepo.update).toHaveBeenCalledWith(rule);
  });

  it('should fail when all actions fail', async () => {
    mockEvaluateConditions.mockReturnValue(true);
    mockExecuteActions.mockResolvedValue([{ action: 'send_notification', success: false, error: 'boom' }]);
    const rule = createAutomationRule();

    const result = await useCase.execute(rule, {});

    expect(result.status).toBe('failed');
    expect(result.error).toBe('One or more actions failed');
    expect(logRepo.update).toHaveBeenCalledWith('log-1', expect.objectContaining({ status: 'failed' }));
  });

  it('should fail and record the error when action execution throws', async () => {
    mockEvaluateConditions.mockReturnValue(true);
    mockExecuteActions.mockRejectedValue(new Error('executor exploded'));
    const rule = createAutomationRule();

    const result = await useCase.execute(rule, {});

    expect(result.status).toBe('failed');
    expect(result.error).toBe('executor exploded');
    expect(logRepo.update).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({ status: 'failed', errorMessage: 'executor exploded' }),
    );
    expect(ruleRepo.update).toHaveBeenCalledWith(rule);
  });
});
