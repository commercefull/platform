import {
  InventoryItemNotFoundError, InsufficientStockError, InventoryLocationNotFoundError,
  StockAdjustmentFailedError, InvalidStockQuantityError, ReservationNotFoundError,
  TransferNotFoundError, CannotTransferToSameLocationError, StoreDispatchNotFoundError,
  InventoryValidationError, FailedToCreateInventoryError,
} from './InventoryErrors';

describe('InventoryErrors', () => {
  it('InventoryItemNotFoundError', () => { expect(new InventoryItemNotFoundError('i1').statusCode).toBe(404); });
  it('InsufficientStockError', () => { expect(new InsufficientStockError('sku1', 5, 2).statusCode).toBe(400); });
  it('InventoryLocationNotFoundError', () => { expect(new InventoryLocationNotFoundError('l1').statusCode).toBe(404); });
  it('StockAdjustmentFailedError', () => { expect(new StockAdjustmentFailedError('reason').statusCode).toBe(500); });
  it('InvalidStockQuantityError', () => { expect(new InvalidStockQuantityError(-1).statusCode).toBe(400); });
  it('ReservationNotFoundError', () => { expect(new ReservationNotFoundError('r1').statusCode).toBe(404); });
  it('TransferNotFoundError', () => { expect(new TransferNotFoundError('t1').statusCode).toBe(404); });
  it('CannotTransferToSameLocationError', () => { expect(new CannotTransferToSameLocationError().statusCode).toBe(400); });
  it('StoreDispatchNotFoundError', () => { expect(new StoreDispatchNotFoundError('d1').statusCode).toBe(404); });
  it('InventoryValidationError', () => { expect(new InventoryValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateInventoryError', () => { expect(new FailedToCreateInventoryError().statusCode).toBe(500); });
});
