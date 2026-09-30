jest.mock('./index', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

import { query, queryOne } from './index';
import { countRows, findPaginated } from './queryHelpers';

const mockQuery = query as jest.Mock;
const mockQueryOne = queryOne as jest.Mock;

describe('libs/db/queryHelpers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('findPaginated', () => {
    it('runs a count query then a paginated select', async () => {
      mockQueryOne.mockResolvedValue({ count: '42' });
      mockQuery.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await findPaginated<{ id: number }>('product', 'WHERE "isActive" = $1', [true], { limit: 10, offset: 20 });

      expect(mockQueryOne).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM "product" WHERE "isActive" = $1', [true]);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM "product" WHERE "isActive" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
        [true, 10, 20],
      );
      expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 42, limit: 10, offset: 20, hasMore: true, length: 2 });
    });

    it('applies defaults for missing pagination options', async () => {
      mockQueryOne.mockResolvedValue({ count: '0' });
      mockQuery.mockResolvedValue([]);

      await findPaginated('order', '', []);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM "order"  ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2',
        [20, 0],
      );
    });

    it('respects custom orderBy and direction', async () => {
      mockQueryOne.mockResolvedValue({ count: '1' });
      mockQuery.mockResolvedValue([{ id: 1 }]);

      await findPaginated('customer', '', [], { orderBy: 'email', orderDirection: 'asc' });
      expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY "email" ASC');
    });

    it('computes hasMore correctly at the end of the result set', async () => {
      mockQueryOne.mockResolvedValue({ count: '21' });
      mockQuery.mockResolvedValue([{ id: 1 }]);

      const result = await findPaginated<{ id: number }>('product', '', [], { limit: 10, offset: 20 });
      expect(result.hasMore).toBe(false);
    });

    it('returns 0 total when the count row is missing', async () => {
      mockQueryOne.mockResolvedValue(null);
      mockQuery.mockResolvedValue(null);

      const result = await findPaginated('product', '', []);
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('countRows', () => {
    it('returns the parsed count', async () => {
      mockQueryOne.mockResolvedValue({ count: '7' });
      expect(await countRows('product', 'WHERE 1=1', [])).toBe(7);
    });

    it('returns 0 when no row comes back', async () => {
      mockQueryOne.mockResolvedValue(null);
      expect(await countRows('product', '', [])).toBe(0);
    });
  });
});
