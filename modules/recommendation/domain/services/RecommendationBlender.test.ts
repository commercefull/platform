import { applyEligibility, blend, type BlendCandidate } from './RecommendationBlender';

const cand = (productId: string, score: number, source: BlendCandidate['source'] = 'fbt'): BlendCandidate => ({
  productId,
  source,
  candidateSource: source === 'manual' ? 'manual' : 'fbt',
  score,
});

describe('RecommendationBlender.blend', () => {
  it('should fill from the first waterfall source before the next when blending', () => {
    const out = blend(
      {
        sourceProductIds: ['p1'],
        steps: [
          { source: 'manual', candidates: [cand('m1', 999, 'manual'), cand('m2', 998, 'manual')] },
          { source: 'fbt', candidates: [cand('f1', 0.9), cand('f2', 0.8)] },
        ],
      },
      3,
    );
    expect(out.map(o => o.productId)).toEqual(['m1', 'm2', 'f1']);
  });

  it('should dedupe candidates across sources when blending', () => {
    const out = blend(
      {
        sourceProductIds: ['p1'],
        steps: [
          { source: 'manual', candidates: [cand('x', 999, 'manual')] },
          { source: 'fbt', candidates: [cand('x', 0.9), cand('y', 0.8)] },
        ],
      },
      10,
    );
    expect(out.map(o => o.productId)).toEqual(['x', 'y']);
    expect(out[0].source).toBe('manual');
  });

  it('should aggregate scores when several source products recommend the same candidate', () => {
    const out = blend(
      {
        sourceProductIds: ['p1', 'p2'],
        steps: [
          {
            source: 'fbt',
            candidates: [cand('x', 0.4), cand('x', 0.3), cand('y', 0.5)],
          },
        ],
      },
      10,
    );
    // x is recommended twice (by two basket items) → aggregated 0.7 > y 0.5
    expect(out[0].productId).toBe('x');
    expect(out[0].score).toBeCloseTo(0.7);
  });

  it('should exclude source products when blending', () => {
    const out = blend(
      {
        sourceProductIds: ['p1'],
        steps: [{ source: 'fbt', candidates: [cand('p1', 0.9), cand('x', 0.8)] }],
      },
      10,
    );
    expect(out.map(o => o.productId)).toEqual(['x']);
  });
});

describe('RecommendationBlender.applyEligibility', () => {
  const card = (productId: string, overrides: Record<string, unknown> = {}) => ({
    productId,
    status: 'active',
    visibility: 'visible',
    isInventoryManaged: false,
    ...overrides,
  });
  const ctx = {
    excludeProductIds: new Set<string>(['src']),
    excludedPairs: new Set<string>(),
    globalExclusions: new Set<string>(),
    hideOutOfStock: true,
  };

  it('should drop candidates failing lookup, status, or visibility when filtering', () => {
    const out = applyEligibility(
      [cand('a', 1), cand('b', 1), cand('c', 1), cand('d', 1)],
      [card('a'), card('b', { status: 'draft' }), card('c', { visibility: 'hidden' })],
      ctx,
      'src',
    );
    expect(out.map(o => o.productId)).toEqual(['a']);
  });

  it('should drop pair and global exclusions when filtering', () => {
    const out = applyEligibility(
      [cand('a', 1), cand('b', 1), cand('c', 1)],
      [card('a'), card('b'), card('c')],
      { ...ctx, excludedPairs: new Set(['src:b']), globalExclusions: new Set(['c']) },
      'src',
    );
    expect(out.map(o => o.productId)).toEqual(['a']);
  });

  it('should drop out-of-stock managed products when hideOutOfStock is set', () => {
    const out = applyEligibility(
      [cand('a', 1), cand('b', 1)],
      [card('a'), card('b', { isInventoryManaged: true, inStock: false })],
      ctx,
      'src',
    );
    expect(out.map(o => o.productId)).toEqual(['a']);
  });
});
