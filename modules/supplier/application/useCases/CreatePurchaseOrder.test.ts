import { createPoSupplierRepository, createPurchaseOrderCreateRepository, emitMock } from '../../tests/testUtils';
import { CreatePurchaseOrderUseCase } from './CreatePurchaseOrder';
import { SupplierNotFoundError, SupplierNotActiveError, SupplierValidationError } from '../../domain/errors/SupplierErrors';

describe('CreatePurchaseOrderUseCase', () => {
  it('should create the purchase order when the supplier is active and approved', async () => {
    const supplierRepository = createPoSupplierRepository({ status: 'approved', isActive: true });
    const purchaseOrderRepository = createPurchaseOrderCreateRepository();

    const result = await new CreatePurchaseOrderUseCase(supplierRepository, purchaseOrderRepository).execute({
      supplierId: 's1',
      items: [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 10, unitCostCents: 10 }],
    });

    expect(result.purchaseOrderId).toMatch(/^po_/);
    expect(result.totalAmountCents).toBe(100);
    expect(result.status).toBe('draft');
    expect(purchaseOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 's1', totalAmountCents: 100, status: 'draft' }),
    );
  });

  it('should emit purchase_order.created when the order is created', async () => {
    await new CreatePurchaseOrderUseCase(
      createPoSupplierRepository(),
      createPurchaseOrderCreateRepository(),
    ).execute({
      supplierId: 's1',
      items: [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 10, unitCostCents: 10 }],
    });

    expect(emitMock).toHaveBeenCalledWith(
      'purchase_order.created',
      expect.objectContaining({ supplierId: 's1', totalAmountCents: 100 }),
    );
  });

  it('should throw SupplierNotFoundError when the supplier does not exist', async () => {
    const purchaseOrderRepository = createPurchaseOrderCreateRepository();

    await expect(
      new CreatePurchaseOrderUseCase(createPoSupplierRepository(null), purchaseOrderRepository).execute({
        supplierId: 'missing',
        items: [],
      }),
    ).rejects.toThrow(SupplierNotFoundError);
    expect(purchaseOrderRepository.create).not.toHaveBeenCalled();
  });

  it('should throw SupplierNotActiveError when the supplier is not approved and active', async () => {
    const purchaseOrderRepository = createPurchaseOrderCreateRepository();

    await expect(
      new CreatePurchaseOrderUseCase(
        createPoSupplierRepository({ status: 'pending', isActive: false }),
        purchaseOrderRepository,
      ).execute({ supplierId: 's1', items: [] }),
    ).rejects.toThrow(SupplierNotActiveError);
    expect(purchaseOrderRepository.create).not.toHaveBeenCalled();
  });

  it('should throw SupplierValidationError when the order total is below the supplier minimum', async () => {
    const purchaseOrderRepository = createPurchaseOrderCreateRepository();

    await expect(
      new CreatePurchaseOrderUseCase(
        createPoSupplierRepository({ status: 'approved', isActive: true, minimumOrderValue: 50 }),
        purchaseOrderRepository,
      ).execute({
        supplierId: 's1',
        items: [{ productId: 'p1', sku: 'SKU1', name: 'Widget', quantity: 1, unitCostCents: 10 }],
      }),
    ).rejects.toThrow(SupplierValidationError);
    expect(purchaseOrderRepository.create).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
