import { ShippingSurcharge, type SurchargeContext } from './ShippingSurcharge';
import type { AttributeCondition } from '../../../../libs/rules/conditions';

describe('ShippingSurcharge domain entity', () => {
  const baseProps = {
    shippingSurchargeId: 'sc1',
    shippingRateId: 'rate1',
    type: 'fuel' as const,
    calculationType: 'flat' as const,
    value: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseContext: SurchargeContext = {
    baseRateCents: 10,
    weight: 5,
    orderValueCents: 100,
  };

  describe('isApplicable', () => {
    it('returns true when no conditions are set', () => {
      const sc = new ShippingSurcharge(baseProps);
      expect(sc.isApplicable(baseContext)).toBe(true);
    });

    it('returns false when inactive', () => {
      const sc = new ShippingSurcharge({ ...baseProps, isActive: false });
      expect(sc.isApplicable(baseContext)).toBe(false);
    });

    it('returns true when conditions match', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'weight', operator: 'gte', value: 3 }];
      const sc = new ShippingSurcharge({ ...baseProps, conditions });
      expect(sc.isApplicable({ ...baseContext, weight: 5 })).toBe(true);
    });

    it('returns false when conditions do not match', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'weight', operator: 'gte', value: 10 }];
      const sc = new ShippingSurcharge({ ...baseProps, conditions });
      expect(sc.isApplicable({ ...baseContext, weight: 5 })).toBe(false);
    });
  });

  describe('calculate — flat', () => {
    it('adds a flat surcharge', () => {
      const sc = new ShippingSurcharge({ ...baseProps, calculationType: 'flat', value: 5 });
      expect(sc.calculate(10, baseContext)).toBe(5);
    });

    it('returns 0 when not applicable', () => {
      const sc = new ShippingSurcharge({ ...baseProps, isActive: false });
      expect(sc.calculate(10, baseContext)).toBe(0);
    });
  });

  describe('calculate — percentage', () => {
    it('adds a percentage surcharge on the base rate', () => {
      const sc = new ShippingSurcharge({ ...baseProps, calculationType: 'percentage', value: 10 });
      // 10% of baseRateCents 10 = 1
      expect(sc.calculate(10, baseContext)).toBe(1);
    });

    it('adds 25% fuel surcharge', () => {
      const sc = new ShippingSurcharge({ ...baseProps, type: 'fuel', calculationType: 'percentage', value: 25 });
      // 25% of baseRateCents 20 = 5
      expect(sc.calculate(20, baseContext)).toBe(5);
    });
  });

  describe('condition-based surcharges', () => {
    it('applies remote-area surcharge only when isRemoteArea is true', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'isRemoteArea', operator: 'eq', value: true }];
      const sc = new ShippingSurcharge({
        ...baseProps,
        type: 'remoteArea',
        calculationType: 'flat',
        value: 15,
        conditions,
      });

      expect(sc.calculate(10, { ...baseContext, isRemoteArea: false })).toBe(0);
      expect(sc.calculate(10, { ...baseContext, isRemoteArea: true })).toBe(15);
    });

    it('applies residential surcharge only when isResidential is true', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'isResidential', operator: 'eq', value: true }];
      const sc = new ShippingSurcharge({
        ...baseProps,
        type: 'residential',
        calculationType: 'flat',
        value: 3,
        conditions,
      });

      expect(sc.calculate(10, { ...baseContext, isResidential: false })).toBe(0);
      expect(sc.calculate(10, { ...baseContext, isResidential: true })).toBe(3);
    });

    it('applies oversize surcharge based on weight threshold', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'weight', operator: 'gte', value: 70 }];
      const sc = new ShippingSurcharge({
        ...baseProps,
        type: 'oversize',
        calculationType: 'flat',
        value: 25,
        conditions,
      });

      expect(sc.calculate(10, { ...baseContext, weight: 50 })).toBe(0);
      expect(sc.calculate(10, { ...baseContext, weight: 70 })).toBe(25);
      expect(sc.calculate(10, { ...baseContext, weight: 100 })).toBe(25);
    });

    it('applies insurance surcharge as percentage of declared value', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'declaredValueCents', operator: 'gte', value: 1000 }];
      const sc = new ShippingSurcharge({
        ...baseProps,
        type: 'insurance',
        calculationType: 'percentage',
        value: 1,
        conditions,
      });

      // baseRateCents 10, declaredValueCents 1500 → 1% of 10 rounds to 0 cents
      expect(sc.calculate(10, { ...baseContext, declaredValueCents: 1500 })).toBe(0);
      // declaredValueCents below threshold → no surcharge
      expect(sc.calculate(10, { ...baseContext, declaredValueCents: 500 })).toBe(0);
    });

    it('applies signature surcharge as flat fee', () => {
      const conditions: AttributeCondition[] = [{ attribute: 'requiresSignature', operator: 'eq', value: true }];
      const sc = new ShippingSurcharge({
        ...baseProps,
        type: 'signature',
        calculationType: 'flat',
        value: 2,
        conditions,
      });

      expect(sc.calculate(10, { ...baseContext, requiresSignature: true })).toBe(2);
      expect(sc.calculate(10, { ...baseContext, requiresSignature: false })).toBe(0);
    });
  });

  describe('accessors', () => {
    it('exposes id, type, isActive', () => {
      const sc = new ShippingSurcharge(baseProps);
      expect(sc.id).toBe('sc1');
      expect(sc.type).toBe('fuel');
      expect(sc.isActive).toBe(true);
    });

    it('toJSON returns props', () => {
      const sc = new ShippingSurcharge(baseProps);
      const json = sc.toJSON();
      expect(json.shippingSurchargeId).toBe('sc1');
      expect(json.type).toBe('fuel');
    });
  });
});
