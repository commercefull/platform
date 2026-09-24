import '../../tests/testUtils';
import { MarkDeliveredUseCase } from './MarkDelivered';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment, emitFulfillmentDeliveredMock } from '../../tests/testUtils';

describe('MarkDeliveredUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new MarkDeliveredUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should mark a shipped fulfillment as delivered and emit the delivered event', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('shipped'));

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.fulfillment.fulfillmentId).toBe('ful-1');
    expect(result.fulfillment.status).toBe('delivered');
    expect(fulfillmentRepository.save).toHaveBeenCalledTimes(1);
    expect(emitFulfillmentDeliveredMock).toHaveBeenCalledWith(expect.objectContaining({ fulfillmentId: 'ful-1' }));
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing' })).rejects.toThrow(FulfillmentNotFoundError);
    expect(emitFulfillmentDeliveredMock).not.toHaveBeenCalled();
  });
});
