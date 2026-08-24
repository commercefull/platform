jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
}));

jest.mock('../logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { query } from '../db';
import {
  getMerchandisingRules,
  getCategoryManualOrder,
  createMerchandisingRule,
  updateMerchandisingRule,
  deleteMerchandisingRule,
  listMerchandisingRules,
  setCategoryManualOrder,
  getCategoryManualOrderList,
  deleteCategoryManualOrder,
} from './merchandising';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('Merchandising Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMerchandisingRules', () => {
    it('returns empty context when no rules found', async () => {
      mockedQuery.mockResolvedValueOnce([] as never);

      const result = await getMerchandisingRules('test', 'cat1');

      expect(result).toEqual({});
    });

    it('returns boost/bury/pin from rules', async () => {
      mockedQuery.mockResolvedValueOnce([
        { ruleId: 'r1', ruleType: 'boost', productId: 'p1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { ruleId: 'r2', ruleType: 'bury', productId: 'p2', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { ruleId: 'r3', ruleType: 'pin', productId: 'p3', position: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ] as never);

      const result = await getMerchandisingRules('test');

      expect(result.boostProductIds).toEqual(['p1']);
      expect(result.buryProductIds).toEqual(['p2']);
      expect(result.pinnedProducts).toEqual([{ productId: 'p3', position: 0 }]);
    });

    it('returns empty context on error', async () => {
      mockedQuery.mockRejectedValueOnce(new Error('DB error') as never);

      const result = await getMerchandisingRules('test');

      expect(result).toEqual({});
    });
  });

  describe('getCategoryManualOrder', () => {
    it('returns undefined when no orders found', async () => {
      mockedQuery.mockResolvedValueOnce([] as never);

      const result = await getCategoryManualOrder('cat1');

      expect(result).toBeUndefined();
    });

    it('returns manual ordering context', async () => {
      mockedQuery.mockResolvedValueOnce([
        { orderId: 'o1', categoryId: 'cat1', productId: 'p1', position: 0, isActive: true },
        { orderId: 'o2', categoryId: 'cat1', productId: 'p2', position: 1, isActive: true },
        { orderId: 'o3', categoryId: 'cat1', productId: 'p3', position: 2, isActive: true },
      ] as never);

      const result = await getCategoryManualOrder('cat1');

      expect(result).toBeDefined();
      expect(result!.categoryId).toBe('cat1');
      expect(result!.productIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('returns undefined on error', async () => {
      mockedQuery.mockRejectedValueOnce(new Error('DB error') as never);

      const result = await getCategoryManualOrder('cat1');

      expect(result).toBeUndefined();
    });
  });

  describe('CRUD operations', () => {
    it('createMerchandisingRule inserts and returns rule', async () => {
      const mockRule = { ruleId: 'r1', ruleType: 'boost', productId: 'p1', isActive: true, createdAt: new Date(), updatedAt: new Date() };
      mockedQuery.mockResolvedValueOnce([mockRule] as never);

      const result = await createMerchandisingRule({
        ruleType: 'boost',
        productId: 'p1',
        isActive: true,
      });

      expect(result.ruleId).toBe('r1');
      expect(result.ruleType).toBe('boost');
    });

    it('updateMerchandisingRule updates and returns rule', async () => {
      const mockRule = { ruleId: 'r1', ruleType: 'bury', productId: 'p1', isActive: false, createdAt: new Date(), updatedAt: new Date() };
      mockedQuery.mockResolvedValueOnce([mockRule] as never);

      const result = await updateMerchandisingRule('r1', { isActive: false });

      expect(result).not.toBeNull();
      expect(result!.isActive).toBe(false);
    });

    it('updateMerchandisingRule returns null when rule not found', async () => {
      mockedQuery.mockResolvedValueOnce([] as never);

      const result = await updateMerchandisingRule('nonexistent', { isActive: false });

      expect(result).toBeNull();
    });

    it('deleteMerchandisingRule returns true', async () => {
      mockedQuery.mockResolvedValueOnce([] as never);

      const result = await deleteMerchandisingRule('r1');

      expect(result).toBe(true);
    });

    it('listMerchandisingRules returns rules', async () => {
      const mockRules = [
        { ruleId: 'r1', ruleType: 'boost', productId: 'p1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { ruleId: 'r2', ruleType: 'bury', productId: 'p2', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockedQuery.mockResolvedValueOnce(mockRules as never);

      const result = await listMerchandisingRules({ ruleType: 'boost' });

      expect(result).toHaveLength(2);
    });
  });

  describe('Category manual order CRUD', () => {
    it('setCategoryManualOrder deletes old and inserts new', async () => {
      mockedQuery.mockResolvedValue([] as never);

      await setCategoryManualOrder('cat1', ['p1', 'p2', 'p3']);

      // 1 delete + 3 inserts = 4 calls
      expect(mockedQuery).toHaveBeenCalledTimes(4);
    });

    it('getCategoryManualOrderList returns ordered list', async () => {
      mockedQuery.mockResolvedValueOnce([
        { orderId: 'o1', categoryId: 'cat1', productId: 'p1', position: 0, isActive: true },
        { orderId: 'o2', categoryId: 'cat1', productId: 'p2', position: 1, isActive: true },
      ] as never);

      const result = await getCategoryManualOrderList('cat1');

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
    });

    it('deleteCategoryManualOrder executes delete', async () => {
      mockedQuery.mockResolvedValueOnce([] as never);

      await deleteCategoryManualOrder('cat1');

      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });
  });
});
