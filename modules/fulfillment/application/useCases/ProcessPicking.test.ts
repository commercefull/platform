jest.mock('../../domain/events/FulfillmentEvents', () => ({
  emitFulfillmentPickingStarted: jest.fn(),
}));

import { ProcessPickingUseCase} from './ProcessPicking';
import { FulfillmentNotFoundError, FulfillmentItemNotFoundError, FulfillmentValidationError } from '../../domain/errors/FulfillmentErrors';
import { emitFulfillmentPickingStarted } from '../../domain/events/FulfillmentEvents';

describe('ProcessPickingUseCase', () => {
  let useCase: ProcessPickingUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockFulfillment: Record<string, unknown>;
  let mockItems: Record<string, unknown>[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFulfillment = {
      fulfillmentId: 'f1', orderId: 'o1', status: 'pending',
      startPicking: jest.fn(), completePicking: jest.fn(),
    };
    mockItems = [
      { fulfillmentItemId: 'i1', isPicked: false, pick: jest.fn() },
    ];
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockFulfillment),
      findItemsByFulfillmentId: jest.fn().mockResolvedValue(mockItems),
      save: jest.fn().mockImplementation(async (f: unknown) => f),
      saveItem: jest.fn().mockImplementation(async (i: unknown) => i),
    };
    useCase = new ProcessPickingUseCase(mockRepo as never);
  });

  it('should process picking (happy path)', async () => {
    const result = await useCase.execute({
      fulfillmentId: 'f1', items: [{ fulfillmentItemId: 'i1', quantityPicked: 5 }],
    });

    expect(result.fulfillment.fulfillmentId).toBe('f1');
    expect(mockFulfillment.startPicking).toHaveBeenCalled();
    expect(emitFulfillmentPickingStarted).toHaveBeenCalled();
  });

  it('should throw FulfillmentNotFoundError when fulfillment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ fulfillmentId: 'missing', items: [] })).rejects.toThrow(FulfillmentNotFoundError);
  });

  it('should throw FulfillmentValidationError when no items found', async () => {
    mockRepo.findItemsByFulfillmentId.mockResolvedValue([]);

    await expect(useCase.execute({ fulfillmentId: 'f1', items: [] })).rejects.toThrow(FulfillmentValidationError);
  });

  it('should throw FulfillmentItemNotFoundError when item not found', async () => {
    await expect(useCase.execute({
      fulfillmentId: 'f1', items: [{ fulfillmentItemId: 'missing', quantityPicked: 1 }],
    })).rejects.toThrow(FulfillmentItemNotFoundError);
  });
});
