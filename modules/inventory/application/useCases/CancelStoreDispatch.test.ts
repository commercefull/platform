jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CancelStoreDispatchUseCase } from './CancelStoreDispatch';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CancelStoreDispatchUseCase', () => {
  let useCase: CancelStoreDispatchUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({
        dispatchId: 'd1', cancel: jest.fn(), toJSON: () => ({ dispatchId: 'd1', status: 'cancelled' }),
      }),
      save: jest.fn().mockImplementation(async (d: unknown) => d),
    };
    useCase = new CancelStoreDispatchUseCase(mockRepo as never);
  });

  it('should cancel dispatch (happy path)', async () => {
    const result = await useCase.execute('d1', 'Not needed');

    expect(result.dispatchId).toBe('d1');
    expect(eventBus.emit).toHaveBeenCalledWith('inventory.dispatch.cancelled', expect.objectContaining({ dispatchId: 'd1', reason: 'Not needed' }));
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(StoreDispatchNotFoundError);
  });
});
