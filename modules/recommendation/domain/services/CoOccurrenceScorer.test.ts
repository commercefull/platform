import { decayFactor, rankCoPurchases, scorePair } from './CoOccurrenceScorer';

describe('CoOccurrenceScorer', () => {
  it('should compute confidence and lift when counts are provided', () => {
    // A bought in 10 orders, B in 5 orders, together in 4 of 100 total
    const s = scorePair({ productId: 'a', relatedProductId: 'b', coCount: 4 }, 10, 5, 100);
    expect(s.support).toBe(4);
    expect(s.confidence).toBeCloseTo(0.4);
    // expected P(B) = 5/100 = 0.05 → lift = 0.4/0.05 = 8
    expect(s.lift).toBeCloseTo(8);
  });

  it('should return zero lift when the related product never sells', () => {
    const s = scorePair({ productId: 'a', relatedProductId: 'b', coCount: 4 }, 10, 0, 100);
    expect(s.lift).toBe(0);
  });

  it('should keep only pairs passing support and lift thresholds when ranking', () => {
    const pairs = [
      { productId: 'a', relatedProductId: 'b', coCount: 5 }, // confidence .5, lift high
      { productId: 'a', relatedProductId: 'c', coCount: 1 }, // below minSupport
      { productId: 'a', relatedProductId: 'd', coCount: 4 }, // sells 80/100 → lift < 1
    ];
    const counts: Record<string, number> = { a: 10, b: 6, c: 3, d: 80 };
    const ranked = rankCoPurchases(pairs, id => counts[id] ?? 0, 100, { minSupport: 3, minLift: 1 }, 10);
    expect(ranked.map(r => r.relatedProductId)).toEqual(['b']);
  });

  it('should rank by confidence then lift and cap at topN when scoring', () => {
    const pairs = [
      { productId: 'a', relatedProductId: 'b', coCount: 8 }, // conf .8
      { productId: 'a', relatedProductId: 'c', coCount: 5 }, // conf .5
      { productId: 'a', relatedProductId: 'd', coCount: 3 }, // conf .3
    ];
    const counts: Record<string, number> = { a: 10, b: 10, c: 10, d: 10 };
    const ranked = rankCoPurchases(pairs, id => counts[id] ?? 0, 100, { minSupport: 1, minLift: 0 }, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].relatedProductId).toBe('b');
    expect(ranked[1].relatedProductId).toBe('c');
  });

  it('should halve counts over one half-life when decay is applied', () => {
    expect(decayFactor(90)).toBeCloseTo(Math.pow(0.5, 1 / 90));
    expect(decayFactor(0)).toBe(1);
  });
});
