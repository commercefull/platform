import {
  ShippingCarrierNotFoundError, ShippingMethodNotFoundError, ShippingZoneNotFoundError,
  ShippingRateNotFoundError, PackagingTypeNotFoundError, FailedToCalculateRateError,
  NoShippingMethodsAvailableError, ShippingValidationError, ShippingCarrierAlreadyExistsError,
  FailedToCreateShippingEntityError,
} from './ShippingErrors';

describe('ShippingErrors', () => {
  it('ShippingCarrierNotFoundError', () => { expect(new ShippingCarrierNotFoundError('c1').statusCode).toBe(404); });
  it('ShippingMethodNotFoundError', () => { expect(new ShippingMethodNotFoundError('m1').statusCode).toBe(404); });
  it('ShippingZoneNotFoundError', () => { expect(new ShippingZoneNotFoundError('z1').statusCode).toBe(404); });
  it('ShippingRateNotFoundError', () => { expect(new ShippingRateNotFoundError('r1').statusCode).toBe(404); });
  it('PackagingTypeNotFoundError', () => { expect(new PackagingTypeNotFoundError('p1').statusCode).toBe(404); });
  it('FailedToCalculateRateError', () => { expect(new FailedToCalculateRateError('err').statusCode).toBe(500); });
  it('NoShippingMethodsAvailableError', () => { expect(new NoShippingMethodsAvailableError().statusCode).toBe(400); });
  it('ShippingValidationError', () => { expect(new ShippingValidationError('bad').statusCode).toBe(400); });
  it('ShippingCarrierAlreadyExistsError', () => { expect(new ShippingCarrierAlreadyExistsError('code').statusCode).toBe(409); });
  it('FailedToCreateShippingEntityError', () => { expect(new FailedToCreateShippingEntityError('err').statusCode).toBe(500); });
});
