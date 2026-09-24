import '../../tests/testUtils';
import { GetFulfillmentUseCase } from './GetFulfillment';
import { FulfillmentValidationError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment, createFulfillmentItem } from '../../tests/testUtils';

describe('GetFulfillmentUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new GetFulfillmentUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the fulfillment with its items when found by id', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment());
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([]);

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.fulfillment!.fulfillmentId).toBe('ful-1');
    expect(result.items).toEqual([]);
    expect(fulfillmentRepository.findById).toHaveBeenCalledWith('ful-1');
  });

  it('should look up the fulfillment by tracking number', async () => {
    fulfillmentRepository.findByTrackingNumber.mockResolvedValue(createFulfillment());
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([]);

    const result = await useCase.execute({ trackingNumber: 'TRK-123' });

    expect(result.fulfillment).not.toBeNull();
    expect(fulfillmentRepository.findByTrackingNumber).toHaveBeenCalledWith('TRK-123');
  });

  it('should return null fulfillment when nothing matches', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ fulfillmentId: 'ful-x' });

    expect(result.fulfillment).toBeNull();
    expect(result.items).toEqual([]);
  });

  it('should throw FulfillmentValidationError when neither id nor tracking number is given', async () => {
    await expect(useCase.execute({})).rejects.toThrow(FulfillmentValidationError);
    expect(fulfillmentRepository.findById).not.toHaveBeenCalled();
  });

  it('should return the fulfillment items for a found fulfillment', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment());
    fulfillmentRepository.findItemsByFulfillmentId.mockResolvedValue([createFulfillmentItem()]);

    const result = await useCase.execute({ fulfillmentId: 'ful-1' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].sku).toBe('SKU-1');
  });
});
