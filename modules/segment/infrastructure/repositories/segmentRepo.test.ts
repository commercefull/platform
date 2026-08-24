jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { query, queryOne } from '../../../../libs/db';
import { SegmentRepositoryImpl } from './SegmentRepositoryImpl';
import { CustomerProfileRepositoryImpl } from './CustomerProfileRepositoryImpl';
import { SegmentMembershipRepositoryImpl } from './SegmentMembershipRepositoryImpl';
import { SegmentDefinition } from '../../domain/entities/SegmentDefinition';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('SegmentRepositoryImpl', () => {
  let repo: SegmentRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SegmentRepositoryImpl();
  });

  it('findById returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('findById returns SegmentDefinition when found', async () => {
    const mockRow = {
      segmentId: 's1', name: 'VIP', code: 'vip', description: null,
      conditions: [], matchMode: 'all', isActive: true, isSystem: false,
      color: null, icon: null, memberCount: 0, lastEvaluatedAt: null,
      organizationId: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.findById('s1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('VIP');
    expect(result!.code).toBe('vip');
  });

  it('findByCode returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findByCode('nonexistent');
    expect(result).toBeNull();
  });

  it('findAll returns empty array when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findAll();
    expect(result).toEqual([]);
  });

  it('create returns created segment', async () => {
    const segment = SegmentDefinition.create({
      name: 'High Value',
      code: 'high_value',
      conditions: [{ field: 'lifetimeValue', operator: 'gt', value: 1000 }],
    });
    const mockRow = {
      segmentId: 's1', name: 'High Value', code: 'high_value', description: null,
      conditions: [{ field: 'lifetimeValue', operator: 'gt', value: 1000 }],
      matchMode: 'all', isActive: true, isSystem: false,
      color: null, icon: null, memberCount: 0, lastEvaluatedAt: null,
      organizationId: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.create(segment);
    expect(result.name).toBe('High Value');
  });

  it('delete returns true when deleted', async () => {
    mockedQueryOne.mockResolvedValueOnce({ segmentId: 's1' } as never);
    const result = await repo.delete('s1');
    expect(result).toBe(true);
  });

  it('delete returns false when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.delete('nonexistent');
    expect(result).toBe(false);
  });

  it('count returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.count();
    expect(result).toBe(0);
  });

  it('count returns correct number', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '5' } as never);
    const result = await repo.count(true);
    expect(result).toBe(5);
  });
});

describe('CustomerProfileRepositoryImpl', () => {
  let repo: CustomerProfileRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CustomerProfileRepositoryImpl();
  });

  it('findByCustomerId returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findByCustomerId('c1');
    expect(result).toBeNull();
  });

  it('findByCustomerId returns profile when found', async () => {
    const mockRow = {
      customerProfileId: 'p1', customerId: 'c1', email: 'test@test.com',
      firstName: 'Test', lastName: 'User', status: 'active', tier: 'regular',
      lifetimeValue: '1000', totalSpent: '1000', averageOrderValue: '100',
      totalOrders: 10, firstOrderDate: null, lastOrderDate: null,
      daysSinceLastOrder: 5, ordersLast30Days: 2, ordersLast90Days: 5,
      ordersLast12Months: 10, productViews: 100, cartCount: 20,
      abandonedCarts: 5, wishlistItemCount: 3, reviewCount: 2,
      averageReviewRating: '4.5', visitCount: 50, lastVisitDate: null,
      rfmSegment: '555', engagementScore: '1.0', churnRisk: '0',
      riskScore: null, preferredCategories: null, preferredProducts: null,
      preferredPaymentMethods: null, preferredShippingMethods: null,
      deviceUsage: null, tags: null, customAttributes: null,
      segmentIds: null, organizationId: null, lastComputedAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    const result = await repo.findByCustomerId('c1');
    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('c1');
    expect(result!.lifetimeValue).toBe(1000);
  });

  it('count returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.count();
    expect(result).toBe(0);
  });

  it('delete returns true when deleted', async () => {
    mockedQueryOne.mockResolvedValueOnce({ customerId: 'c1' } as never);
    const result = await repo.delete('c1');
    expect(result).toBe(true);
  });
});

describe('SegmentMembershipRepositoryImpl', () => {
  let repo: SegmentMembershipRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SegmentMembershipRepositoryImpl();
  });

  it('findBySegment returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findBySegment('s1');
    expect(result).toEqual([]);
  });

  it('countBySegment returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.countBySegment('s1');
    expect(result).toBe(0);
  });

  it('upsert calls queryOne', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    await repo.upsert('s1', 'c1', 0.95);
    expect(mockedQueryOne).toHaveBeenCalled();
  });
});
