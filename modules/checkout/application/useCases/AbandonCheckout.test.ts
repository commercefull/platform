jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/logger', () => ({
  __esModule: true,
  logger: { warning: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

import { AbandonCheckoutUseCase, AbandonCheckoutCommand } from './AbandonCheckout';
import { NotFoundError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('AbandonCheckoutUseCase', () => {
  let useCase: AbandonCheckoutUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockSession: Record<string, unknown>;
  let mockOrderPort: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSession = { id: 'ck-1', basketId: 'b1', customerId: 'c1', status: 'pending', abandon: jest.fn() };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderPort = { cancelOrder: jest.fn().mockResolvedValue(undefined) };
    useCase = new AbandonCheckoutUseCase(mockRepo as never, mockOrderPort as never);
  });

  it('should abandon checkout (happy path)', async () => {
    const result = await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.abandon).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.abandoned', expect.objectContaining({ checkoutId: 'ck-1' }));
  });

  it('should cancel linked order when status is pending_payment', async () => {
    mockSession.status = 'pending_payment';
    mockSession.orderId = 'o1';

    await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(mockOrderPort.cancelOrder).toHaveBeenCalledWith('o1', 'Checkout abandoned by customer');
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new AbandonCheckoutCommand('missing'))).rejects.toThrow(NotFoundError);
  });
});
