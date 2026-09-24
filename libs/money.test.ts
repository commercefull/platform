import { Money } from './money';

describe('libs/money', () => {
  describe('create / basic accessors', () => {
    it('creates with amount and currency', () => {
      const m = Money.create(10.5, 'USD');
      expect(m.amount).toBe(10.5);
      expect(m.currency).toBe('USD');
    });

    it('defaults currency to USD', () => {
      expect(Money.create(5).currency).toBe('USD');
    });

    it('uppercases currency', () => {
      expect(Money.create(5, 'usd').currency).toBe('USD');
    });

    it('rounds to 2 decimals on construction', () => {
      expect(Money.create(10.567).amount).toBe(10.57);
    });
  });

  describe('zero / fromCents', () => {
    it('zero creates zero money', () => {
      expect(Money.zero().amount).toBe(0);
      expect(Money.zero('EUR').currency).toBe('EUR');
    });

    it('fromCents converts cents to amount', () => {
      expect(Money.fromCents(1050).amount).toBe(10.5);
    });
  });

  describe('arithmetic', () => {
    it('add', () => {
      expect(Money.create(10).add(Money.create(5)).amount).toBe(15);
    });

    it('subtract', () => {
      expect(Money.create(10).subtract(Money.create(3)).amount).toBe(7);
    });

    it('multiply', () => {
      expect(Money.create(10).multiply(3).amount).toBe(30);
    });

    it('divide', () => {
      expect(Money.create(10).divide(2).amount).toBe(5);
    });

    it('divide by zero throws', () => {
      expect(() => Money.create(10).divide(0)).toThrow('Cannot divide by zero');
    });

    it('currency mismatch throws on add', () => {
      expect(() => Money.create(10, 'USD').add(Money.create(5, 'EUR'))).toThrow('Currency mismatch');
    });
  });

  describe('percentage', () => {
    it('computes percentage', () => {
      expect(Money.create(100).percentage(10).amount).toBe(10);
      expect(Money.create(50).percentage(25).amount).toBe(12.5);
    });
  });

  describe('allocate', () => {
    it('returns empty for empty weights', () => {
      expect(Money.create(100).allocate([])).toEqual([]);
    });

    it('returns zeros when weight sum is zero', () => {
      const result = Money.create(100).allocate([0, 0, 0]);
      expect(result.map(m => m.amount)).toEqual([0, 0, 0]);
    });

    it('allocates proportionally with exact sum', () => {
      const result = Money.create(100).allocate([1, 3]);
      expect(result.map(m => m.amount)).toEqual([25, 75]);
      expect(result.reduce((sum, m) => sum.add(m), Money.zero()).amount).toBe(100);
    });

    it('corrects penny drift so parts sum to total', () => {
      const result = Money.create(0.1).allocate([1, 1, 1]);
      const sum = result.reduce((s, m) => s.add(m), Money.zero()).amount;
      expect(sum).toBe(0.1);
    });

    it('preserves currency', () => {
      const result = Money.create(100, 'EUR').allocate([1, 1]);
      expect(result.every(m => m.currency === 'EUR')).toBe(true);
    });

    it('equal split of 1.00 into 3 parts sums to 1.00', () => {
      const result = Money.create(1.0).allocate([1, 1, 1]);
      const sum = result.reduce((s, m) => s.add(m), Money.zero()).amount;
      expect(sum).toBe(1.0);
    });
  });

  describe('predicates', () => {
    it('isZero / isPositive / isNegative', () => {
      expect(Money.zero().isZero()).toBe(true);
      expect(Money.create(5).isPositive()).toBe(true);
      expect(Money.create(-5).isNegative()).toBe(true);
    });

    it('equals', () => {
      expect(Money.create(10, 'USD').equals(Money.create(10, 'USD'))).toBe(true);
      expect(Money.create(10, 'USD').equals(Money.create(10, 'EUR'))).toBe(false);
    });
  });

  describe('format / toString / toJSON', () => {
    it('formats as currency', () => {
      expect(Money.create(10, 'USD').format()).toBe('$10.00');
    });

    it('toString', () => {
      expect(Money.create(10, 'USD').toString()).toBe('USD 10.00');
    });

    it('toJSON', () => {
      expect(Money.create(10, 'USD').toJSON()).toEqual({ cents: 1000, currency: 'USD' });
    });
  });
});
