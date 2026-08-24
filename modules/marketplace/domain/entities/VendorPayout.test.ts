import { VendorPayout } from './VendorPayout';

describe('VendorPayout Entity', () => {
  describe('create', () => {
    it('should create a payout with defaults', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      expect(p.payoutId).toBeDefined();
      expect(p.payoutNumber).toMatch(/^PO-\d{6}-/);
      expect(p.status).toBe('pending');
      expect(p.grossAmount).toBe(0);
      expect(p.netAmount).toBe(0);
    });

    it('should calculate totals from line items', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
        lineItems: [
          { orderId: 'o-1', orderNumber: 'ORD-1', productId: 'p-1', productName: 'Widget', grossRevenue: 100, commissionAmount: 10, netAmount: 90 },
          { orderId: 'o-2', orderNumber: 'ORD-2', productId: 'p-2', productName: 'Gadget', grossRevenue: 200, commissionAmount: 20, netAmount: 180 },
        ],
      });
      expect(p.grossAmount).toBe(300);
      expect(p.commissionAmount).toBe(30);
      expect(p.netAmount).toBe(270);
    });
  });

  describe('line items', () => {
    it('should add line item and recalculate', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      p.addLineItem({ orderId: 'o-1', orderNumber: 'ORD-1', productId: 'p-1', productName: 'W', grossRevenue: 100, commissionAmount: 10, netAmount: 90 });
      expect(p.lineItemCount).toBe(1);
      expect(p.grossAmount).toBe(100);
    });

    it('should not add items to non-pending payout', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      p.startProcessing();
      expect(() => p.addLineItem({ orderId: 'o-1', orderNumber: 'O', productId: 'p', productName: 'N', grossRevenue: 1, commissionAmount: 0, netAmount: 1 }))
        .toThrow('Cannot add line items to payout in status: processing');
    });
  });

  describe('workflow', () => {
    it('should process and complete', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
        lineItems: [{ orderId: 'o-1', orderNumber: 'O', productId: 'p', productName: 'N', grossRevenue: 100, commissionAmount: 10, netAmount: 90 }],
      });
      p.startProcessing();
      expect(p.status).toBe('processing');
      p.complete('txn-123');
      expect(p.status).toBe('completed');
      expect(p.transactionRef).toBe('txn-123');
      expect(p.completedAt).toBeDefined();
    });

    it('should fail and retry', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      p.startProcessing();
      p.fail('Bank rejected');
      expect(p.status).toBe('failed');
      expect(p.failureReason).toBe('Bank rejected');
      p.retry();
      expect(p.status).toBe('pending');
    });

    it('should cancel', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      p.cancel();
      expect(p.status).toBe('cancelled');
    });

    it('should not cancel a completed payout', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      p.startProcessing();
      p.complete();
      expect(() => p.cancel()).toThrow('Cannot cancel a completed payout');
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const p = VendorPayout.create({
        vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
        periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31'),
      });
      const json = p.toJSON();
      expect(json.payoutId).toBeDefined();
      expect(json.payoutNumber).toMatch(/^PO-/);
    });
  });
});
