import { createSupplierLookup, createPoWritePort } from '../../tests/testUtils';
import { CreateSupplierPurchaseOrderUseCase, CreateSupplierPurchaseOrderInput } from './CreateSupplierPurchaseOrder';
import { SupplierNotFoundError, SupplierValidationError } from '../../domain/errors/SupplierErrors';

describe('CreateSupplierPurchaseOrderUseCase', () => {
  const input: CreateSupplierPurchaseOrderInput = {
    supplierId: 'sup-1',
    distributionWarehouseId: 'wh-1',
    items: [
      { productId: 'p1', sku: 'SKU-1', name: 'Item 1', quantity: 2, unitCostCents: 500 },
      { productId: 'p2', sku: 'SKU-2', name: 'Item 2', quantity: 1, unitCostCents: 300 },
    ],
  };

  it('should create a purchase order with items when input is valid', async () => {
    const supplierLookup = createSupplierLookup();
    const poRepo = createPoWritePort();
    const useCase = new CreateSupplierPurchaseOrderUseCase(supplierLookup, poRepo);

    const result = await useCase.execute(input);

    expect(result.purchaseOrder.supplierPurchaseOrderId).toBe('po-new');
    expect(result.items).toHaveLength(2);
    expect(poRepo.createItem).toHaveBeenCalledTimes(2);
    expect(poRepo.createItem).toHaveBeenCalledWith(expect.objectContaining({ supplierPurchaseOrderId: 'po-new' }));
  });

  it('should default currencyCode to USD when currency is not provided', async () => {
    const poRepo = createPoWritePort();
    const useCase = new CreateSupplierPurchaseOrderUseCase(createSupplierLookup(), poRepo);

    await useCase.execute(input);

    expect(poRepo.create).toHaveBeenCalledWith(expect.objectContaining({ currencyCode: 'USD' }));
  });

  it('should default item totalCents to quantity * unitCostCents', async () => {
    const poRepo = createPoWritePort();
    const useCase = new CreateSupplierPurchaseOrderUseCase(createSupplierLookup(), poRepo);

    await useCase.execute(input);

    expect(poRepo.createItem).toHaveBeenCalledWith(expect.objectContaining({ totalCents: 1000 }));
  });

  it('should throw SupplierNotFoundError when supplier does not exist', async () => {
    const useCase = new CreateSupplierPurchaseOrderUseCase(createSupplierLookup(null), createPoWritePort());

    await expect(useCase.execute(input)).rejects.toThrow(SupplierNotFoundError);
  });

  it('should throw SupplierValidationError when required fields are missing', async () => {
    const useCase = new CreateSupplierPurchaseOrderUseCase(createSupplierLookup(), createPoWritePort());

    await expect(useCase.execute({ ...input, supplierId: '' })).rejects.toThrow(SupplierValidationError);
    await expect(useCase.execute({ ...input, distributionWarehouseId: '' })).rejects.toThrow(SupplierValidationError);
    await expect(useCase.execute({ ...input, items: [] })).rejects.toThrow(SupplierValidationError);
  });
});
