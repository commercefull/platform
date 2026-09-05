 
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { RuleAction, ActionType } from '../entities/AutomationRule';
import { eventBus } from '../../../../libs/events/eventBus';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import { query } from '../../../../libs/db';

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

const actionRegistry = new Map<ActionType, ActionHandler>();

function registerActionHandler(type: ActionType, handler: ActionHandler): void {
  actionRegistry.set(type, handler);
}

function getActionHandler(type: ActionType): ActionHandler | undefined {
  return actionRegistry.get(type);
}

async function executeAction(action: RuleAction, context: ActionContext): Promise<ActionExecutionResult> {
  const handler = actionRegistry.get(action.type);
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
): Promise<ActionExecutionResult[]> {
  if (executionMode === 'parallel') {
    return Promise.all(actions.map(action => executeAction(action, context)));
  }

  const results: ActionExecutionResult[] = [];
  for (const action of actions) {
    const result = await executeAction(action, context);
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

// ── Built-in action handlers ─────────────────────────────────────

registerActionHandler('emit_event', async (action, context) => {
  const eventName = action.config.eventName as string;
  const eventData = action.config.eventData ?? context.event?.data;
  if (eventName) {
    await eventBus.emit(eventName as never, eventData, context.event?.correlationId, 'automation');
  }
  return { actionType: 'emit_event' as const, success: true, output: { eventName, eventData } };
});

registerActionHandler('send_notification', async (action, context) => {
  await JobScheduler.scheduleNotification({
    userId: (action.config.userId as string) || (context.customer?.customerId as string) || '',
    type: (action.config.notificationType as string) || 'automation',
    title: (action.config.title as string) || 'Notification',
    message: (action.config.message as string) || '',
    data: action.config.data as Record<string, unknown> | undefined,
    channels: (action.config.channels as Array<'email' | 'sms' | 'push' | 'in_app'>) || ['in_app'],
  });
  return { actionType: 'send_notification', success: true };
});

registerActionHandler('add_tag', async (action, context) => {
  const customerId = (action.config.customerId as string) || (context.customer?.customerId as string);
  const tag = action.config.tag as string;
  if (customerId && tag) {
    await query(
      `UPDATE "customerProfile" SET "tags" = array_prepend($1, "tags") WHERE "customerId" = $2 AND NOT ($1 = ANY("tags"))`,
      [tag, customerId],
    );
  }
  return { actionType: 'add_tag', success: true, output: { customerId, tag } };
});

registerActionHandler('remove_tag', async (action, context) => {
  const customerId = (action.config.customerId as string) || (context.customer?.customerId as string);
  const tag = action.config.tag as string;
  if (customerId && tag) {
    await query(
      `UPDATE "customerProfile" SET "tags" = array_remove("tags", $1) WHERE "customerId" = $2`,
      [tag, customerId],
    );
  }
  return { actionType: 'remove_tag', success: true, output: { customerId, tag } };
});

registerActionHandler('custom', async (action) => {
  return { actionType: 'custom', success: true, output: action.config };
});
