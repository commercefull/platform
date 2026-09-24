/**
 * Unit Tests for AutomationActionEffectsImpl
 *
 * Verifies the infrastructure adapter delegates to the shared libs
 * (eventBus, JobScheduler, db) with the right payloads.
 */

jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../../libs/jobs/cronScheduler', () => ({
  JobScheduler: { scheduleNotification: jest.fn().mockResolvedValue(undefined) },
}));

import { query } from '../../../../libs/db';
import { eventBus } from '../../../../libs/events/eventBus';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import { AutomationActionEffectsImpl } from './AutomationActionEffects';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedEmit = eventBus.emit as jest.Mock;
const mockedSchedule = JobScheduler.scheduleNotification as jest.Mock;

describe('AutomationActionEffectsImpl', () => {
  let effects: AutomationActionEffectsImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    effects = new AutomationActionEffectsImpl();
  });

  it('should emit events on the shared bus with the automation source', async () => {
    await effects.emitEvent('order.flagged', { orderId: 'o1' }, 'corr-1');

    expect(mockedEmit).toHaveBeenCalledWith('order.flagged', { orderId: 'o1' }, 'corr-1', 'automation');
  });

  it('should schedule notifications through the job scheduler', async () => {
    const input = { userId: 'u1', type: 'automation', title: 'Hi', message: 'Hello', channels: ['in_app' as const] };
    await effects.scheduleNotification(input);

    expect(mockedSchedule).toHaveBeenCalledWith(input);
  });

  it('should prepend tags without duplicating them', async () => {
    await effects.addCustomerTag('cust-1', 'vip');

    expect(mockedQuery).toHaveBeenCalledWith(expect.stringContaining('array_prepend'), ['vip', 'cust-1']);
    expect(mockedQuery.mock.calls[0][0]).toContain('customerProfile');
  });

  it('should remove tags', async () => {
    await effects.removeCustomerTag('cust-1', 'vip');

    expect(mockedQuery).toHaveBeenCalledWith(expect.stringContaining('array_remove'), ['vip', 'cust-1']);
  });
});
