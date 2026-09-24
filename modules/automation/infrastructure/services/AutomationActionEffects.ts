/**
 * Automation Action Effects — infrastructure adapter
 *
 * Implements the domain `AutomationActionEffects` port: event emission via
 * the shared event bus, notification delivery via the job scheduler, and
 * customer tag writes via SQL.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import { query } from '../../../../libs/db';
import type {
  AutomationActionEffects,
  NotificationScheduleInput,
} from '../../domain/services/ActionExecutor';

export class AutomationActionEffectsImpl implements AutomationActionEffects {
  async emitEvent(eventName: string, eventData: unknown, correlationId?: string): Promise<void> {
    await eventBus.emit(eventName as never, eventData, correlationId, 'automation');
  }

  async scheduleNotification(input: NotificationScheduleInput): Promise<void> {
    await JobScheduler.scheduleNotification(input);
  }

  async addCustomerTag(customerId: string, tag: string): Promise<void> {
    await query(`UPDATE "customerProfile" SET "tags" = array_prepend($1, "tags") WHERE "customerId" = $2 AND NOT ($1 = ANY("tags"))`, [
      tag,
      customerId,
    ]);
  }

  async removeCustomerTag(customerId: string, tag: string): Promise<void> {
    await query(`UPDATE "customerProfile" SET "tags" = array_remove("tags", $1) WHERE "customerId" = $2`, [tag, customerId]);
  }
}
