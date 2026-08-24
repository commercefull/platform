import { ReturnRequest } from './entities/ReturnRequest';
import type { ReturnItemReason, ReturnItemCondition } from './entities/ReturnRequest';
import { StoreCreditLedgerEntry } from './entities/StoreCredit';

describe('ReturnRequest', () => {
  const baseItems = [
    {
      orderItemId: 'item-1',
      quantity: 2,
      returnReason: 'damaged' as ReturnItemReason,
      condition: 'new' as ReturnItemCondition,
      restockItem: true,
      refundAmount: 50,
    },
  ];

  it('create produces a valid return request', () => {
    const ret = ReturnRequest.create({
      orderId: 'o1',
      customerId: 'c1',
      returnType: 'refund',
      returnReason: 'Product damaged',
      items: baseItems,
    });

    expect(ret.orderId).toBe('o1');
    expect(ret.status).toBe('requested');
    expect(ret.returnType).toBe('refund');
    expect(ret.returnNumber).toMatch(/^RET-/);
    expect(ret.items).toHaveLength(1);
    expect(ret.requiresInspection).toBe(true);
    expect(ret.returnShippingPaid).toBe(false);
    expect(ret.returnCarrier).toBe('custom');
    expect(ret.isPending).toBe(true);
  });

  it('create with storeCredit type and custom carrier', () => {
    const ret = ReturnRequest.create({
      orderId: 'o1',
      returnType: 'storeCredit',
      returnCarrier: 'ups',
      returnShippingPaid: true,
      requiresInspection: false,
      items: baseItems,
    });

    expect(ret.returnType).toBe('storeCredit');
    expect(ret.returnCarrier).toBe('ups');
    expect(ret.returnShippingPaid).toBe(true);
    expect(ret.requiresInspection).toBe(false);
  });

  it('approve transitions to approved and sets RMA', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve('RMA-CUSTOM-001');

    expect(ret.status).toBe('approved');
    expect(ret.rmaNumber).toBe('RMA-CUSTOM-001');
    expect(ret.approvedAt).not.toBeNull();
  });

  it('approve auto-generates RMA if not provided', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();

    expect(ret.status).toBe('approved');
    expect(ret.rmaNumber).toMatch(/^RMA-/);
  });

  it('deny transitions to denied', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.deny('Out of warranty');

    expect(ret.status).toBe('denied');
    expect(ret.adminNotes).toContain('Out of warranty');
  });

  it('markInTransit sets tracking info', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();
    ret.markInTransit('TRACK-123', 'https://track.example.com/123');

    expect(ret.status).toBe('inTransit');
    expect(ret.returnTrackingNumber).toBe('TRACK-123');
    expect(ret.returnTrackingUrl).toBe('https://track.example.com/123');
  });

  it('markReceived transitions to received', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();
    ret.markInTransit();
    ret.markReceived();

    expect(ret.status).toBe('received');
    expect(ret.receivedAt).not.toBeNull();
  });

  it('completeInspection sets inspection results', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();
    ret.markInTransit();
    ret.markReceived();
    ret.completeInspection({ item1: true }, { item2: false });

    expect(ret.status).toBe('inspected');
    expect(ret.inspectionPassedItems).toEqual({ item1: true });
    expect(ret.inspectionFailedItems).toEqual({ item2: false });
  });

  it('complete transitions to completed', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();
    ret.markInTransit();
    ret.markReceived();
    ret.complete();

    expect(ret.status).toBe('completed');
    expect(ret.completedAt).not.toBeNull();
    expect(ret.isCompleted).toBe(true);
  });

  it('cancel transitions to cancelled with reason', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.cancel('Customer changed mind');

    expect(ret.status).toBe('cancelled');
    expect(ret.isCancelled).toBe(true);
    expect(ret.adminNotes).toContain('Customer changed mind');
  });

  it('invalid transition throws error', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    expect(() => ret.complete()).toThrow();
    expect(() => ret.markReceived()).toThrow();
  });

  it('cannot transition from denied', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.deny();
    expect(() => ret.approve()).toThrow();
    expect(() => ret.cancel()).toThrow();
  });

  it('cannot transition from completed', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.approve();
    ret.markInTransit();
    ret.markReceived();
    ret.complete();
    expect(() => ret.cancel()).toThrow();
  });

  it('addTracking sets tracking info', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.addTracking('TRK-456', 'https://track.example.com', 'fedex');

    expect(ret.returnTrackingNumber).toBe('TRK-456');
    expect(ret.returnTrackingUrl).toBe('https://track.example.com');
    expect(ret.returnCarrier).toBe('fedex');
  });

  it('linkPaymentRefund sets payment refund ID', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.linkPaymentRefund('pay-refund-1');
    expect(ret.paymentRefundId).toBe('pay-refund-1');
  });

  it('setShippingLabel marks shipping as paid', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    ret.setShippingLabel('label-url', 15.99);

    expect(ret.returnShippingPaid).toBe(true);
    expect(ret.returnShippingLabel).toBe('label-url');
    expect(ret.returnShippingAmount).toBe(15.99);
  });

  it('totalRefundAmount sums item refund amounts', () => {
    const ret = ReturnRequest.create({
      orderId: 'o1',
      returnType: 'refund',
      items: [
        { orderItemId: 'i1', quantity: 1, returnReason: 'damaged', condition: 'new', restockItem: false, refundAmount: 50 },
        { orderItemId: 'i2', quantity: 2, returnReason: 'wrongProduct', condition: 'likeNew', restockItem: true, refundAmount: 100 },
      ],
    });

    expect(ret.totalRefundAmount).toBe(150);
  });

  it('reconstitute restores from props', () => {
    const props = {
      orderReturnId: 'r1', orderId: 'o1', returnNumber: 'RET-001',
      customerId: 'c1', status: 'approved' as const, returnType: 'refund' as const,
      requestedAt: new Date(), approvedAt: new Date(),
      returnShippingPaid: false, returnCarrier: 'ups' as const,
      requiresInspection: true, items: [],
      createdAt: new Date(), updatedAt: new Date(),
    };

    const ret = ReturnRequest.reconstitute(props);
    expect(ret.orderReturnId).toBe('r1');
    expect(ret.status).toBe('approved');
    expect(ret.returnCarrier).toBe('ups');
  });

  it('canTransitionTo validates allowed transitions', () => {
    const ret = ReturnRequest.create({ orderId: 'o1', returnType: 'refund', items: baseItems });
    expect(ret.canTransitionTo('approved')).toBe(true);
    expect(ret.canTransitionTo('denied')).toBe(true);
    expect(ret.canTransitionTo('cancelled')).toBe(true);
    expect(ret.canTransitionTo('completed')).toBe(false);
    expect(ret.canTransitionTo('received')).toBe(false);
  });
});

describe('StoreCreditLedgerEntry', () => {
  it('create produces a valid credit entry', () => {
    const entry = StoreCreditLedgerEntry.create({
      customerId: 'c1',
      entryType: 'credit',
      referenceType: 'return',
      referenceId: 'r1',
      amount: 100,
      balanceAfter: 100,
      reason: 'Store credit from return',
    });

    expect(entry.customerId).toBe('c1');
    expect(entry.entryType).toBe('credit');
    expect(entry.amount).toBe(100);
    expect(entry.balanceAfter).toBe(100);
    expect(entry.currency).toBe('USD');
    expect(entry.isCredit).toBe(true);
    expect(entry.isDebit).toBe(false);
  });

  it('create with debit type', () => {
    const entry = StoreCreditLedgerEntry.create({
      customerId: 'c1',
      entryType: 'debit',
      amount: 50,
      balanceAfter: 50,
    });

    expect(entry.entryType).toBe('debit');
    expect(entry.isDebit).toBe(true);
    expect(entry.isCredit).toBe(false);
  });

  it('isExpired checks expiresAt', () => {
    const expired = StoreCreditLedgerEntry.create({
      customerId: 'c1',
      entryType: 'credit',
      amount: 100,
      balanceAfter: 100,
      expiresAt: new Date(Date.now() - 86400000),
    });
    expect(expired.isExpired).toBe(true);

    const notExpired = StoreCreditLedgerEntry.create({
      customerId: 'c1',
      entryType: 'credit',
      amount: 100,
      balanceAfter: 100,
      expiresAt: new Date(Date.now() + 86400000),
    });
    expect(notExpired.isExpired).toBe(false);
  });

  it('reconstitute restores from props', () => {
    const props = {
      storeCreditLedgerId: 'scl1', customerId: 'c1', entryType: 'credit' as const,
      referenceType: 'return', referenceId: 'r1', amount: 200, balanceAfter: 200,
      currency: 'EUR', reason: 'Test', notes: undefined, createdBy: 'admin',
      expiresAt: undefined, createdAt: new Date(), updatedAt: new Date(),
    };

    const entry = StoreCreditLedgerEntry.reconstitute(props);
    expect(entry.storeCreditLedgerId).toBe('scl1');
    expect(entry.currency).toBe('EUR');
    expect(entry.amount).toBe(200);
  });
});
