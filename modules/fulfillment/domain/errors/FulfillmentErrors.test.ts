import {
  FulfillmentNotFoundError, FulfillmentItemNotFoundError, InvalidFulfillmentStatusError,
  FulfillmentCannotBeCancelledError, FulfillmentAlreadyShippedError, FulfillmentPartnerNotFoundError,
  FulfillmentLocationNotFoundError, FailedToCreateFulfillmentError, FailedToCreateFulfillmentItemError,
  FulfillmentValidationError, TrackingNumberRequiredError, FailedToCreateFulfillmentLocationError,
} from './FulfillmentErrors';

describe('FulfillmentErrors', () => {
  it('FulfillmentNotFoundError', () => { expect(new FulfillmentNotFoundError('f1').statusCode).toBe(404); });
  it('FulfillmentItemNotFoundError', () => { expect(new FulfillmentItemNotFoundError('i1').statusCode).toBe(404); });
  it('InvalidFulfillmentStatusError', () => { expect(new InvalidFulfillmentStatusError('bad').statusCode).toBe(400); });
  it('FulfillmentCannotBeCancelledError', () => { expect(new FulfillmentCannotBeCancelledError('shipped').statusCode).toBe(400); });
  it('FulfillmentAlreadyShippedError', () => { expect(new FulfillmentAlreadyShippedError('f1').statusCode).toBe(400); });
  it('FulfillmentPartnerNotFoundError', () => { expect(new FulfillmentPartnerNotFoundError('p1').statusCode).toBe(404); });
  it('FulfillmentLocationNotFoundError', () => { expect(new FulfillmentLocationNotFoundError('l1').statusCode).toBe(404); });
  it('FailedToCreateFulfillmentError', () => { expect(new FailedToCreateFulfillmentError().statusCode).toBe(500); });
  it('FailedToCreateFulfillmentItemError', () => { expect(new FailedToCreateFulfillmentItemError().statusCode).toBe(500); });
  it('FulfillmentValidationError', () => { expect(new FulfillmentValidationError('bad').statusCode).toBe(400); });
  it('TrackingNumberRequiredError', () => { expect(new TrackingNumberRequiredError().statusCode).toBe(400); });
  it('FailedToCreateFulfillmentLocationError', () => { expect(new FailedToCreateFulfillmentLocationError().statusCode).toBe(500); });
});
