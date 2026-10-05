/**
 * CollectionRuleEvaluator (domain service)
 *
 * Translates a smart collection's `conditions` into catalog query filters
 * understood by CatalogQueryPort, and validates condition shapes.
 *
 * Conditions are AND-combined (all must match). `priceCents` splits into
 * min/max bounds via lt/lte/gt/gte operators; other fields map directly.
 */

import type { CollectionCondition, CollectionSortOrder } from '../entities/Collection';
import { CollectionValidationError } from '../errors/AssortmentErrors';

export interface CatalogQueryFilters {
  query?: string;
  categoryId?: string;
  brandId?: string;
  storeId?: string;
  priceMinCents?: number;
  priceMaxCents?: number;
  isFeatured?: boolean;
  tags?: string[];
  /** Constrain to these product ids (assortment include-list enforcement). */
  productIds?: string[];
  /** Exclude these product ids (assortment exclude/hidden enforcement). */
  excludeProductIds?: string[];
  sortOrder?: CollectionSortOrder;
}

const VALID_OPERATORS: Record<string, string[]> = {
  query: ['contains'],
  categoryId: ['equals', 'notEquals'],
  brandId: ['equals', 'notEquals'],
  tag: ['equals', 'contains'],
  priceCents: ['lt', 'lte', 'gt', 'gte'],
  isFeatured: ['equals'],
};

export function assertValidConditions(conditions: CollectionCondition[]): void {
  for (const c of conditions) {
    const ops = VALID_OPERATORS[c.field];
    if (!ops) {
      throw new CollectionValidationError(`Unknown collection condition field: ${c.field}`);
    }
    if (!ops.includes(c.operator)) {
      throw new CollectionValidationError(`Operator '${c.operator}' is not valid for field '${c.field}'`);
    }
  }
}

/**
 * Map validated conditions to CatalogQueryFilters.
 * `notEquals` exclusions are not expressible as catalog filters in v1 and are
 * skipped here — callers validate operator support via assertValidConditions.
 */
export function conditionsToFilters(conditions: CollectionCondition[]): CatalogQueryFilters {
  assertValidConditions(conditions);
  const filters: CatalogQueryFilters = {};
  const tags: string[] = [];

  for (const c of conditions) {
    switch (c.field) {
      case 'query':
        filters.query = String(c.value);
        break;
      case 'categoryId':
        if (c.operator === 'equals') filters.categoryId = String(c.value);
        break;
      case 'priceCents': {
        const cents = Number(c.value);
        if (c.operator === 'lt' || c.operator === 'lte') filters.priceMaxCents = cents;
        else filters.priceMinCents = cents;
        break;
      }
      case 'isFeatured':
        filters.isFeatured = c.value === true || c.value === 'true';
        break;
      case 'tag':
        if (c.operator !== 'notEquals') tags.push(String(c.value));
        break;
      case 'brandId':
        if (c.operator === 'equals') filters.brandId = String(c.value);
        break;
    }
  }

  if (tags.length) filters.tags = tags;
  return filters;
}
