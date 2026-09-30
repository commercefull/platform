import { redirectResponse, renderResponse } from "libs/apiResponse";
/**
 * Recommendation Controller for Admin Hub
 * Rules, exclusions, stats and per-product suggestions — calls the
 * recommendation use cases directly (web → modules).
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { moduleRegistry } from '../../../../libs/moduleRegistry';
import type { RecommendationRuleProps } from '../../domain/entities/RecommendationRule';
import {
  getRecommendationStatsUseCase,
  manageRecommendationRulesUseCase,
  manageRecommendationExclusionsUseCase,
  listProductSuggestionsUseCase,
  recommendationCatalogPort,
} from '../../application/useCases/wired';

const enabled = () => moduleRegistry.isEnabled('recommendation');

const orgIdFrom = (req: HttpRequest): string =>
  (req.query.organizationId as string) || ((req.body as HttpRequestBody)?.organizationId as string) || '';

const backToDashboard = (req: HttpRequest, res: HttpResponse, params: string) => {
  const org = orgIdFrom(req);
  redirectResponse(res, `/admin/recommendations${org ? `?organizationId=${encodeURIComponent(org)}&${params}` : `?${params}`}`);
};

// ============================================================================
// Dashboard — stats + rules + exclusions for one organization
// ============================================================================

export const recommendationsDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = orgIdFrom(req);
  const data: Record<string, unknown> = {
    pageName: 'Recommendations',
    moduleEnabled: enabled(),
    organizationId,
    stats: null,
    rules: [],
    exclusions: [],
    success: req.query.success || null,
    error: req.query.error || null,
  };

  if (organizationId && enabled()) {
    const [stats, rules, exclusions] = await Promise.all([
      getRecommendationStatsUseCase.execute({ organizationId, storeId: null }).catch(() => null),
      manageRecommendationRulesUseCase.list(organizationId).catch(() => []),
      manageRecommendationExclusionsUseCase.list(organizationId).catch(() => []),
    ]);
    data.stats = stats;
    data.rules = rules;
    data.exclusions = exclusions;
  }

  adminRespond(req, res, 'recommendations/index', data);
};

// ============================================================================
// Rules
// ============================================================================

export const createRecommendationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      name?: string;
      sourceType?: RecommendationRuleProps['sourceType'];
      sourceId?: string;
      targetType?: RecommendationRuleProps['targetType'];
      targetId?: string;
      relationType?: string;
      targetSort?: RecommendationRuleProps['targetSort'];
      priceBand?: RecommendationRuleProps['priceBand'];
      maxItems?: string;
      priority?: string;
    };
    await manageRecommendationRulesUseCase.create(orgIdFrom(req), {
      name: body.name,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      targetType: body.targetType,
      targetId: body.targetId,
      relationType: body.relationType,
      targetSort: body.targetSort,
      priceBand: body.priceBand,
      maxItems: body.maxItems ? parseInt(body.maxItems, 10) : undefined,
      priority: body.priority ? parseInt(body.priority, 10) : 0,
    });
    backToDashboard(req, res, 'success=' + encodeURIComponent('Rule created'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    backToDashboard(req, res, 'error=' + encodeURIComponent((error as Error).message || 'Failed to create rule'));
  }
};

export const deleteRecommendationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageRecommendationRulesUseCase.delete(orgIdFrom(req), req.params.ruleId);
    backToDashboard(req, res, 'success=' + encodeURIComponent('Rule deleted'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    backToDashboard(req, res, 'error=' + encodeURIComponent((error as Error).message || 'Failed to delete rule'));
  }
};

// ============================================================================
// Exclusions
// ============================================================================

export const createRecommendationExclusion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as { productId?: string; excludedProductId?: string; scope?: string; reason?: string };
    await manageRecommendationExclusionsUseCase.create(orgIdFrom(req), {
      productId: body.productId || undefined,
      excludedProductId: body.excludedProductId,
      scope: body.scope,
      reason: body.reason,
    });
    backToDashboard(req, res, 'success=' + encodeURIComponent('Exclusion created'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    backToDashboard(req, res, 'error=' + encodeURIComponent((error as Error).message || 'Failed to create exclusion'));
  }
};

export const deleteRecommendationExclusion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageRecommendationExclusionsUseCase.delete(orgIdFrom(req), req.params.exclusionId);
    backToDashboard(req, res, 'success=' + encodeURIComponent('Exclusion deleted'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    backToDashboard(req, res, 'error=' + encodeURIComponent((error as Error).message || 'Failed to delete exclusion'));
  }
};

// ============================================================================
// Per-product suggestions (partial + accept/hide on the product editor)
// ============================================================================

/** Resolve the owning org of a product via the catalog port. */
const productOrg = async (productId: string): Promise<string | null> => {
  const cards = await recommendationCatalogPort.getCards([productId]).catch(() => []);
  return cards[0]?.organizationId ?? null;
};

export const productSuggestionsPartial = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  if (!enabled()) {
    renderResponse(res, 'admin/views/recommendations/partials/suggestions', { suggestions: [], productId, moduleEnabled: false });
    return;
  }
  const organizationId = await productOrg(productId);
  const suggestions = organizationId ? await listProductSuggestionsUseCase.list(organizationId, productId).catch(() => []) : [];
  renderResponse(res, 'admin/views/recommendations/partials/suggestions', { suggestions, productId, moduleEnabled: true });
};

export const acceptProductSuggestion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId, candidateProductId } = req.params;
  try {
    const organizationId = await productOrg(productId);
    if (!organizationId) throw new Error('Product not found');
    const relationType = (req.body as { relationType?: string })?.relationType || 'related';
    await listProductSuggestionsUseCase.accept(organizationId, productId, candidateProductId, relationType);
    redirectResponse(res, `/admin/products/${productId}/edit?success=` + encodeURIComponent('Suggestion accepted'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(res, `/admin/products/${productId}/edit?error=` + encodeURIComponent((error as Error).message || 'Failed to accept suggestion'));
  }
};

export const hideProductSuggestion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId, candidateProductId } = req.params;
  try {
    const organizationId = await productOrg(productId);
    if (!organizationId) throw new Error('Product not found');
    await listProductSuggestionsUseCase.hide(organizationId, productId, candidateProductId);
    redirectResponse(res, `/admin/products/${productId}/edit?success=` + encodeURIComponent('Suggestion hidden'));
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(res, `/admin/products/${productId}/edit?error=` + encodeURIComponent((error as Error).message || 'Failed to hide suggestion'));
  }
};
