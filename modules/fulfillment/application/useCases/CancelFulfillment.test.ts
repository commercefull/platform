import '../../tests/testUtils';
import { CancelFulfillmentUseCase, CancelFulfillmentCommand } from './CancelFulfillment';
import { FulfillmentNotFoundError, FulfillmentValidationError } from '../../domain/errors/FulfillmentErrors';
import { createFulfillmentRepository, createFulfillment, emitMock } from '../../tests/testUtils';

describe('CancelFulfillmentUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new CancelFulfillmentUseCase(fulfillmentRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    fulfillmentRepository.save.mockImplementation(async (f) => f);
  });

  it('should cancel a pending fulfillment, persist it and emit fulfillment.cancelled', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('pending'));

    const result = await useCase.execute(new CancelFulfillmentCommand('ful-1', 'Customer request'));

    expect(result.fulfillment.status).toBe('cancelled');
    expect(fulfillmentRepository.save).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledWith(
      'fulfillment.cancelled',
      expect.objectContaining({
        fulfillmentId: 'ful-1',
        orderId: 'ord-1',
        reason: 'Customer request',
      }),
    );
  });

  it('should cancel a fulfillment while picking', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('picking'));

    const result = await useCase.execute(new CancelFulfillmentCommand('ful-1'));

    expect(result.fulfillment.status).toBe('cancelled');
  });

  it('should throw FulfillmentNotFoundError when the fulfillment does not exist', async () => {
    fulfillmentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CancelFulfillmentCommand('ful-x'))).rejects.toThrow(FulfillmentNotFoundError);
    expect(fulfillmentRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw FulfillmentValidationError when cancelling a delivered fulfillment', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('delivered'));

    await expect(useCase.execute(new CancelFulfillmentCommand('ful-1'))).rejects.toThrow(FulfillmentValidationError);
    expect(fulfillmentRepository.save).not.toHaveBeenCalled();
  });

  it('should include the cancellation reason in the emitted event', async () => {
    fulfillmentRepository.findById.mockResolvedValue(createFulfillment('pending'));

    await useCase.execute(new CancelFulfillmentCommand('ful-1', 'Out of stock'));

    expect(emitMock).toHaveBeenCalledWith('fulfillment.cancelled', expect.objectContaining({ reason: 'Out of stock' }));
  });
});
