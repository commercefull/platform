import {
  WarehouseNotFoundError, WarehouseCodeAlreadyExistsError, WarehouseNotActiveError,
  ZoneNotFoundError, BinNotFoundError, ReceivingRecordNotFoundError, PickPackRecordNotFoundError,
  FailedToCreateWarehouseError, WarehouseValidationError, FailedToCreateWarehouseEntityError,
} from './WarehouseErrors';

describe('WarehouseErrors', () => {
  it('WarehouseNotFoundError', () => { expect(new WarehouseNotFoundError('w1').statusCode).toBe(404); });
  it('WarehouseCodeAlreadyExistsError', () => { expect(new WarehouseCodeAlreadyExistsError('code').statusCode).toBe(409); });
  it('WarehouseNotActiveError', () => { expect(new WarehouseNotActiveError('w1').statusCode).toBe(400); });
  it('ZoneNotFoundError', () => { expect(new ZoneNotFoundError('z1').statusCode).toBe(404); });
  it('BinNotFoundError', () => { expect(new BinNotFoundError('b1').statusCode).toBe(404); });
  it('ReceivingRecordNotFoundError', () => { expect(new ReceivingRecordNotFoundError('r1').statusCode).toBe(404); });
  it('PickPackRecordNotFoundError', () => { expect(new PickPackRecordNotFoundError('r1').statusCode).toBe(404); });
  it('FailedToCreateWarehouseError', () => { expect(new FailedToCreateWarehouseError().statusCode).toBe(500); });
  it('WarehouseValidationError', () => { expect(new WarehouseValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateWarehouseEntityError', () => { expect(new FailedToCreateWarehouseEntityError('err').statusCode).toBe(500); });
});
