/**
 * Shared test utilities for automation use-case tests.
 */

import { AutomationRule } from '../domain/entities/AutomationRule';
import type { RuleAction, TriggerConfig, TriggerType } from '../domain/entities/AutomationRule';

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

export const RULE_TRIGGER: { triggerType: TriggerType; triggerConfig: TriggerConfig } = {
  triggerType: 'event',
  triggerConfig: { eventName: 'order.created' },
};

export const RULE_ACTION: RuleAction = { type: 'send_notification', config: { channel: 'email' } };

export function createAutomationRule(
  overrides: Partial<Parameters<typeof AutomationRule.create>[0]> = {},
): AutomationRule {
  return AutomationRule.create({
    name: 'Order Alert',
    ...RULE_TRIGGER,
    actions: [RULE_ACTION],
    ...overrides,
  });
}
