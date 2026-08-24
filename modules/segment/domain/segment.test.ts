import { SegmentDefinition } from './entities/SegmentDefinition';
import { CustomerProfile } from './entities/CustomerProfile';
import { evaluateCondition, evaluateConditions } from './services/ConditionEvaluator';

describe('SegmentDefinition', () => {
  it('create produces a valid segment', () => {
    const segment = SegmentDefinition.create({
      name: 'VIP Customers',
      code: 'vip',
      conditions: [{ field: 'lifetimeValue', operator: 'gt', value: 5000 }],
    });

    expect(segment.name).toBe('VIP Customers');
    expect(segment.code).toBe('vip');
    expect(segment.isActive).toBe(true);
    expect(segment.isSystem).toBe(false);
    expect(segment.conditions).toHaveLength(1);
    expect(segment.matchMode).toBe('all');
  });

  it('update modifies fields', () => {
    const segment = SegmentDefinition.create({
      name: 'Test',
      code: 'test',
      conditions: [],
    });

    segment.update({ name: 'Updated', isActive: false });
    expect(segment.name).toBe('Updated');
    expect(segment.isActive).toBe(false);
  });

  it('setMemberCount updates count and lastEvaluatedAt', () => {
    const segment = SegmentDefinition.create({
      name: 'Test',
      code: 'test',
      conditions: [],
    });

    segment.setMemberCount(42);
    expect(segment.memberCount).toBe(42);
    expect(segment.lastEvaluatedAt).not.toBeNull();
  });

  it('activate/deactivate toggles isActive', () => {
    const segment = SegmentDefinition.create({
      name: 'Test',
      code: 'test',
      conditions: [],
    });

    segment.deactivate();
    expect(segment.isActive).toBe(false);
    segment.activate();
    expect(segment.isActive).toBe(true);
  });

  it('toJSON returns all props', () => {
    const segment = SegmentDefinition.create({
      name: 'Test',
      code: 'test',
      conditions: [{ field: 'totalOrders', operator: 'gte', value: 5 }],
    });

    const json = segment.toJSON();
    expect(json.name).toBe('Test');
    expect(json.code).toBe('test');
    expect(json.conditions).toHaveLength(1);
  });
});

describe('CustomerProfile', () => {
  it('create produces a profile with defaults', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });

    expect(profile.customerId).toBe('c1');
    expect(profile.lifetimeValue).toBe(0);
    expect(profile.totalOrders).toBe(0);
    expect(profile.rfmSegment).toBeNull();
  });

  it('updateAggregates sets values', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });

    profile.updateAggregates({
      lifetimeValue: 5000,
      totalOrders: 20,
      daysSinceLastOrder: 5,
    });

    expect(profile.lifetimeValue).toBe(5000);
    expect(profile.totalOrders).toBe(20);
    expect(profile.daysSinceLastOrder).toBe(5);
    expect(profile.lastComputedAt).not.toBeNull();
  });

  it('computeRFM assigns champion tier for high R/F/M', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });
    profile.updateAggregates({
      lifetimeValue: 6000,
      totalOrders: 25,
      daysSinceLastOrder: 10,
    });

    profile.computeRFM();

    expect(profile.rfmSegment).toBe('555');
    expect(profile.tier).toBe('champion');
    expect(profile.engagementScore).toBe(1);
    expect(profile.churnRisk).toBe(0);
  });

  it('computeRFM assigns lost tier for low R/F/M', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });
    profile.updateAggregates({
      lifetimeValue: 50,
      totalOrders: 1,
      daysSinceLastOrder: 400,
    });

    profile.computeRFM();

    expect(profile.rfmSegment).toBe('111');
    expect(profile.tier).toBe('lost');
  });

  it('computeRFM assigns at-risk tier for low R, high F', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });
    profile.updateAggregates({
      lifetimeValue: 3000,
      totalOrders: 12,
      daysSinceLastOrder: 200,
    });

    profile.computeRFM();

    expect(profile.rfmSegment).toBe('244');
    expect(profile.tier).toBe('at-risk');
    expect(profile.churnRisk).toBeGreaterThan(0);
  });

  it('computeRFM assigns new tier for high R, low F', () => {
    const profile = CustomerProfile.create({ customerId: 'c1' });
    profile.updateAggregates({
      lifetimeValue: 200,
      totalOrders: 1,
      daysSinceLastOrder: 15,
    });

    profile.computeRFM();

    expect(profile.rfmSegment).toBe('512');
    expect(profile.tier).toBe('new');
  });
});

describe('ConditionEvaluator', () => {
  let profile: CustomerProfile;

  beforeEach(() => {
    profile = CustomerProfile.create({ customerId: 'c1' });
    profile.updateAggregates({
      lifetimeValue: 2500,
      totalOrders: 8,
      daysSinceLastOrder: 45,
      averageOrderValue: 312.5,
    });
    profile.computeRFM();
  });

  it('evaluates gt condition', () => {
    expect(evaluateCondition({ field: 'lifetimeValue', operator: 'gt', value: 1000 }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'lifetimeValue', operator: 'gt', value: 3000 }, profile)).toBe(false);
  });

  it('evaluates gte condition', () => {
    expect(evaluateCondition({ field: 'totalOrders', operator: 'gte', value: 8 }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'totalOrders', operator: 'gte', value: 9 }, profile)).toBe(false);
  });

  it('evaluates lt condition', () => {
    expect(evaluateCondition({ field: 'daysSinceLastOrder', operator: 'lt', value: 60 }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'daysSinceLastOrder', operator: 'lt', value: 30 }, profile)).toBe(false);
  });

  it('evaluates eq condition', () => {
    expect(evaluateCondition({ field: 'rfmSegment', operator: 'eq', value: profile.rfmSegment }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'rfmSegment', operator: 'eq', value: '999' }, profile)).toBe(false);
  });

  it('evaluates in condition', () => {
    expect(evaluateCondition({ field: 'tier', operator: 'in', values: ['loyal', 'champion'] }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'tier', operator: 'in', values: ['lost', 'new'] }, profile)).toBe(false);
  });

  it('evaluates between condition', () => {
    expect(evaluateCondition({ field: 'lifetimeValue', operator: 'between', values: [1000, 5000] }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'lifetimeValue', operator: 'between', values: [3000, 5000] }, profile)).toBe(false);
  });

  it('evaluates isNull / isNotNull conditions', () => {
    expect(evaluateCondition({ field: 'email', operator: 'isNull' }, profile)).toBe(true);
    expect(evaluateCondition({ field: 'email', operator: 'isNotNull' }, profile)).toBe(false);
  });

  it('evaluateConditions with matchMode all returns true when all match', () => {
    const conditions = [
      { field: 'lifetimeValue' as const, operator: 'gt' as const, value: 1000 },
      { field: 'totalOrders' as const, operator: 'gte' as const, value: 5 },
    ];
    expect(evaluateConditions(conditions, 'all', profile)).toBe(true);
  });

  it('evaluateConditions with matchMode all returns false when one fails', () => {
    const conditions = [
      { field: 'lifetimeValue' as const, operator: 'gt' as const, value: 1000 },
      { field: 'totalOrders' as const, operator: 'gte' as const, value: 20 },
    ];
    expect(evaluateConditions(conditions, 'all', profile)).toBe(false);
  });

  it('evaluateConditions with matchMode any returns true when at least one matches', () => {
    const conditions = [
      { field: 'lifetimeValue' as const, operator: 'gt' as const, value: 10000 },
      { field: 'totalOrders' as const, operator: 'gte' as const, value: 5 },
    ];
    expect(evaluateConditions(conditions, 'any', profile)).toBe(true);
  });

  it('evaluateConditions returns true for empty conditions', () => {
    expect(evaluateConditions([], 'all', profile)).toBe(true);
  });
});
