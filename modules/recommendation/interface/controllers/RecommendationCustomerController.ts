/**
 * Recommendation Customer Controller — public placement serving
 * (spec §11.1). Store context comes from the request (store resolution
 * middleware on the storefront; for headless callers it may be absent —
 * scope then falls back to tenant-wide).
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { getRecommendationsUseCase } from '../../application/useCases/wired';
import { GetRecommendationsCommand, type RecommendationContext } from '../../application/useCases/GetRecommendations';

function contextFrom(req: HttpRequest, res: HttpResponse): RecommendationContext {
  const locals = res.locals as { storeId?: string; organizationId?: string; currency?: string };
  return {
    organizationId: locals.organizationId,
    storeId: locals.storeId,
    currencyCode: locals.currency,
  };
}

/** GET /recommendation/products/:productId?placement=&limit= */
export const getProductRecommendations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { productId } = req.params;
    const { placement = 'pdpAlsoLike', limit } = req.query;
    const result = await getRecommendationsUseCase.execute(
      new GetRecommendationsCommand(
        placement as string,
        [productId],
        contextFrom(req, res),
        limit ? parseInt(limit as string, 10) : undefined,
      ),
    );
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/** POST /recommendation/products { productIds[], placement, limit } — headless */
export const postProductRecommendations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as { productIds?: string[]; placement?: string; limit?: number };
    if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
      errorResponse(res, 'productIds must be a non-empty array', 400);
      return;
    }
    const result = await getRecommendationsUseCase.execute(
      new GetRecommendationsCommand(body.placement ?? 'cartAddOns', body.productIds, contextFrom(req, res), body.limit),
    );
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/** GET /recommendation/popular?categoryId=&limit= — emptyState source */
export const getPopular = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { categoryId, limit } = req.query;
    const ctx = { ...contextFrom(req, res), categoryId: (categoryId as string) || undefined };
    const result = await getRecommendationsUseCase.execute(
      new GetRecommendationsCommand('emptyState', [], ctx, limit ? parseInt(limit as string, 10) : undefined),
    );
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};
