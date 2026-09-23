import '../../tests/testUtils';
import { ProcessPickingUseCase } from './ProcessPicking';
import {
  FulfillmentNotFoundError,
  FulfillmentItemNotFoundError,
  FulfillmentValidationError,
} from '../../domain/errors/FulfillmentErrors';
import {
  createFulfillmentRepository,
  createFulfillment,
  createFulfillmentItem,
  emitFulfillmentPickingStartedMock,
} from '../../tests/testUtils';

describe('ProcessPickingUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new ProcessPickingUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
    fulfillmentRepository.saveItem.mockImplementation(async (i) => i);
  });

  it('should pick the items, transition the fulfillment and emit the picking started event', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('pending'));
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([createFulfillmentItem()]);

    const result = await useCase.execute({
      fulfillmentId: 'ful-1',
      items: [{ fulfillmentItemId: 'item-1', quantityPicked: 5 }],
    });

    expect(result.fulfillment.fulfillmentId).toBe('ful-1');
    expect(result.fulfillment.status).toBe('picked');
    expect(emitFulfillmentPickingStartedMock).toHaveBeenCalled();
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing', items: [] })).rejects.toThrow(FulfillmentNotFoundError);
  });

  it('should throw FulfillmentValidationError when the fulfillment has no items', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('pending'));
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([]);

    await expect(useCase.execute({ fulfillmentId: 'ful-1', items: [] })).rejects.toThrow(FulfillmentValidationError);
  });

  it('should throw FulfillmentItemNotFoundError when a requested item is not part of the fulfillment', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('pending'));
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([createFulfillmentItem()]);

    await expect(
      useCase.execute({
        fulfillmentId: 'ful-1',
        items: [{ fulfillmentItemId: 'missing', quantityPicked: 1 }],
      }),
    ).rejects.toThrow(FulfillmentItemNotFoundError);
  });
});
