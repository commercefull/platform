import { AutomationRule } from './entities/AutomationRule';
import { evaluateCondition, evaluateConditions } from './services/ConditionEvaluator';

describe('AutomationRule', () => {
  it('create produces a valid rule', () => {
    const rule = AutomationRule.create({
      name: 'Welcome Email',
      triggerType: 'event',
      triggerConfig: { eventName: 'customer.registered' },
      actions: [{ type: 'send_notification', config: { title: 'Welcome!' } }],
    });

    expect(rule.name).toBe('Welcome Email');
    expect(rule.triggerType).toBe('event');
    expect(rule.isActive).toBe(true);
    expect(rule.actions).toHaveLength(1);
    expect(rule.conditionMatchMode).toBe('all');
    expect(rule.actionExecutionMode).toBe('sequential');
    expect(rule.priority).toBe(0);
    expect(rule.executionCount).toBe(0);
  });

  it('create with conditions and parallel mode', () => {
    const rule = AutomationRule.create({
      name: 'VIP Discount',
      triggerType: 'event',
      triggerConfig: { eventName: 'order.completed' },
      conditions: [
        { field: 'customer.lifetimeValue', operator: 'gt', value: 5000 },
        { field: 'customer.tier', operator: 'eq', value: 'loyal' },
      ],
      conditionMatchMode: 'all',
      actions: [
        { type: 'apply_discount', config: { percent: 10 } },
        { type: 'send_notification', config: { title: 'VIP discount!' } },
      ],
      actionExecutionMode: 'parallel',
      priority: 10,
    });

    expect(rule.conditions).toHaveLength(2);
    expect(rule.conditionMatchMode).toBe('all');
    expect(rule.actionExecutionMode).toBe('parallel');
    expect(rule.priority).toBe(10);
  });

  it('update modifies fields', () => {
    const rule = AutomationRule.create({
      name: 'Test',
      triggerType: 'manual',
      triggerConfig: {},
      actions: [{ type: 'custom', config: {} }],
    });

    rule.update({ name: 'Updated', isActive: false, priority: 5 });
    expect(rule.name).toBe('Updated');
    expect(rule.isActive).toBe(false);
    expect(rule.priority).toBe(5);
  });

  it('recordExecution increments counts', () => {
    const rule = AutomationRule.create({
      name: 'Test',
      triggerType: 'manual',
      triggerConfig: {},
      actions: [{ type: 'custom', config: {} }],
    });

    rule.recordExecution(true);
    expect(rule.executionCount).toBe(1);
    expect(rule.successCount).toBe(1);
    expect(rule.failureCount).toBe(0);
    expect(rule.lastTriggeredAt).not.toBeNull();

    rule.recordExecution(false);
    expect(rule.executionCount).toBe(2);
    expect(rule.successCount).toBe(1);
    expect(rule.failureCount).toBe(1);
  });

  it('activate/deactivate toggles isActive', () => {
    const rule = AutomationRule.create({
      name: 'Test',
      triggerType: 'manual',
      triggerConfig: {},
      actions: [{ type: 'custom', config: {} }],
    });

    rule.deactivate();
    expect(rule.isActive).toBe(false);
    rule.activate();
    expect(rule.isActive).toBe(true);
  });

  it('matchesTrigger checks triggerType and eventName', () => {
    const rule = AutomationRule.create({
      name: 'Test',
      triggerType: 'event',
      triggerConfig: { eventName: 'order.created' },
      actions: [{ type: 'custom', config: {} }],
    });

    expect(rule.matchesTrigger('event', { type: 'order.created' })).toBe(true);
    expect(rule.matchesTrigger('event', { type: 'order.cancelled' })).toBe(false);
    expect(rule.matchesTrigger('manual')).toBe(false);
  });

  it('matchesTrigger for non-event types ignores eventName', () => {
    const rule = AutomationRule.create({
      name: 'Scheduled',
      triggerType: 'schedule',
      triggerConfig: { cronExpression: '0 * * * *' },
      actions: [{ type: 'custom', config: {} }],
    });

    expect(rule.matchesTrigger('schedule')).toBe(true);
    expect(rule.matchesTrigger('event', { type: 'order.created' })).toBe(false);
  });

  it('toJSON returns all props', () => {
    const rule = AutomationRule.create({
      name: 'Test',
      triggerType: 'manual',
      triggerConfig: {},
      actions: [{ type: 'custom', config: { foo: 'bar' } }],
    });

    const json = rule.toJSON();
    expect(json.name).toBe('Test');
    expect(json.triggerType).toBe('manual');
    expect(json.actions).toHaveLength(1);
  });

  it('reconstitute restores from props', () => {
    const props = {
      automationRuleId: 'test-id',
      name: 'Restored',
      description: null,
      triggerType: 'event' as const,
      triggerConfig: { eventName: 'test.event' },
      conditions: [],
      conditionMatchMode: 'all' as const,
      actions: [{ type: 'custom' as const, config: {} }],
      actionExecutionMode: 'sequential' as const,
      isActive: true,
      priority: 5,
      executionCount: 10,
      successCount: 8,
      failureCount: 2,
      lastTriggeredAt: null,
      lastExecutedAt: null,
      organizationId: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const rule = AutomationRule.reconstitute(props);
    expect(rule.automationRuleId).toBe('test-id');
    expect(rule.name).toBe('Restored');
    expect(rule.executionCount).toBe(10);
    expect(rule.successCount).toBe(8);
  });
});

describe('ConditionEvaluator', () => {
  const context = {
    event: { type: 'order.completed', data: { orderId: 'o1', totalAmount: 500 } },
    customer: { customerId: 'c1', tier: 'loyal', lifetimeValue: 5000, totalOrders: 20, tags: ['vip', 'newsletter'] },
    order: { totalAmount: 500, itemCount: 3, status: 'completed' },
  };

  it('evaluates eq condition', () => {
    expect(evaluateCondition({ field: 'customer.tier', operator: 'eq', value: 'loyal' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.tier', operator: 'eq', value: 'champion' }, context)).toBe(false);
  });

  it('evaluates neq condition', () => {
    expect(evaluateCondition({ field: 'customer.tier', operator: 'neq', value: 'lost' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.tier', operator: 'neq', value: 'loyal' }, context)).toBe(false);
  });

  it('evaluates gt/gte conditions', () => {
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'gt', value: 1000 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'gt', value: 5000 }, context)).toBe(false);
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'gte', value: 5000 }, context)).toBe(true);
  });

  it('evaluates lt/lte conditions', () => {
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'lt', value: 10000 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'lt', value: 5000 }, context)).toBe(false);
    expect(evaluateCondition({ field: 'customer.lifetimeValue', operator: 'lte', value: 5000 }, context)).toBe(true);
  });

  it('evaluates in/notIn conditions', () => {
    expect(evaluateCondition({ field: 'customer.tier', operator: 'in', values: ['loyal', 'champion'] }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.tier', operator: 'in', values: ['lost', 'new'] }, context)).toBe(false);
    expect(evaluateCondition({ field: 'customer.tier', operator: 'notIn', values: ['lost', 'new'] }, context)).toBe(true);
  });

  it('evaluates contains/notContains conditions', () => {
    expect(evaluateCondition({ field: 'customer.tags', operator: 'contains', value: 'vip' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.tags', operator: 'contains', value: 'wholesale' }, context)).toBe(false);
    expect(evaluateCondition({ field: 'customer.tags', operator: 'notContains', value: 'wholesale' }, context)).toBe(true);
  });

  it('evaluates startsWith/endsWith conditions', () => {
    expect(evaluateCondition({ field: 'event.type', operator: 'startsWith', value: 'order' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'event.type', operator: 'endsWith', value: 'completed' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'event.type', operator: 'startsWith', value: 'payment' }, context)).toBe(false);
  });

  it('evaluates isNull/isNotNull conditions', () => {
    expect(evaluateCondition({ field: 'customer.tier', operator: 'isNotNull' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'customer.tier', operator: 'isNull' }, context)).toBe(false);
  });

  it('evaluates regex condition', () => {
    expect(evaluateCondition({ field: 'event.type', operator: 'regex', value: '^order\\.' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'event.type', operator: 'regex', value: '^payment\\.' }, context)).toBe(false);
  });

  it('evaluates dataPath condition', () => {
    expect(evaluateCondition({ field: 'custom', operator: 'eq', value: 500, dataPath: 'order.totalAmount' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'custom', operator: 'eq', value: 'o1', dataPath: 'event.data.orderId' }, context)).toBe(true);
  });

  it('evaluateConditions with matchMode all', () => {
    const conditions = [
      { field: 'customer.tier' as const, operator: 'eq' as const, value: 'loyal' },
      { field: 'customer.lifetimeValue' as const, operator: 'gt' as const, value: 1000 },
    ];
    expect(evaluateConditions(conditions, 'all', context)).toBe(true);

    const failingConditions = [
      { field: 'customer.tier' as const, operator: 'eq' as const, value: 'loyal' },
      { field: 'customer.lifetimeValue' as const, operator: 'gt' as const, value: 10000 },
    ];
    expect(evaluateConditions(failingConditions, 'all', context)).toBe(false);
  });

  it('evaluateConditions with matchMode any', () => {
    const conditions = [
      { field: 'customer.tier' as const, operator: 'eq' as const, value: 'lost' },
      { field: 'customer.lifetimeValue' as const, operator: 'gt' as const, value: 1000 },
    ];
    expect(evaluateConditions(conditions, 'any', context)).toBe(true);
  });

  it('evaluateConditions returns true for empty conditions', () => {
    expect(evaluateConditions([], 'all', context)).toBe(true);
  });
});
