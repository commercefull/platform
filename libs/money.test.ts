import { Money, formatCents, formatCentsWithTax, formatPriceWithTax, fromMinorUnits, getCurrencyDecimals, toMinorUnits } from './money';

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

  describe('ISO 4217 minor units', () => {
    it('should report 0 decimals when currency is JPY, KRW, or VND', () => {
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('KRW')).toBe(0);
      expect(getCurrencyDecimals('VND')).toBe(0);
    });

    it('should report 3 decimals when currency is KWD, BHD, or OMR', () => {
      expect(getCurrencyDecimals('KWD')).toBe(3);
      expect(getCurrencyDecimals('BHD')).toBe(3);
      expect(getCurrencyDecimals('OMR')).toBe(3);
    });

    it('should default to 2 decimals when currency is unlisted', () => {
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('EUR')).toBe(2);
      expect(getCurrencyDecimals('XXX')).toBe(2);
    });

    it('should be case-insensitive when resolving decimals', () => {
      expect(getCurrencyDecimals('jpy')).toBe(0);
    });

    it('should store major units verbatim when creating zero-decimal JPY', () => {
      const m = Money.create(1500, 'JPY');
      expect(m.cents).toBe(1500);
      expect(m.amount).toBe(1500);
    });

    it('should store 1000 minor units per major unit when creating three-decimal KWD', () => {
      const m = Money.create(1.234, 'KWD');
      expect(m.cents).toBe(1234);
      expect(m.amount).toBe(1.234);
    });

    it('should round-trip major and minor units when converting JPY', () => {
      expect(toMinorUnits(1500, 'JPY')).toBe(1500);
      expect(fromMinorUnits(1500, 'JPY')).toBe(1500);
    });

    it('should round-trip major and minor units when converting KWD', () => {
      expect(toMinorUnits(2.5, 'KWD')).toBe(2500);
      expect(fromMinorUnits(2500, 'KWD')).toBe(2.5);
    });

    it('should preserve integer minor units through arithmetic when currency is JPY', () => {
      const total = Money.create(1000, 'JPY').add(Money.create(500, 'JPY')).subtract(Money.create(200, 'JPY'));
      expect(total.cents).toBe(1300);
      expect(total.amount).toBe(1300);
    });

    it('should format without a decimal part when formatting JPY', () => {
      expect(Money.create(1500, 'JPY').format('ja-JP')).toBe('￥1,500');
    });

    it('should format minor units without dividing by 100 when formatting JPY cents', () => {
      expect(formatCents(1500, 'JPY', 'ja-JP')).toBe('￥1,500');
    });

    it('should format minor units as three decimals when formatting KWD cents', () => {
      const formatted = formatCents(1234, 'KWD', 'en-KW');
      expect(formatted).toContain('1.234');
    });

    it('should render zero decimal places in toString when currency is JPY', () => {
      expect(Money.create(1500, 'JPY').toString()).toBe('JPY 1500');
    });

    it('should render three decimal places in toString when currency is KWD', () => {
      expect(Money.create(1.234, 'KWD').toString()).toBe('KWD 1.234');
    });

    it('should allocate minor units without drift when splitting JPY', () => {
      const parts = Money.create(100, 'JPY').allocate([1, 1, 1]);
      expect(parts.reduce((sum, m) => sum + m.cents, 0)).toBe(100);
    });

    it('should append the default tax label when priceDisplayMode is inclusive_tax', () => {
      expect(formatPriceWithTax(49.99, 'GBP', 'en-GB', 'inclusive_tax')).toContain('incl. VAT');
    });

    it('should append a caller-supplied tax label when priceDisplayMode is inclusive_tax', () => {
      expect(formatPriceWithTax(49.99, 'JPY', 'ja-JP', 'inclusive_tax', '税込')).toContain('税込');
    });

    it('should use the custom tax label when formatting cents with tax', () => {
      const formatted = formatCentsWithTax(1500, 'JPY', 'ja-JP', 'inclusive_tax', '税込');
      expect(formatted).toContain('税込');
    });
  });
});
