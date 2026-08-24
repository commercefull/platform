jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../../../libs/jobs/cronScheduler', () => ({
  JobScheduler: { scheduleNotification: jest.fn().mockResolvedValue(undefined) },
}));

import { query, queryOne } from '../../../../libs/db';
import { AutomationRuleRepositoryImpl, ExecutionLogRepositoryImpl } from './AutomationRepositoryImpl';
import { AutomationRule } from '../../domain/entities/AutomationRule';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('AutomationRuleRepositoryImpl', () => {
  let repo: AutomationRuleRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AutomationRuleRepositoryImpl();
  });

  it('findById returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('findById returns rule when found', async () => {
    const mockRow = {
      automationRuleId: 'r1', name: 'Test Rule', description: null,
      triggerType: 'event', triggerConfig: { eventName: 'order.created' },
      conditions: [], conditionMatchMode: 'all',
      actions: [{ type: 'custom', config: {} }], actionExecutionMode: 'sequential',
      isActive: true, priority: 0, executionCount: 0, successCount: 0, failureCount: 0,
      lastTriggeredAt: null, lastExecutedAt: null, organizationId: null, createdBy: null,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.findById('r1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Test Rule');
    expect(result!.triggerType).toBe('event');
  });

  it('findAll returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findAll();
    expect(result).toEqual([]);
  });

  it('findByEventName queries with eventName', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findByEventName('order.created', true);
    expect(result).toEqual([]);
    expect(mockedQuery).toHaveBeenCalled();
  });

  it('create returns created rule', async () => {
    const rule = AutomationRule.create({
      name: 'New Rule',
      triggerType: 'event',
      triggerConfig: { eventName: 'test.event' },
      actions: [{ type: 'custom', config: {} }],
    });
    const mockRow = {
      automationRuleId: 'r1', name: 'New Rule', description: null,
      triggerType: 'event', triggerConfig: { eventName: 'test.event' },
      conditions: [], conditionMatchMode: 'all',
      actions: [{ type: 'custom', config: {} }], actionExecutionMode: 'sequential',
      isActive: true, priority: 0, executionCount: 0, successCount: 0, failureCount: 0,
      lastTriggeredAt: null, lastExecutedAt: null, organizationId: null, createdBy: null,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.create(rule);
    expect(result.name).toBe('New Rule');
  });

  it('delete returns true when deleted', async () => {
    mockedQueryOne.mockResolvedValueOnce({ automationRuleId: 'r1' } as never);
    const result = await repo.delete('r1');
    expect(result).toBe(true);
  });

  it('delete returns false when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.delete('nonexistent');
    expect(result).toBe(false);
  });

  it('count returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.count();
    expect(result).toBe(0);
  });

  it('activate returns activated rule', async () => {
    const mockRow = {
      automationRuleId: 'r1', name: 'Test', description: null,
      triggerType: 'manual', triggerConfig: {}, conditions: [], conditionMatchMode: 'all',
      actions: [{ type: 'custom', config: {} }], actionExecutionMode: 'sequential',
      isActive: true, priority: 0, executionCount: 0, successCount: 0, failureCount: 0,
      lastTriggeredAt: null, lastExecutedAt: null, organizationId: null, createdBy: null,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.activate('r1');
    expect(result).not.toBeNull();
    expect(result!.isActive).toBe(true);
  });

  it('deactivate returns deactivated rule', async () => {
    const mockRow = {
      automationRuleId: 'r1', name: 'Test', description: null,
      triggerType: 'manual', triggerConfig: {}, conditions: [], conditionMatchMode: 'all',
      actions: [{ type: 'custom', config: {} }], actionExecutionMode: 'sequential',
      isActive: false, priority: 0, executionCount: 0, successCount: 0, failureCount: 0,
      lastTriggeredAt: null, lastExecutedAt: null, organizationId: null, createdBy: null,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.deactivate('r1');
    expect(result).not.toBeNull();
    expect(result!.isActive).toBe(false);
  });
});

describe('ExecutionLogRepositoryImpl', () => {
  let repo: ExecutionLogRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ExecutionLogRepositoryImpl();
  });

  it('create returns executionLogId', async () => {
    mockedQueryOne.mockResolvedValueOnce({ executionLogId: 'log1' } as never);
    const id = await repo.create({
      automationRuleId: 'r1',
      triggerType: 'event',
      status: 'running',
    });
    expect(id).toBe('log1');
  });

  it('create returns empty string when insert fails', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const id = await repo.create({
      automationRuleId: 'r1',
      triggerType: 'event',
      status: 'running',
    });
    expect(id).toBe('');
  });

  it('findByRule returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findByRule('r1');
    expect(result).toEqual([]);
  });

  it('countByRule returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.countByRule('r1');
    expect(result).toBe(0);
  });

  it('countByStatus returns correct number', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '5' } as never);
    const result = await repo.countByStatus('success');
    expect(result).toBe(5);
  });

  it('update calls query without error', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    await repo.update('log1', { status: 'success', completedAt: new Date() });
    expect(mockedQuery).toHaveBeenCalled();
  });
});
