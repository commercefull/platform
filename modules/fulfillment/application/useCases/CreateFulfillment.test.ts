/**
 * Unit Tests for CreateFulfillment Use Case
 */

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../../domain/events/FulfillmentEvents', () => ({
  __esModule: true,
  emitFulfillmentCreated: jest.fn(),
}));

import { CreateFulfillmentUseCase } from './CreateFulfillment';
import { withTransaction } from '../../../../libs/db';
import { emitFulfillmentCreated } from '../../domain/events/FulfillmentEvents';

describe('CreateFulfillmentUseCase', () => {
  let useCase: CreateFulfillmentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockImplementation(async (f: unknown) => f),
      saveItems: jest.fn().mockImplementation(async (items: unknown) => items),
    };
    useCase = new CreateFulfillmentUseCase(mockRepo as never as ConstructorParameters<typeof CreateFulfillmentUseCase>[0]);
    jest.mocked(withTransaction).mockClear();
    jest.mocked(emitFulfillmentCreated).mockClear();
  });

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

  it('should create fulfillment with items', async () => {
    const result = await useCase.execute(createInput());

    expect(result.fulfillment.orderId).toBe('ord-1');
    expect(result.fulfillment.status).toBe('pending');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].sku).toBe('SKU-1');
    expect(result.items[1].sku).toBe('SKU-2');
  });

  it('should save fulfillment and items in a transaction', async () => {
    await useCase.execute(createInput());

    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.saveItems).toHaveBeenCalledTimes(1);
  });

  it('should emit fulfillment.created event', async () => {
    await useCase.execute(createInput());

    expect(emitFulfillmentCreated).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'ord-1',
      orderNumber: 'ORD-001',
      sourceType: 'warehouse',
    }));
  });

  it('should set quantityFulfilled to 0 for all items', async () => {
    const result = await useCase.execute(createInput());

    expect(result.items[0].quantityFulfilled).toBe(0);
    expect(result.items[1].quantityFulfilled).toBe(0);
  });

  it('should pass optional fields to fulfillment', async () => {
    const result = await useCase.execute({
      ...createInput(),
      organizationId: 'org-1',
      carrierId: 'fedex',
      carrierName: 'FedEx',
      notes: 'Handle with care',
    });

    expect(result.fulfillment.organizationId).toBe('org-1');
    expect(result.fulfillment.carrierId).toBe('fedex');
    expect(result.fulfillment.notes).toBe('Handle with care');
  });
});
