import { TaxExemption } from './TaxExemption';
import type { ExemptionEvaluationContext } from '../../taxTypes';

describe('TaxExemption domain entity', () => {
  const baseProps = {
    id: 'ex1',
    customerId: 'cust-1',
    type: 'resale' as const,
    status: 'approved' as const,
    exemptionNumber: 'EX123',
    name: 'Resale Certificate',
    startDate: Date.now(),
    isVerified: true,
    exemptionPercent: 100,
    applicableTaxCategoryIds: null,
  };

  const context: ExemptionEvaluationContext = {
    orderSubtotal: 100,
  };

  describe('evaluate', () => {
    it('returns exempt for approved, non-expired, full exemption', () => {
      const e = new TaxExemption(baseProps);
      expect(e.evaluate(context)).toBe('exempt');
    });

    it('returns partiallyExempt for 50% exemption', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: 50 });
      expect(e.evaluate(context)).toBe('partiallyExempt');
    });

    it('returns notExempt for 0% exemption', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: 0 });
      expect(e.evaluate(context)).toBe('notExempt');
    });

    it('returns pending for pending status', () => {
      const e = new TaxExemption({ ...baseProps, status: 'pending' });
      expect(e.evaluate(context)).toBe('pending');
    });

    it('returns notExempt for rejected status', () => {
      const e = new TaxExemption({ ...baseProps, status: 'rejected' });
      expect(e.evaluate(context)).toBe('notExempt');
    });

    it('returns notExempt for revoked status', () => {
      const e = new TaxExemption({ ...baseProps, status: 'revoked' });
      expect(e.evaluate(context)).toBe('notExempt');
    });

    it('returns notExempt for expired certificate', () => {
      const e = new TaxExemption({
        ...baseProps,
        expiryDate: new Date(Date.now() - 86400000), // yesterday
      });
      expect(e.evaluate(context)).toBe('notExempt');
    });

    it('returns exempt when expiryDate is in the future', () => {
      const e = new TaxExemption({
        ...baseProps,
        expiryDate: new Date(Date.now() + 86400000), // tomorrow
      });
      expect(e.evaluate(context)).toBe('exempt');
    });

    it('returns notExempt when category does not match', () => {
      const e = new TaxExemption({
        ...baseProps,
        applicableTaxCategoryIds: ['digital-goods'],
      });
      expect(e.evaluate({ taxCategoryId: 'physical-goods', orderSubtotal: 100 })).toBe('notExempt');
    });

    it('returns exempt when category matches', () => {
      const e = new TaxExemption({
        ...baseProps,
        applicableTaxCategoryIds: ['digital-goods'],
      });
      expect(e.evaluate({ taxCategoryId: 'digital-goods', orderSubtotal: 100 })).toBe('exempt');
    });

    it('returns exempt when applicableTaxCategoryIds is null (all categories)', () => {
      const e = new TaxExemption({ ...baseProps, applicableTaxCategoryIds: null });
      expect(e.evaluate({ taxCategoryId: 'anything', orderSubtotal: 100 })).toBe('exempt');
    });

    it('returns notExempt when order subtotal below minOrderAmount', () => {
      const e = new TaxExemption({ ...baseProps, minOrderAmount: 500 });
      expect(e.evaluate({ orderSubtotal: 100 })).toBe('notExempt');
    });

    it('returns exempt when order subtotal meets minOrderAmount', () => {
      const e = new TaxExemption({ ...baseProps, minOrderAmount: 50 });
      expect(e.evaluate({ orderSubtotal: 100 })).toBe('exempt');
    });

    it('returns notExempt when order subtotal exceeds maxOrderAmount', () => {
      const e = new TaxExemption({ ...baseProps, maxOrderAmount: 50 });
      expect(e.evaluate({ orderSubtotal: 100 })).toBe('notExempt');
    });

    it('returns exempt when order subtotal is within amount bounds', () => {
      const e = new TaxExemption({ ...baseProps, minOrderAmount: 50, maxOrderAmount: 200 });
      expect(e.evaluate({ orderSubtotal: 100 })).toBe('exempt');
    });
  });

  describe('effectiveTaxRateMultiplier', () => {
    it('returns 0 for full exemption', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: 100 });
      expect(e.effectiveTaxRateMultiplier(context)).toBe(0);
    });

    it('returns 0.5 for 50% partial exemption', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: 50 });
      expect(e.effectiveTaxRateMultiplier(context)).toBe(0.5);
    });

    it('returns 1 for not exempt', () => {
      const e = new TaxExemption({ ...baseProps, status: 'rejected' });
      expect(e.effectiveTaxRateMultiplier(context)).toBe(1);
    });

    it('returns 0.75 for 25% partial exemption', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: 25 });
      expect(e.effectiveTaxRateMultiplier(context)).toBe(0.75);
    });
  });

  describe('appliesToCategory', () => {
    it('returns true when applicableTaxCategoryIds is null', () => {
      const e = new TaxExemption({ ...baseProps, applicableTaxCategoryIds: null });
      expect(e.appliesToCategory('anything')).toBe(true);
    });

    it('returns true when taxCategoryId is undefined', () => {
      const e = new TaxExemption({ ...baseProps, applicableTaxCategoryIds: ['books'] });
      expect(e.appliesToCategory(undefined)).toBe(true);
    });

    it('returns true when category is in the list', () => {
      const e = new TaxExemption({ ...baseProps, applicableTaxCategoryIds: ['books', 'food'] });
      expect(e.appliesToCategory('books')).toBe(true);
    });

    it('returns false when category is not in the list', () => {
      const e = new TaxExemption({ ...baseProps, applicableTaxCategoryIds: ['books'] });
      expect(e.appliesToCategory('electronics')).toBe(false);
    });
  });

  describe('accessors', () => {
    it('exposes id, type, status, exemptionPercent', () => {
      const e = new TaxExemption(baseProps);
      expect(e.id).toBe('ex1');
      expect(e.type).toBe('resale');
      expect(e.status).toBe('approved');
      expect(e.exemptionPercent).toBe(100);
    });

    it('defaults exemptionPercent to 100 when not provided', () => {
      const e = new TaxExemption({ ...baseProps, exemptionPercent: undefined });
      expect(e.exemptionPercent).toBe(100);
    });

    it('toJSON returns props', () => {
      const e = new TaxExemption(baseProps);
      const json = e.toJSON();
      expect(json.id).toBe('ex1');
      expect(json.type).toBe('resale');
    });
  });
});
