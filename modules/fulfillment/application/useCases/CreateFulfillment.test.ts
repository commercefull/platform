import '../../tests/testUtils';
import { CreateFulfillmentUseCase } from './CreateFulfillment';
import {
  createFulfillmentRepository,
  withTransactionMock,
  emitFulfillmentCreatedMock,
} from '../../tests/testUtils';

describe('CreateFulfillmentUseCase', () => {
  const fulfillmentRepository = createFulfillmentRepository();
  const useCase = new CreateFulfillmentUseCase(fulfillmentRepository);

  function createInput() {
    return {
      orderId: 'ord-1',
      orderNumber: 'ORD-001',
      sourceType: 'warehouse' as const,
      sourceId: 'wh-1',
      shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
      shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      items: [
        { orderItemId: 'oi-1', productId: 'prod-1', sku: 'SKU-1', name: 'Widget', quantityOrdered: 5 },
        { orderItemId: 'oi-2', productId: 'prod-2', sku: 'SKU-2', name: 'Gadget', quantityOrdered: 3 },
      ],
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();

    fulfillmentRepository.save.mockImplementation(async (f) => f);
    fulfillmentRepository.saveItems.mockImplementation(async (items) => items);
  });

  it('should create the fulfillment with items inside a transaction', async () => {
    const result = await useCase.execute(createInput());

    expect(result.fulfillment.orderId).toBe('ord-1');
    expect(result.items).toHaveLength(2);
    expect(withTransactionMock).toHaveBeenCalled();
    expect(fulfillmentRepository.save).toHaveBeenCalled();
    expect(fulfillmentRepository.saveItems).toHaveBeenCalled();
  });

  it('should emit fulfillment created with the order id', async () => {
    await useCase.execute(createInput());

    expect(emitFulfillmentCreatedMock).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'ord-1' }));
  });

  it('should assign each item the created fulfillment id', async () => {
    const result = await useCase.execute(createInput());

    for (const item of result.items) {
      expect(item.fulfillmentId).toBe(result.fulfillment.fulfillmentId);
    }
  });
});
