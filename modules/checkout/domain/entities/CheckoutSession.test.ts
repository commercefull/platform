import { CheckoutSession } from './CheckoutSession';
import { Address } from '../valueObjects/Address';
import { Money } from '../../../../libs/money';
import { BadRequestError } from '../../../../libs/errors';
import { InvalidCheckoutStateError } from '../errors/CheckoutErrors';

describe('CheckoutSession', () => {
  it('should create a session (happy path)', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    expect(session.id).toBe('cs1');
    expect(session.status).toBe('active');
    expect(session.isActive).toBe(true);
    expect(session.fulfillmentType).toBe('shipping');
    expect(session.total.amount).toBe(0);
  });

  it('should set shipping address', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    const addr = Address.create({
      firstName: 'John', lastName: 'Doe', addressLine1: '123 St',
      city: 'NYC', postalCode: '10001', country: 'USA',
    });
    session.setShippingAddress(addr);
    expect(session.shippingAddress).toBeDefined();
  });

  it('should set fulfillment type to pickup (clears shipping)', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.setShippingMethod('sm1', 'Standard', Money.create(10, 'USD'));
    session.setFulfillmentType('pickup');
    expect(session.fulfillmentType).toBe('pickup');
    expect(session.shippingMethodId).toBeUndefined();
    expect(session.shippingAmount.amount).toBe(0);
  });

  it('should set shipping method and recalculate total', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.updateAmounts(Money.create(100, 'USD'), Money.create(10, 'USD'));
    session.setShippingMethod('sm1', 'Express', Money.create(15, 'USD'));
    expect(session.total.amount).toBe(125);
  });

  it('should apply coupon and recalculate', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.updateAmounts(Money.create(100, 'USD'), Money.create(10, 'USD'));
    session.applyCoupon('SAVE20', Money.create(20, 'USD'));
    expect(session.couponCode).toBe('SAVE20');
    expect(session.total.amount).toBe(90);
  });

  it('should remove coupon', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.updateAmounts(Money.create(100, 'USD'), Money.create(10, 'USD'));
    session.applyCoupon('SAVE20', Money.create(20, 'USD'));
    session.removeCoupon();
    expect(session.couponCode).toBeUndefined();
    expect(session.total.amount).toBe(110);
  });

  it('should set payment method', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.setPaymentMethod('pm1');
    expect(session.paymentMethodId).toBe('pm1');
  });

  it('should check isReadyForPayment for shipping', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    expect(session.isReadyForPayment).toBe(false);
    session.setPaymentMethod('pm1');
    session.updateAmounts(Money.create(100, 'USD'), Money.create(10, 'USD'));
    session.setShippingMethod('sm1', 'Standard', Money.create(5, 'USD'));
    const addr = Address.create({
      firstName: 'J', lastName: 'D', addressLine1: '1 St',
      city: 'NYC', postalCode: '1', country: 'USA',
    });
    session.setShippingAddress(addr);
    expect(session.isReadyForPayment).toBe(true);
  });

  it('should mark payment authorized', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.markPaymentAuthorized();
    expect(session.paymentStatus).toBe('authorized');
    expect(session.status).toBe('processing');
  });

  it('should mark payment captured', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.markPaymentAuthorized();
    session.markPaymentCaptured();
    expect(session.paymentStatus).toBe('captured');
  });

  it('should complete after payment captured', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.markPaymentAuthorized();
    session.markPaymentCaptured();
    session.complete();
    expect(session.isComplete).toBe(true);
    expect(session.completedAt).toBeDefined();
  });

  it('should throw on complete without payment', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    expect(() => session.complete()).toThrow(InvalidCheckoutStateError);
  });

  it('should mark payment failed', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.markPaymentFailed();
    expect(session.paymentStatus).toBe('failed');
    expect(session.status).toBe('failed');
  });

  it('should abandon', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.abandon();
    expect(session.status).toBe('abandoned');
  });

  it('should throw on modify non-active session', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    session.abandon();
    expect(() => session.setPaymentMethod('pm1')).toThrow(BadRequestError);
  });

  it('should detect only digital items', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1' });
    expect(session.hasOnlyDigitalItems([{ isDigital: true }, { isDigital: true }])).toBe(true);
    expect(session.hasOnlyDigitalItems([{ isDigital: true }, { isDigital: false }])).toBe(false);
    expect(session.hasOnlyDigitalItems([])).toBe(false);
  });

  it('should serialize to JSON', () => {
    const session = CheckoutSession.create({ id: 'cs1', basketId: 'b1', customerId: 'c1' });
    const json = session.toJSON();
    expect(json.id).toBe('cs1');
    expect(json.customerId).toBe('c1');
  });
});
