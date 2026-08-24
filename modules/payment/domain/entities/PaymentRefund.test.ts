import { PaymentRefund } from './PaymentRefund';
import { RefundStatus } from '../valueObjects/PaymentStatus';

describe('PaymentRefund', () => {
  it('should create a refund (happy path)', () => {
    const refund = PaymentRefund.create({
      refundId: 'r1', transactionId: 't1', amount: 50, currency: 'usd',
    });
    expect(refund.refundId).toBe('r1');
    expect(refund.amount).toBe(50);
    expect(refund.currency).toBe('USD');
    expect(refund.status).toBe(RefundStatus.PENDING);
    expect(refund.isPending).toBe(true);
  });

  it('should start processing', () => {
    const refund = PaymentRefund.create({ refundId: 'r1', transactionId: 't1', amount: 50, currency: 'USD' });
    refund.startProcessing();
    expect(refund.status).toBe(RefundStatus.PROCESSING);
  });

  it('should complete refund', () => {
    const refund = PaymentRefund.create({ refundId: 'r1', transactionId: 't1', amount: 50, currency: 'USD' });
    refund.complete('ext-1', { ok: true });
    expect(refund.isCompleted).toBe(true);
    expect(refund.externalRefundId).toBe('ext-1');
    expect(refund.processedAt).toBeDefined();
    expect(refund.gatewayResponse).toEqual({ ok: true });
  });

  it('should fail refund', () => {
    const refund = PaymentRefund.create({ refundId: 'r1', transactionId: 't1', amount: 50, currency: 'USD' });
    refund.fail('ERR_001', 'Insufficient funds');
    expect(refund.isFailed).toBe(true);
    expect(refund.errorCode).toBe('ERR_001');
    expect(refund.errorMessage).toBe('Insufficient funds');
  });

  it('should serialize to JSON', () => {
    const refund = PaymentRefund.create({ refundId: 'r1', transactionId: 't1', amount: 50, currency: 'USD', reason: 'Customer request' });
    const json = refund.toJSON();
    expect(json.refundId).toBe('r1');
    expect(json.amount).toBe(50);
    expect(json.reason).toBe('Customer request');
  });
});
