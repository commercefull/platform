jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

import { ReceiveGoodsUseCase } from './ReceiveGoods';
import { PurchaseOrderNotFoundError, SupplierValidationError } from '../../domain/errors/SupplierErrors';

const mockPurchaseOrderRepo = {
  findById: jest.fn().mockResolvedValue({ status: 'submitted', items: [{ quantity: 10 }] }),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockReceivingRepo = {
  create: jest.fn().mockResolvedValue(undefined),
};

const mockInventoryRepo = {
  adjustStock: jest.fn().mockResolvedValue(undefined),
};

describe('ReceiveGoodsUseCase', () => {
  let useCase: ReceiveGoodsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ReceiveGoodsUseCase(
      mockPurchaseOrderRepo as never,
      mockReceivingRepo as never,
      mockInventoryRepo as never,
    );
  });

  it('should receive goods (happy path)', async () => {
    const result = await useCase.execute({
      purchaseOrderId: 'po1',
      receivedItems: [{ productId: 'p1', quantityReceived: 10 }],
      receivedBy: 'user1',
      warehouseId: 'w1',
    });

    expect(result.purchaseOrderId).toBe('po1');
    expect(result.itemsReceived).toBe(10);
    expect(result.status).toBe('complete');
    expect(mockInventoryRepo.adjustStock).toHaveBeenCalled();
  });

  it('should handle partial receipt', async () => {
    const result = await useCase.execute({
      purchaseOrderId: 'po1',
      receivedItems: [{ productId: 'p1', quantityReceived: 5 }],
      receivedBy: 'user1',
      warehouseId: 'w1',
    });

    expect(result.status).toBe('partial');
  });

  it('should throw PurchaseOrderNotFoundError when PO not found', async () => {
    mockPurchaseOrderRepo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({
      purchaseOrderId: 'nonexistent',
      receivedItems: [{ productId: 'p1', quantityReceived: 5 }],
      receivedBy: 'user1',
      warehouseId: 'w1',
    })).rejects.toThrow(PurchaseOrderNotFoundError);
  });

  it('should throw SupplierValidationError for invalid PO status', async () => {
    mockPurchaseOrderRepo.findById.mockResolvedValueOnce({ status: 'draft', items: [] });

    await expect(useCase.execute({
      purchaseOrderId: 'po1',
      receivedItems: [{ productId: 'p1', quantityReceived: 5 }],
      receivedBy: 'user1',
      warehouseId: 'w1',
    })).rejects.toThrow(SupplierValidationError);
  });
});
