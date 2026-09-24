/**
 * Action Executor — domain service
 *
 * Pure action-dispatch machinery for automation rules: sequential/parallel
 * execution, per-action delay, timing, and error capture. All side effects
 * (event emission, notification scheduling, tag writes) go through the
 * `AutomationActionEffects` port — implemented in
 * `infrastructure/services/AutomationActionEffects` and wired at the
 * composition root.
 */

import type { RuleAction, ActionType } from '../entities/AutomationRule';

export interface ActionExecutionResult {
  actionType: ActionType;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs?: number;
}

export interface ActionContext {
  event?: { type: string; data: unknown; correlationId?: string };
  customer?: Record<string, unknown>;
  order?: Record<string, unknown>;
  product?: Record<string, unknown>;
  organizationId?: string;
  ruleId: string;
  executionLogId: string;
}

export type ActionHandler = (action: RuleAction, context: ActionContext) => Promise<ActionExecutionResult>;

// ============================================================================
// Effects port — outbound side effects, implemented in infrastructure
// ============================================================================

export interface NotificationScheduleInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
}

export interface AutomationActionEffects {
  emitEvent(eventName: string, eventData: unknown, correlationId?: string): Promise<void>;
  scheduleNotification(input: NotificationScheduleInput): Promise<void>;
  addCustomerTag(customerId: string, tag: string): Promise<void>;
  removeCustomerTag(customerId: string, tag: string): Promise<void>;
}

// ============================================================================
// Dispatch
// ============================================================================

async function executeAction(
  action: RuleAction,
  context: ActionContext,
  handlers: ReadonlyMap<ActionType, ActionHandler>,
): Promise<ActionExecutionResult> {
  const handler = handlers.get(action.type);
  if (!handler) {
    return {
      actionType: action.type,
      success: false,
      error: `No handler registered for action type: ${action.type}`,
      durationMs: 0,
    };
  }

  if (action.delayMs && action.delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, action.delayMs));
  }

  const start = Date.now();
  try {
    const result = await handler(action, context);
    result.durationMs = Date.now() - start;
    return result;
  } catch (error) {
    return {
      actionType: action.type,
      success: false,
      error: (error as Error).message,
      durationMs: Date.now() - start,
    };
  }
}

export async function executeActions(
  actions: RuleAction[],
  executionMode: 'sequential' | 'parallel',
  context: ActionContext,
  handlers: ReadonlyMap<ActionType, ActionHandler>,
): Promise<ActionExecutionResult[]> {
  if (executionMode === 'parallel') {
    return Promise.all(actions.map(action => executeAction(action, context, handlers)));
  }

  const results: ActionExecutionResult[] = [];
  for (const action of actions) {
    const result = await executeAction(action, context, handlers);
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

// ============================================================================
// Built-in action handlers — pure mapping of action config → effects port
// ============================================================================

export function createActionHandlers(effects: AutomationActionEffects): Map<ActionType, ActionHandler> {
  const registry = new Map<ActionType, ActionHandler>();

  registry.set('emit_event', async (action, context) => {
    const eventName = action.config.eventName as string;
    const eventData = action.config.eventData ?? context.event?.data;
    if (eventName) {
      await effects.emitEvent(eventName, eventData, context.event?.correlationId);
    }
    return { actionType: 'emit_event' as const, success: true, output: { eventName, eventData } };
  });

  registry.set('send_notification', async (action, context) => {
    await effects.scheduleNotification({
      userId: (action.config.userId as string) || (context.customer?.customerId as string) || '',
      type: (action.config.notificationType as string) || 'automation',
      title: (action.config.title as string) || 'Notification',
      message: (action.config.message as string) || '',
      data: action.config.data as Record<string, unknown> | undefined,
      channels: (action.config.channels as Array<'email' | 'sms' | 'push' | 'in_app'>) || ['in_app'],
    });
    return { actionType: 'send_notification', success: true };
  });

  registry.set('add_tag', async (action, context) => {
    const customerId = (action.config.customerId as string) || (context.customer?.customerId as string);
    const tag = action.config.tag as string;
    if (customerId && tag) {
      await effects.addCustomerTag(customerId, tag);
    }
    return { actionType: 'add_tag', success: true, output: { customerId, tag } };
  });

  registry.set('remove_tag', async (action, context) => {
    const customerId = (action.config.customerId as string) || (context.customer?.customerId as string);
    const tag = action.config.tag as string;
    if (customerId && tag) {
      await effects.removeCustomerTag(customerId, tag);
    }
    return { actionType: 'remove_tag', success: true, output: { customerId, tag } };
  });

  registry.set('custom', async action => {
    return { actionType: 'custom', success: true, output: action.config };
  });

  return registry;
}
