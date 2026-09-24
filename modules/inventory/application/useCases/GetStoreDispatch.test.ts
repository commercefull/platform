import { createStoreDispatch, lazyMock } from '../../tests/testUtils';
import { GetStoreDispatchUseCase } from './GetStoreDispatch';

describe('GetStoreDispatchUseCase', () => {
  let useCase: GetStoreDispatchUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetStoreDispatchUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetStoreDispatchUseCase>[0]>();
    mockRepo.findById.mockResolvedValue(createStoreDispatch({ dispatchId: 'd1' }));
    useCase = new GetStoreDispatchUseCase(mockRepo);
  });

  it('should get dispatch by ID (happy path)', async () => {
    const result = await useCase.execute('d1');

    expect(result).not.toBeNull();
    expect(result!.dispatchId).toBe('d1');
  });

  it('should return null when dispatch not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
  });
});
