import { Promotion } from './Promotion';

describe('Promotion', () => {
  it('should create an active promotion (happy path)', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Summer Sale', type: 'percentage', value: 20, startDate: new Date(),
    });
    expect(promo.promotionId).toBe('p1');
    expect(promo.isActive).toBe(true);
    expect(promo.status).toBe('active');
  });

  it('should create a scheduled promotion when start date is future', () => {
    const future = new Date(Date.now() + 86400000);
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Future Sale', type: 'percentage', value: 10, startDate: future,
    });
    expect(promo.status).toBe('scheduled');
  });

  it('should uppercase code', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'fixed_amount', value: 10, startDate: new Date(), code: 'save10',
    });
    expect(promo.code).toBe('SAVE10');
  });

  it('should calculate percentage discount', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 20, startDate: new Date(),
    });
    expect(promo.calculateDiscount(100)).toBe(20);
  });

  it('should calculate fixed discount', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'fixed_amount', value: 15, startDate: new Date(),
    });
    expect(promo.calculateDiscount(100)).toBe(15);
  });

  it('should cap discount at maxDiscount', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 50, maxDiscount: 30, startDate: new Date(),
    });
    expect(promo.calculateDiscount(100)).toBe(30);
  });

  it('should cap discount at subtotal', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'fixed_amount', value: 200, startDate: new Date(),
    });
    expect(promo.calculateDiscount(100)).toBe(100);
  });

  it('should return 0 for free_shipping type', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Free Ship', type: 'free_shipping', value: 0, startDate: new Date(),
    });
    expect(promo.calculateDiscount(100)).toBe(0);
  });

  it('should check isApplicable with minPurchase', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10, minPurchase: 50, startDate: new Date(),
    });
    expect(promo.isApplicable(100)).toBe(true);
    expect(promo.isApplicable(30)).toBe(false);
  });

  it('should check usage limit', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10, usageLimit: 5, startDate: new Date(),
    });
    expect(promo.isUsageLimitReached).toBe(false);
    expect(promo.remainingUses).toBe(5);
    promo.incrementUsage();
    expect(promo.usageCount).toBe(1);
    expect(promo.remainingUses).toBe(4);
  });

  it('should detect expired promotion', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10,
      startDate: new Date(Date.now() - 86400000 * 2), endDate: new Date(Date.now() - 86400000),
    });
    expect(promo.isExpired).toBe(true);
    expect(promo.isApplicable(100)).toBe(false);
  });

  it('should activate, pause, and cancel', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10, startDate: new Date(),
    });
    promo.pause();
    expect(promo.status).toBe('paused');
    expect(promo.isActive).toBe(false);
    promo.activate();
    expect(promo.isActive).toBe(true);
    promo.cancel();
    expect(promo.status).toBe('cancelled');
  });

  it('should extend end date and reactivate expired', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10,
      startDate: new Date(Date.now() - 86400000 * 2), endDate: new Date(Date.now() - 86400000),
    });
    promo.extend(new Date(Date.now() + 86400000));
    expect(promo.isExpired).toBe(false);
  });

  it('should serialize to JSON', () => {
    const promo = Promotion.create({
      promotionId: 'p1', name: 'Sale', type: 'percentage', value: 10, startDate: new Date(),
    });
    const json = promo.toJSON();
    expect(json.promotionId).toBe('p1');
    expect(json.isActive).toBe(true);
  });
});
