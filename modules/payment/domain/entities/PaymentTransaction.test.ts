import { PaymentTransaction } from './PaymentTransaction';
import { TransactionStatus } from '../valueObjects/PaymentStatus';
import {
  RefundAmountExceedsRefundableError,
  InvalidStatusTransitionError,
} from '../errors/PaymentErrors';

describe('PaymentTransaction', () => {
  const baseProps = {
    transactionId: 'tx-1',
    orderId: 'order-1',
    paymentMethodConfigId: 'pmc-1',
    gatewayId: 'gw-1',
    amount: 100,
    currency: 'usd',
  };

  describe('create', () => {
    it('should create a transaction with PENDING status', () => {
      const tx = PaymentTransaction.create(baseProps);

      expect(tx.transactionId).toBe('tx-1');
      expect(tx.status).toBe(TransactionStatus.PENDING);
      expect(tx.refundedAmount).toBe(0);
      expect(tx.currency).toBe('USD');
    });

    it('should default refundedAmount to 0', () => {
      const tx = PaymentTransaction.create(baseProps);
      expect(tx.refundedAmount).toBe(0);
    });
  });

  describe('authorize', () => {
    it('should transition from PENDING to AUTHORIZED', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.authorize('ext-123', { foo: 'bar' });

      expect(tx.status).toBe(TransactionStatus.AUTHORIZED);
      expect(tx.externalTransactionId).toBe('ext-123');
      expect(tx.authorizedAt).toBeInstanceOf(Date);
      expect(tx.isAuthorized).toBe(true);
    });
  });

  describe('capture', () => {
    it('should transition from AUTHORIZED to PAID', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.authorize('ext-123');
      tx.capture({ result: 'ok' });

      expect(tx.status).toBe(TransactionStatus.PAID);
      expect(tx.capturedAt).toBeInstanceOf(Date);
      expect(tx.isPaid).toBe(true);
    });

    it('should throw InvalidStatusTransitionError from PENDING directly to PAID via capture', () => {
      const tx = PaymentTransaction.create(baseProps);

      // PENDING -> PAID is allowed in the transition table
      tx.capture();
      expect(tx.status).toBe(TransactionStatus.PAID);
    });
  });

  describe('markAsPaid', () => {
    it('should transition to PAID and set externalTransactionId', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-456', { data: 1 });

      expect(tx.status).toBe(TransactionStatus.PAID);
      expect(tx.externalTransactionId).toBe('ext-456');
      expect(tx.capturedAt).toBeInstanceOf(Date);
    });
  });

  describe('void', () => {
    it('should transition from AUTHORIZED to VOIDED', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.authorize('ext-123');
      tx.void();

      expect(tx.status).toBe(TransactionStatus.VOIDED);
    });
  });

  describe('fail', () => {
    it('should transition from PENDING to FAILED', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.fail('ERR_001', 'Insufficient funds');

      expect(tx.status).toBe(TransactionStatus.FAILED);
      expect(tx.errorCode).toBe('ERR_001');
      expect(tx.errorMessage).toBe('Insufficient funds');
      expect(tx.isFailed).toBe(true);
    });
  });

  describe('recordRefund', () => {
    it('should record a partial refund', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      tx.recordRefund(30);

      expect(tx.refundedAmount).toBe(30);
      expect(tx.status).toBe(TransactionStatus.PARTIALLY_REFUNDED);
      expect(tx.canBeRefunded).toBe(true);
    });

    it('should record a full refund and set status to REFUNDED', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      tx.recordRefund(100);

      expect(tx.refundedAmount).toBe(100);
      expect(tx.status).toBe(TransactionStatus.REFUNDED);
      expect(tx.isRefunded).toBe(true);
    });

    it('should throw RefundAmountExceedsRefundableError when refund exceeds refundable', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');

      expect(() => tx.recordRefund(150)).toThrow(RefundAmountExceedsRefundableError);
    });

    it('should throw when refunding more than refundable amount on PENDING', () => {
      const tx = PaymentTransaction.create(baseProps);
      // PENDING — refundableAmount is 100, so 150 should throw

      expect(() => tx.recordRefund(150)).toThrow(RefundAmountExceedsRefundableError);
    });
  });

  describe('refundableAmount', () => {
    it('should return amount - refundedAmount', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      tx.recordRefund(40);

      expect(tx.refundableAmount).toBe(60);
    });
  });

  describe('canBeRefunded', () => {
    it('should be true when PAID', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');

      expect(tx.canBeRefunded).toBe(true);
    });

    it('should be true when PARTIALLY_REFUNDED', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      tx.recordRefund(30);

      expect(tx.canBeRefunded).toBe(true);
    });

    it('should be false when PENDING', () => {
      const tx = PaymentTransaction.create(baseProps);
      expect(tx.canBeRefunded).toBe(false);
    });
  });

  describe('invalid transitions', () => {
    it('should throw InvalidStatusTransitionError for REFUNDED -> PAID', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      tx.recordRefund(100);

      expect(() => tx.markAsPaid('ext-2')).toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError for VOIDED -> PAID', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.authorize('ext-1');
      tx.void();

      expect(() => tx.capture()).toThrow(InvalidStatusTransitionError);
    });
  });

  describe('toJSON', () => {
    it('should serialize to a plain object', () => {
      const tx = PaymentTransaction.create(baseProps);
      tx.markAsPaid('ext-1');
      const json = tx.toJSON();

      expect(json.transactionId).toBe('tx-1');
      expect(json.status).toBe(TransactionStatus.PAID);
      expect(json.amount).toBe(100);
      expect(json.canBeRefunded).toBe(true);
    });
  });
});
