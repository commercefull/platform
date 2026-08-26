import { Vendor } from './Vendor';

describe('Vendor Entity', () => {
  describe('create', () => {
    it('should create a vendor with defaults', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'Acme', email: 'v@acme.com' });
      expect(v.vendorId).toBeDefined();
      expect(v.status).toBe('pending');
      expect(v.tier).toBe('standard');
      expect(v.commissionRate).toBe(10);
      expect(v.stats.totalOrders).toBe(0);
      expect(v.canSell).toBe(false);
    });

    it('should create with custom values', () => {
      const v = Vendor.create({
        organizationId: 'org-1', name: 'Acme', email: 'v@acme.com',
        commissionRate: 15, tier: 'premium', legalName: 'Acme Inc',
      });
      expect(v.commissionRate).toBe(15);
      expect(v.tier).toBe('premium');
    });
  });

  describe('lifecycle', () => {
    it('should approve a pending vendor', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.approve();
      expect(v.status).toBe('approved');
      expect(v.canSell).toBe(true);
    });

    it('should suspend and reactivate', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.approve();
      v.suspend();
      expect(v.canSell).toBe(false);
      v.approve();
      expect(v.status).toBe('approved');
    });

    it('should terminate', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.terminate();
      expect(v.status).toBe('terminated');
    });

    it('should not suspend a terminated vendor', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.terminate();
      expect(() => v.suspend()).toThrow('in status: terminated');
    });
  });

  describe('commission', () => {
    it('should calculate commission', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com', commissionRate: 15 });
      expect(v.calculateCommission(1000)).toBe(150);
    });

    it('should not set negative commission rate', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      expect(() => v.setCommissionRate(-1)).toThrow('Commission rate must be between 0 and 100');
    });
  });

  describe('stats', () => {
    it('should record orders', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.recordOrder(500);
      expect(v.stats.totalOrders).toBe(1);
      expect(v.stats.totalRevenue).toBe(500);
      expect(v.stats.outstandingBalance).toBe(500);
    });

    it('should record payouts', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.recordOrder(500);
      v.recordPayout(300);
      expect(v.stats.outstandingBalance).toBe(200);
      expect(v.stats.totalPayouts).toBe(300);
    });

    it('should not decrease balance below zero', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      v.recordOrder(100);
      v.recordPayout(200);
      expect(v.stats.outstandingBalance).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const v = Vendor.create({ organizationId: 'org-1', name: 'A', email: 'a@b.com' });
      const json = v.toJSON();
      expect(json.name).toBe('A');
      expect(json.vendorId).toBeDefined();
    });
  });
});
