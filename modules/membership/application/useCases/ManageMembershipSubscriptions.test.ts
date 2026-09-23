import '../../tests/testUtils';
import { ManageMembershipSubscriptionsUseCase } from './ManageMembershipSubscriptions';
import {
  createMembershipSubscriptionsPort,
  createMembershipSubscription,
} from '../../tests/testUtils';

describe('ManageMembershipSubscriptionsUseCase', () => {
  const subscriptionsPort = createMembershipSubscriptionsPort();
  const useCase = new ManageMembershipSubscriptionsUseCase(subscriptionsPort);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a subscription by id', async () => {
    subscriptionsPort.findById.mockResolvedValue(createMembershipSubscription());

    const result = await useCase.findById('sub-1');

    expect(result?.membershipSubscriptionId).toBe('sub-1');
  });

  it('should change the plan with notes forwarded', async () => {
    subscriptionsPort.changePlan.mockResolvedValue(undefined);

    await useCase.changePlan('m1', 'plan-2', 'requested upgrade');

    expect(subscriptionsPort.changePlan).toHaveBeenCalledWith('m1', 'plan-2', 'requested upgrade');
  });

  it('should pause a membership', async () => {
    subscriptionsPort.pause.mockResolvedValue(undefined);

    await useCase.pause('m1');

    expect(subscriptionsPort.pause).toHaveBeenCalledWith('m1');
  });

  it('should cancel a membership', async () => {
    subscriptionsPort.cancel.mockResolvedValue(undefined);

    await useCase.cancel('m1');

    expect(subscriptionsPort.cancel).toHaveBeenCalledWith('m1');
  });
});
