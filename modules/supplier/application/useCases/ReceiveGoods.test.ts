import {
  createPurchaseOrderRepository,
  createReceivingRepository,
  createInventoryRepository,
  emitMock,
} from '../../tests/testUtils';
import { ReceiveGoodsUseCase } from './ReceiveGoods';
import { PurchaseOrderNotFoundError, SupplierValidationError } from '../../domain/errors/SupplierErrors';

const receiveInput = (overrides = {}) => ({
  purchaseOrderId: 'po1',
  receivedItems: [{ productId: 'p1', quantityReceived: 10 }],
  receivedBy: 'user1',
  warehouseId: 'w1',
  ...overrides,
});

describe('ReceiveGoodsUseCase', () => {
  it('should mark the order received when all quantities are delivered', async () => {
    const purchaseOrderRepository = createPurchaseOrderRepository();
    const receivingRepository = createReceivingRepository();
    const inventoryRepository = createInventoryRepository();

    const result = await new ReceiveGoodsUseCase(
      purchaseOrderRepository,
      receivingRepository,
      inventoryRepository,
    ).execute(receiveInput());

    expect(result.status).toBe('complete');
    expect(result.itemsReceived).toBe(10);
    expect(inventoryRepository.adjustStock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', locationId: 'w1', adjustment: 10, reason: 'purchase_order_receipt' }),
    );
    expect(purchaseOrderRepository.update).toHaveBeenCalledWith(
      'po1',
      expect.objectContaining({ status: 'received' }),
    );
  });

  it('should emit receiving.completed when goods are received', async () => {
    await new ReceiveGoodsUseCase(
      createPurchaseOrderRepository(),
      createReceivingRepository(),
      createInventoryRepository(),
    ).execute(receiveInput());

    expect(emitMock).toHaveBeenCalledWith(
      'receiving.completed',
      expect.objectContaining({ purchaseOrderId: 'po1', itemsReceived: 10 }),
    );
  });

  it('should mark the order partially received when fewer quantities arrive', async () => {
    const purchaseOrderRepository = createPurchaseOrderRepository();

    const result = await new ReceiveGoodsUseCase(
      purchaseOrderRepository,
      createReceivingRepository(),
      createInventoryRepository(),
    ).execute(receiveInput({ receivedItems: [{ productId: 'p1', quantityReceived: 5 }] }));

    expect(result.status).toBe('partial');
    expect(purchaseOrderRepository.update).toHaveBeenCalledWith(
      'po1',
      expect.objectContaining({ status: 'partial_received' }),
    );
  });

  it('should skip the stock adjustment when all received units are damaged', async () => {
    const inventoryRepository = createInventoryRepository();

    const result = await new ReceiveGoodsUseCase(
      createPurchaseOrderRepository(),
      createReceivingRepository(),
      inventoryRepository,
    ).execute(receiveInput({ receivedItems: [{ productId: 'p1', quantityReceived: 5, quantityDamaged: 5 }] }));

    expect(result.itemsDamaged).toBe(5);
    expect(inventoryRepository.adjustStock).not.toHaveBeenCalled();
  });

  it('should throw PurchaseOrderNotFoundError when the order does not exist', async () => {
    const receivingRepository = createReceivingRepository();
    const inventoryRepository = createInventoryRepository();

    await expect(
      new ReceiveGoodsUseCase(
        createPurchaseOrderRepository(null),
        receivingRepository,
        inventoryRepository,
      ).execute(receiveInput({ purchaseOrderId: 'nonexistent' })),
    ).rejects.toThrow(PurchaseOrderNotFoundError);
    expect(receivingRepository.create).not.toHaveBeenCalled();
    expect(inventoryRepository.adjustStock).not.toHaveBeenCalled();
  });

  it('should throw SupplierValidationError when the order status does not allow receiving', async () => {
    const receivingRepository = createReceivingRepository();

    await expect(
      new ReceiveGoodsUseCase(
        createPurchaseOrderRepository({ status: 'draft', items: [] }),
        receivingRepository,
        createInventoryRepository(),
      ).execute(receiveInput()),
    ).rejects.toThrow(SupplierValidationError);
    expect(receivingRepository.create).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
