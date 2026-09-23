import '../../tests/testUtils';
import { InitiateReturnUseCase } from './InitiateReturn';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment } from '../../tests/testUtils';

describe('InitiateReturnUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new InitiateReturnUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should mark a delivered fulfillment as returned', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('delivered'));

    const result = await useCase.execute({ fulfillmentId: 'ful-1', reason: 'Damaged' });

    expect(result.fulfillmentId).toBe('ful-1');
    const saved = fulfillmentRepository.save.mock.calls[0][0];
    expect(saved.status).toBe('returned');
  });

  it('should persist without re-transitioning when the fulfillment is already returned', async () => {
    const fulfillment = createFulfillment('returned');
    fulfillmentRepository.findById.mockResolvedValue(fulfillment);

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.fulfillmentId).toBe('ful-1');
    expect(fulfillmentRepository.save).toHaveBeenCalledTimes(1);
    expect(fulfillment.status).toBe('returned');
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing' })).rejects.toThrow(FulfillmentNotFoundError);
  });
});
