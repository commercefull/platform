/**
 * Shared test utilities for recommendation use-case tests.
 * Mocks module boundaries (eventBus, libs/db, logger, cache) once and
 * provides typed lazy port mocks + record factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client?: unknown) => Promise<unknown>) => fn()),
}));

jest.mock('../../../libs/cache', () => ({
  createCache: () => ({
    kind: 'memory',
    get: jest.fn(),
    set: jest.fn(),
    getOrSet: jest.fn(async (_key: string, loader: () => Promise<unknown>) => loader()),
    del: jest.fn(),
    clear: jest.fn(),
  }),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const queryMock = jest.mocked(query);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

// ============================================================================
// Record factories
// ============================================================================

import type { CatalogFeatureRow, ManualLink, RecommendationCard } from '../application/ports/CatalogPort';
import type { RecommendationCandidateProps } from '../domain/entities/RecommendationCandidate';

export const ORG_ID = 'org-1';

export function createCard(overrides: Partial<RecommendationCard> = {}): RecommendationCard {
  return {
    productId: 'cand-1',
    name: 'Candidate Product',
    slug: 'candidate-product',
    status: 'active',
    visibility: 'visible',
    organizationId: ORG_ID,
    effectivePriceCents: 1999,
    basePriceCents: 1999,
    salePriceCents: null,
    isOnSale: false,
    isFeatured: false,
    isInventoryManaged: false,
    ...overrides,
  };
}

export function createFeature(overrides: Partial<CatalogFeatureRow> = {}): CatalogFeatureRow {
  return {
    productId: 'feat-1',
    organizationId: ORG_ID,
    storeId: null,
    status: 'active',
    visibility: 'visible',
    type: 'simple',
    brandId: null,
    primaryCategoryId: null,
    secondaryCategoryIds: [],
    collectionIds: [],
    attributeValues: [],
    basePriceCents: null,
    averageRating: null,
    publishedAt: null,
    isFeatured: false,
    isBestseller: false,
    ...overrides,
  };
}

export function createCandidate(overrides: Partial<RecommendationCandidateProps> = {}): RecommendationCandidateProps {
  return {
    recommendationCandidateId: 'rc-1',
    organizationId: ORG_ID,
    storeId: null,
    productId: 'src-1',
    candidateProductId: 'cand-1',
    source: 'fbt',
    relationType: 'cross_sell',
    score: 0.4,
    reason: { support: 10, confidence: 0.4, lift: 2.1 },
    computedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createManualLink(overrides: Partial<ManualLink> = {}): ManualLink {
  return { productId: 'src-1', relatedProductId: 'cand-1', type: 'related', position: 0, ...overrides };
}
