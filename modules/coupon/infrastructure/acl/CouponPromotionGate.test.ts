import { CouponPromotionGate, CouponPromotionGatePort } from './CouponPromotionGate';
import type { Promotion, PromotionRule } from '../../../promotion/domain/repositories/PromotionRepository';

const promotion = (overrides: Partial<Promotion> = {}): Promotion =>
  ({
    promotionId: 'promo-1',
    name: 'Channel Promo',
    isActive: true,
    status: 'active',
    ...overrides,
  }) as unknown as Promotion;

const rule = (condition: string, value: unknown, operator = 'in'): PromotionRule =>
  ({
    promotionRuleId: 'rule-1',
    promotionId: 'promo-1',
    condition,
    operator,
    value,
    isActive: true,
  }) as unknown as PromotionRule;

const baseContext = {
  subtotalCents: 10000,
  currency: 'USD',
  customerId: 'cust-1',
  storeId: 'store-us',
  channelId: 'ch-web',
  countryCode: 'US',
  items: [{ productId: 'prod-1', quantity: 2, unitPriceCents: 5000 }],
};

describe('CouponPromotionGate', () => {
  let promotions: jest.Mocked<CouponPromotionGatePort>;
  let gate: CouponPromotionGate;

  beforeEach(() => {
    promotions = {
      findById: jest.fn(),
      findRulesByPromotionId: jest.fn(),
    };
    gate = new CouponPromotionGate(promotions);
  });

  it('should be eligible when the coupon has no linked promotion', async () => {
    const result = await gate.isEligible(undefined, baseContext);

    expect(result.eligible).toBe(true);
    expect(promotions.findById).not.toHaveBeenCalled();
  });

  it('should be eligible when the linked promotion has no rules', async () => {
    promotions.findById.mockResolvedValue(promotion());
    promotions.findRulesByPromotionId.mockResolvedValue([]);

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(true);
  });

  it('should be eligible when store and channel rules match the context', async () => {
    promotions.findById.mockResolvedValue(promotion());
    promotions.findRulesByPromotionId.mockResolvedValue([rule('store', ['store-us', 'store-uk']), rule('channel', ['ch-web'])]);

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(true);
  });

  it('should be ineligible when the channel does not match', async () => {
    promotions.findById.mockResolvedValue(promotion());
    promotions.findRulesByPromotionId.mockResolvedValue([rule('channel', ['ch-facebook'])]);

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not eligible');
  });

  it('should be ineligible when the country does not match', async () => {
    promotions.findById.mockResolvedValue(promotion());
    promotions.findRulesByPromotionId.mockResolvedValue([rule('country', ['GB', 'DE'])]);

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(false);
  });

  it('should be ineligible when the currency does not match', async () => {
    promotions.findById.mockResolvedValue(promotion());
    promotions.findRulesByPromotionId.mockResolvedValue([rule('currency', ['EUR'])]);

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(false);
  });

  it('should be ineligible when the linked promotion is not active', async () => {
    promotions.findById.mockResolvedValue(promotion({ status: 'disabled' }));

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not active');
  });

  it('should be ineligible when the linked promotion does not exist', async () => {
    promotions.findById.mockResolvedValue(null);

    const result = await gate.isEligible('promo-missing', baseContext);

    expect(result.eligible).toBe(false);
  });

  it('should fail closed when the promotion lookup throws', async () => {
    promotions.findById.mockRejectedValue(new Error('DB error'));

    const result = await gate.isEligible('promo-1', baseContext);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('could not be verified');
  });
});
