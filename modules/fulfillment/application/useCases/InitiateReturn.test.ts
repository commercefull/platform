import { InitiateReturnUseCase} from './InitiateReturn';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';

describe('InitiateReturnUseCase', () => {
  let useCase: InitiateReturnUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockFulfillment: Record<string, unknown>;

  beforeEach(() => {
    mockFulfillment = {
      fulfillmentId: 'f1', status: 'delivered', updatedAt: new Date(),
      markReturned: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockFulfillment),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
    };
    useCase = new InitiateReturnUseCase(mockRepo as never);
  });

  it('should initiate return (happy path)', async () => {
    const result = await useCase.execute({ fulfillmentId: 'f1', reason: 'Damaged' });

    expect(result.fulfillmentId).toBe('f1');
    expect(mockFulfillment.markReturned).toHaveBeenCalled();
  });

  it('should be idempotent when already returned', async () => {
    mockFulfillment.status = 'returned';

    const result = await useCase.execute({ fulfillmentId: 'f1' });

    expect(result.fulfillmentId).toBe('f1');
    expect(mockFulfillment.markReturned).not.toHaveBeenCalled();
  });

  it('should throw FulfillmentNotFoundError when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing' })).rejects.toThrow(FulfillmentNotFoundError);
  });
});
