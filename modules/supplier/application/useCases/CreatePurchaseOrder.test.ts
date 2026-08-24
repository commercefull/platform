jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreatePurchaseOrderUseCase} from './CreatePurchaseOrder';
import { SupplierNotFoundError, SupplierNotActiveError, SupplierValidationError } from '../../domain/errors/SupplierErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreatePurchaseOrderUseCase', () => {
  let useCase: CreatePurchaseOrderUseCase;
  let mockSupplierRepo: Record<string, jest.Mock>;
  let mockPORepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSupplierRepo = {
      findById: jest.fn().mockResolvedValue({ status: 'approved', isActive: true, minimumOrderValue: 50, leadTimeDays: 7 }),
    };
    mockPORepo = {
      create: jest.fn().mockResolvedValue({
        purchaseOrderId: 'po-1', poNumber: 'PO-12345678', supplierId: 's1', totalAmount: 100, status: 'draft', createdAt: new Date(),
      }),
    };
    useCase = new CreatePurchaseOrderUseCase(mockSupplierRepo as never, mockPORepo as never);
  });

  it('should create purchase order (happy path)', async () => {
    const result = await useCase.execute({
      supplierId: 's1',
      items: [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 10, unitCost: 10 }],
    });

    expect(result.purchaseOrderId).toBe('po-1');
    expect(result.totalAmount).toBe(100);
    expect(eventBus.emit).toHaveBeenCalledWith('purchase_order.created', expect.objectContaining({ supplierId: 's1' }));
  });

  it('should throw SupplierNotFoundError when supplier does not exist', async () => {
    mockSupplierRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ supplierId: 'missing', items: [] })).rejects.toThrow(SupplierNotFoundError);
  });

  it('should throw SupplierNotActiveError when supplier is not approved', async () => {
    mockSupplierRepo.findById.mockResolvedValue({ status: 'pending', isActive: false });

    await expect(useCase.execute({ supplierId: 's1', items: [] })).rejects.toThrow(SupplierNotActiveError);
  });

  it('should throw SupplierValidationError when order total below minimum', async () => {
    await expect(useCase.execute({
      supplierId: 's1',
      items: [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1, unitCost: 10 }],
    })).rejects.toThrow(SupplierValidationError);
  });
});
