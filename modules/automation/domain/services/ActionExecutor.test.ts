/**
 * Unit Tests for ActionExecutor (domain service)
 *
 * Pure dispatch + handler mapping — effects go through a stubbed
 * `AutomationActionEffects` port, so no I/O is exercised.
 */

import type { ActionType, RuleAction } from '../entities/AutomationRule';
import {
  executeActions,
  createActionHandlers,
  type ActionContext,
  type ActionHandler,
  type AutomationActionEffects,
} from './ActionExecutor';

const context: ActionContext = {
  event: { type: 'order.created', data: { orderId: 'o1' }, correlationId: 'corr-1' },
  customer: { customerId: 'cust-1' },
  ruleId: 'rule-1',
  executionLogId: 'log-1',
};

function createEffects(): jest.Mocked<AutomationActionEffects> {
  return {
    emitEvent: jest.fn().mockResolvedValue(undefined),
    scheduleNotification: jest.fn().mockResolvedValue(undefined),
    addCustomerTag: jest.fn().mockResolvedValue(undefined),
    removeCustomerTag: jest.fn().mockResolvedValue(undefined),
  };
}

const okHandler: ActionHandler = async action => ({ actionType: action.type, success: true });
const failHandler: ActionHandler = async action => ({ actionType: action.type, success: false, error: 'boom' });

describe('executeActions', () => {
  const actions: RuleAction[] = [
    { type: 'custom', config: { n: 1 } },
    { type: 'custom', config: { n: 2 } },
  ];

  it('should run all actions sequentially and collect results', async () => {
    const handlers = new Map<ActionType, ActionHandler>([['custom', okHandler]]);
    const results = await executeActions(actions, 'sequential', context, handlers);
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
    expect(results[0].durationMs).toBeDefined();
  });

  it('should stop sequential execution on the first failure', async () => {
    const calls: number[] = [];
    const handler: ActionHandler = async action => {
      calls.push(action.config.n as number);
      return { actionType: action.type, success: false, error: 'boom' };
    };
    const handlers = new Map<ActionType, ActionHandler>([['custom', handler]]);
    const results = await executeActions(actions, 'sequential', context, handlers);
    expect(results).toHaveLength(1);
    expect(calls).toEqual([1]);
  });

  it('should run all actions in parallel mode even when one fails', async () => {
    const handlers = new Map<ActionType, ActionHandler>([['custom', failHandler]]);
    const results = await executeActions(actions, 'parallel', context, handlers);
    expect(results).toHaveLength(2);
    expect(results.every(r => !r.success)).toBe(true);
  });

  it('should fail an action with no registered handler', async () => {
    const results = await executeActions([{ type: 'webhook', config: {} }], 'sequential', context, new Map());
    expect(results[0]).toMatchObject({ success: false, actionType: 'webhook' });
    expect(results[0].error).toContain('No handler registered');
  });

  it('should capture handler errors as failed results', async () => {
    const throwing: ActionHandler = async () => {
      throw new Error('handler exploded');
    };
    const handlers = new Map<ActionType, ActionHandler>([['custom', throwing]]);
    const results = await executeActions([{ type: 'custom', config: {} }], 'sequential', context, handlers);
    expect(results[0]).toMatchObject({ success: false, error: 'handler exploded' });
  });
});

describe('createActionHandlers', () => {
  it('should emit events through the effects port', async () => {
    const effects = createEffects();
    const handlers = createActionHandlers(effects);

    const result = await handlers.get('emit_event')!(
      { type: 'emit_event', config: { eventName: 'order.flagged' } },
      context,
    );

    expect(result.success).toBe(true);
    expect(effects.emitEvent).toHaveBeenCalledWith('order.flagged', { orderId: 'o1' }, 'corr-1');
  });

  it('should schedule notifications through the effects port', async () => {
    const effects = createEffects();
    const handlers = createActionHandlers(effects);

    await handlers.get('send_notification')!(
      { type: 'send_notification', config: { title: 'Hi', message: 'Hello' } },
      context,
    );

    expect(effects.scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'cust-1', title: 'Hi', message: 'Hello', channels: ['in_app'] }),
    );
  });

  it('should add and remove customer tags through the effects port', async () => {
    const effects = createEffects();
    const handlers = createActionHandlers(effects);

    await handlers.get('add_tag')!({ type: 'add_tag', config: { tag: 'vip' } }, context);
    await handlers.get('remove_tag')!({ type: 'remove_tag', config: { tag: 'vip' } }, context);

    expect(effects.addCustomerTag).toHaveBeenCalledWith('cust-1', 'vip');
    expect(effects.removeCustomerTag).toHaveBeenCalledWith('cust-1', 'vip');
  });

  it('should skip tag writes when no customer id is resolvable', async () => {
    const effects = createEffects();
    const handlers = createActionHandlers(effects);

    await handlers.get('add_tag')!({ type: 'add_tag', config: { tag: 'vip' } }, { ...context, customer: undefined });

    expect(effects.addCustomerTag).not.toHaveBeenCalled();
  });

  it('should resolve the custom action as a no-op success', async () => {
    const handlers = createActionHandlers(createEffects());
    const result = await handlers.get('custom')!({ type: 'custom', config: { foo: 1 } }, context);
    expect(result).toMatchObject({ success: true, output: { foo: 1 } });
  });
});
