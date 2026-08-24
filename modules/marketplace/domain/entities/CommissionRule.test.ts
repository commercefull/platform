import { CommissionRule } from './CommissionRule';

describe('CommissionRule Entity', () => {
  describe('create', () => {
    it('should create a percentage rule', () => {
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'Global 10%', type: 'percentage', scope: 'global', rate: 10,
      });
      expect(r.type).toBe('percentage');
      expect(r.rate).toBe(10);
      expect(r.isActive).toBe(true);
    });

    it('should create a fixed rule', () => {
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'Fixed $5', type: 'fixed', scope: 'global', fixedAmount: 5,
      });
      expect(r.calculate(100)).toBe(5);
    });

    it('should create a tiered rule', () => {
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'Tiered', type: 'tiered', scope: 'global',
        tiers: [{ minAmount: 0, maxAmount: 100, rate: 5 }, { minAmount: 101, rate: 10 }],
      });
      expect(r.calculate(50)).toBe(2.5);
      expect(r.calculate(200)).toBe(20);
    });

    it('should reject percentage without rate', () => {
      expect(() => CommissionRule.create({
        organizationId: 'org-1', name: 'Bad', type: 'percentage', scope: 'global',
      })).toThrow('Percentage commission requires rate');
    });

    it('should reject fixed without amount', () => {
      expect(() => CommissionRule.create({
        organizationId: 'org-1', name: 'Bad', type: 'fixed', scope: 'global',
      })).toThrow('Fixed commission requires fixedAmount');
    });

    it('should reject tiered without tiers', () => {
      expect(() => CommissionRule.create({
        organizationId: 'org-1', name: 'Bad', type: 'tiered', scope: 'global',
      })).toThrow('Tiered commission requires at least one tier');
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate and activate', () => {
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'global', rate: 10,
      });
      r.deactivate();
      expect(r.isActive).toBe(false);
      expect(r.calculate(100)).toBe(0);
      r.activate();
      expect(r.isActive).toBe(true);
      expect(r.calculate(100)).toBe(10);
    });
  });

  describe('validity', () => {
    it('should respect start date', () => {
      const future = new Date(Date.now() + 86400000);
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'global', rate: 10, startsAt: future,
      });
      expect(r.isActive).toBe(false);
    });

    it('should respect end date', () => {
      const past = new Date(Date.now() - 86400000);
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'global', rate: 10, endsAt: past,
      });
      expect(r.isActive).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const r = CommissionRule.create({
        organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'global', rate: 10,
      });
      const json = r.toJSON();
      expect(json.name).toBe('R');
      expect(json.ruleId).toBeDefined();
    });
  });
});
