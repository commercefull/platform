import { createReceivingRecordWritePort, createReceivingItemWritePort } from '../../tests/testUtils';
import { CreateReceivingRecordUseCase, CreateReceivingRecordInput } from './CreateReceivingRecord';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

describe('CreateReceivingRecordUseCase', () => {
  const input: CreateReceivingRecordInput = {
    distributionWarehouseId: 'wh-1',
    supplierId: 'sup-1',
    supplierPurchaseOrderId: 'po-1',
    items: [
      { productId: 'p1', sku: 'SKU-1', name: 'Item 1', receivedQuantity: 5 },
      { productId: 'p2', sku: 'SKU-2', name: 'Item 2', receivedQuantity: 3 },
    ],
  };

  it('should create a receiving record with items when input is valid', async () => {
    const recordRepo = createReceivingRecordWritePort();
    const itemRepo = createReceivingItemWritePort();
    const useCase = new CreateReceivingRecordUseCase(recordRepo, itemRepo);

    const result = await useCase.execute(input);

    expect(result.receivingRecord.supplierReceivingRecordId).toBe('rec-new');
    expect(result.items).toHaveLength(2);
    expect(itemRepo.create).toHaveBeenCalledTimes(2);
    expect(itemRepo.create).toHaveBeenCalledWith(expect.objectContaining({ supplierReceivingRecordId: 'rec-new' }));
  });

  it('should throw SupplierValidationError when required fields are missing', async () => {
    const useCase = new CreateReceivingRecordUseCase(createReceivingRecordWritePort(), createReceivingItemWritePort());

    await expect(useCase.execute({ ...input, distributionWarehouseId: '' })).rejects.toThrow(SupplierValidationError);
    await expect(useCase.execute({ ...input, supplierId: '' })).rejects.toThrow(SupplierValidationError);
    await expect(useCase.execute({ ...input, items: [] })).rejects.toThrow(SupplierValidationError);
  });
});
