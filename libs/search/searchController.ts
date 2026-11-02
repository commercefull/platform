/**
 * Search Controller
 *
 * Exposes the search index abstraction via HTTP endpoints:
 * - GET /customer/search — full-text search with merchandising
 * - GET /customer/search/autocomplete — autocomplete suggestions
 * - GET /business/search/merchandising — list merchandising rules
 * - POST /business/search/merchandising — create merchandising rule
 * - PUT /business/search/merchandising/:ruleId — update rule
 * - DELETE /business/search/merchandising/:ruleId — delete rule
 * - GET /business/search/manual-order/:categoryId — get manual order
 * - PUT /business/search/manual-order/:categoryId — set manual order
 * - DELETE /business/search/manual-order/:categoryId — delete manual order
 */

import type { HttpRequest, HttpResponse } from '../http';
import { logger } from '../logger';
import { getSearchAdapter, isSearchAdapterConfigured } from './types';
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
import type { SearchQuery } from './types';

class SearchController {
  /**
   * GET /customer/search
   * Full-text search with filters, facets, and merchandising
   */
  async search(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (!isSearchAdapterConfigured()) {
      res.status(503).json({ success: false, error: 'Search service not available' });
      return;
    }

    const adapter = getSearchAdapter();
    const searchQuery = parseSearchQuery(req);
    await this.applyMerchandising(searchQuery, req.query.sortBy as string | undefined);

    try {
      const result = await adapter.search(searchQuery);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Search request failed', { error: (error as Error).message });
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  }

  private async applyMerchandising(searchQuery: SearchQuery, sortBy: string | undefined): Promise<void> {
    // Load merchandising rules for this search context
    const merchandising = await getMerchandisingRules(searchQuery.query, searchQuery.categoryId);
    if (Object.keys(merchandising).length > 0) {
      searchQuery.merchandising = merchandising;
    }

    // Load manual ordering for category
    if (searchQuery.categoryId && (!sortBy || sortBy === 'manual')) {
      const manualOrder = await getCategoryManualOrder(searchQuery.categoryId);
      if (manualOrder) {
        searchQuery.manualOrdering = manualOrder;
        searchQuery.sortBy = 'manual';
      }
    }
  }

  /**
   * GET /customer/search/autocomplete
   * Autocomplete suggestions for partial query
   */
  async autocomplete(req: HttpRequest, res: HttpResponse): Promise<void> {
    if (!isSearchAdapterConfigured()) {
      res.status(503).json({ success: false, error: 'Search service not available' });
      return;
    }

    const { q, query, limit } = req.query;
    const searchTerm = (q || query) as string;

    if (!searchTerm || searchTerm.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const adapter = getSearchAdapter();
    const suggestions = await adapter.autocomplete(searchTerm, limit ? parseInt(limit as string, 10) : 10);
    res.json({ success: true, data: suggestions });
  }

  // =========================================================================
  // Merchandising Admin
  // =========================================================================

  async listMerchandisingRules(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { ruleType, categoryId, isActive } = req.query;
    const rules = await listMerchandisingRules({
      ruleType: ruleType as string,
      categoryId: categoryId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    res.json({ success: true, data: rules });
  }

  async createMerchandisingRule(
    req: HttpRequest<
      Record<string, never>,
      Record<string, never>,
      {
        ruleType: 'boost' | 'bury' | 'pin';
        productId: string;
        position?: number;
        searchTerm?: string;
        categoryId?: string;
        isActive?: boolean;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    const { ruleType, productId, position, searchTerm, categoryId, isActive } = req.body;
    const rule = await createMerchandisingRule({
      ruleType,
      productId,
      position,
      searchTerm,
      categoryId,
      isActive: isActive ?? true,
    });
    res.status(201).json({ success: true, data: rule });
  }

  async updateMerchandisingRule(
    req: HttpRequest<
      { ruleId: string },
      Record<string, never>,
      Partial<{
        ruleType: 'boost' | 'bury' | 'pin';
        productId: string;
        position: number;
        searchTerm: string;
        categoryId: string;
        isActive: boolean;
      }>
    >,
    res: HttpResponse,
  ): Promise<void> {
    const { ruleId } = req.params;
    const rule = await updateMerchandisingRule(ruleId, req.body);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  }

  async deleteMerchandisingRule(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { ruleId } = req.params;
    await deleteMerchandisingRule(ruleId);
    res.json({ success: true });
  }

  // =========================================================================
  // Category Manual Ordering Admin
  // =========================================================================

  async getCategoryManualOrder(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { categoryId } = req.params;
    const orders = await getCategoryManualOrderList(categoryId);
    res.json({ success: true, data: orders });
  }

  async setCategoryManualOrder(
    req: HttpRequest<{ categoryId: string }, Record<string, never>, { productIds: string[] }>,
    res: HttpResponse,
  ): Promise<void> {
    const { categoryId } = req.params;
    const { productIds } = req.body;
    await setCategoryManualOrder(categoryId, productIds);
    res.json({ success: true });
  }

  async deleteCategoryManualOrder(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { categoryId } = req.params;
    await deleteCategoryManualOrder(categoryId);
    res.json({ success: true });
  }

  // =========================================================================
  // Search Health
  // =========================================================================

  async health(_req: HttpRequest, res: HttpResponse): Promise<void> {
    if (!isSearchAdapterConfigured()) {
      res.json({ healthy: false, details: { error: 'No search adapter configured' } });
      return;
    }
    const adapter = getSearchAdapter();
    const result = await adapter.health();
    res.json(result);
  }
}

function boolParam(value: unknown): boolean | undefined {
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

function intParam(value: unknown): number | undefined {
  return value ? parseInt(value as string, 10) : undefined;
}

// Parse attribute filters — accepts a JSON string or an already-parsed array.
function parseAttributes(attributes: unknown): SearchQuery['attributes'] {
  if (!attributes) return undefined;
  try {
    return (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) as SearchQuery['attributes'];
  } catch {
    return undefined;
  }
}

function parseSearchQuery(req: HttpRequest): SearchQuery {
  const {
    q,
    query,
    categoryId,
    categoryIds,
    productTypeId,
    minPriceCents,
    maxPriceCents,
    status,
    visibility,
    isFeatured,
    isNew,
    isBestseller,
    hasVariants,
    inStock,
    attributes,
    sortBy,
    sortOrder,
    page,
    limit,
    includeFacets,
  } = req.query;

  return {
    query: (q || query) as string,
    categoryId: categoryId as string,
    categoryIds: categoryIds ? (categoryIds as string).split(',') : undefined,
    productTypeId: productTypeId as string,
    minPriceCents: intParam(minPriceCents),
    maxPriceCents: intParam(maxPriceCents),
    status: status as string,
    visibility: visibility as string,
    isFeatured: boolParam(isFeatured),
    isNew: boolParam(isNew),
    isBestseller: boolParam(isBestseller),
    hasVariants: boolParam(hasVariants),
    inStock: boolParam(inStock),
    attributes: parseAttributes(attributes),
    sortBy: sortBy as SearchQuery['sortBy'],
    sortOrder: sortOrder as SearchQuery['sortOrder'],
    page: intParam(page) ?? 1,
    limit: intParam(limit) ?? 20,
    includeFacets: includeFacets === 'true',
  };
}

export default new SearchController();
