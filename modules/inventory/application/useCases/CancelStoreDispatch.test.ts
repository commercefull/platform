import { lazyMock, createStoreDispatch, emitMock } from '../../tests/testUtils';
import { CancelStoreDispatchUseCase } from './CancelStoreDispatch';
import { StoreDispatchNotFoundError } from '../../domain/errors/InventoryErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CancelStoreDispatchUseCase', () => {
  let useCase: CancelStoreDispatchUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CancelStoreDispatchUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof CancelStoreDispatchUseCase>[0]>();
    mockRepo.findById.mockResolvedValue(createStoreDispatch({ status: 'pending_approval' }));
    mockRepo.save.mockImplementation(async (d) => d);
    useCase = new CancelStoreDispatchUseCase(mockRepo);
  });

  it('should cancel dispatch (happy path)', async () => {
    const result = await useCase.execute('d1', 'Not needed');

    expect(result.dispatchId).toBe('d1');
    expect(emitMock).toHaveBeenCalledWith(
      'inventory.dispatch.cancelled',
      expect.objectContaining({ dispatchId: 'd1', reason: 'Not needed' }),
    );
  });

  it('should throw StoreDispatchNotFoundError when dispatch not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(StoreDispatchNotFoundError);
  });
});
