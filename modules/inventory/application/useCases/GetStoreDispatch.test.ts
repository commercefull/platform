import { GetStoreDispatchUseCase } from './GetStoreDispatch';

describe('GetStoreDispatchUseCase', () => {
  let useCase: GetStoreDispatchUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ toJSON: () => ({ dispatchId: 'd1', status: 'pending' }) }),
    };
    useCase = new GetStoreDispatchUseCase(mockRepo as never);
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
