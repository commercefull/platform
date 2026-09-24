import '../../tests/testUtils';
import { CreateReturnRequestUseCase } from './CreateReturnRequest';
import { InvalidReturnRequestError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { emitMock, lazyMock } from '../../tests/testUtils';

function makeRepo() {
  const repo = lazyMock<ReturnRequestRepository>();
  repo.create.mockImplementation(async r => r);
  repo.update.mockImplementation(async r => r);
  return repo;
}

describe('CreateReturnRequestUseCase', () => {
  let repo: jest.Mocked<ReturnRequestRepository>;
  let useCase: CreateReturnRequestUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = makeRepo();
    useCase = new CreateReturnRequestUseCase(repo);
  });

  it('should create a return request and emit return.created', async () => {
    const result = await useCase.execute({
      orderId: 'o-1', customerId: 'c-1', returnType: 'refund',
      items: [{ orderItemId: 'i-1', quantity: 1, returnReason: 'damaged', condition: 'used' }],
    });

    expect(result.status).toBe('requested');
    expect(emitMock).toHaveBeenCalledWith('return.created', expect.objectContaining({ orderId: 'o-1' }));
  });

  it('should throw InvalidReturnRequestError when no items are provided', async () => {
    await expect(useCase.execute({ orderId: 'o-1', returnType: 'refund', items: [] }))
      .rejects.toThrow(InvalidReturnRequestError);
  });

  it('should throw InvalidReturnRequestError when an item has non-positive quantity', async () => {
    await expect(useCase.execute({
      orderId: 'o-1', returnType: 'refund',
      items: [{ orderItemId: 'i-1', quantity: 0, returnReason: 'damaged', condition: 'used' }],
    })).rejects.toThrow(InvalidReturnRequestError);
  });
});

