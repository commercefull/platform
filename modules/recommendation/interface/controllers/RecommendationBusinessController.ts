/**
 * Recommendation Business Controller — merchant rules, exclusions,
 * suggestions, preview, rebuild, stats (spec §11.2).
 * All routes are behind isOrganizationLoggedIn; organizationId comes from
 * the authenticated principal.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import {
  getRecommendationsUseCase,
  getRecommendationStatsUseCase,
  listProductSuggestionsUseCase,
  manageRecommendationExclusionsUseCase,
  manageRecommendationRulesUseCase,
  rebuildRecommendationsUseCase,
} from '../../application/useCases/wired';
import { GetRecommendationsCommand } from '../../application/useCases/GetRecommendations';

function orgId(req: HttpRequest): string {
  const user = req.user as { organizationId?: string; id?: string } | undefined;
  return user?.organizationId ?? user?.id ?? '';
}

// ── Suggestions (§8.2) ──────────────────────────────────────────────

export const listSuggestions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const suggestions = await listProductSuggestionsUseCase.list(orgId(req), req.params.productId);
    successResponse(res, { suggestions });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const acceptSuggestion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { candidateProductId, relationType } = req.body as { candidateProductId?: string; relationType?: string };
    if (!candidateProductId || !relationType) {
      errorResponse(res, 'candidateProductId and relationType are required', 400);
      return;
    }
    await listProductSuggestionsUseCase.accept(orgId(req), req.params.productId, candidateProductId, relationType);
    successResponse(res, { accepted: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const hideSuggestion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { candidateProductId, global: globalScope } = req.body as { candidateProductId?: string; global?: boolean };
    if (!candidateProductId) {
      errorResponse(res, 'candidateProductId is required', 400);
      return;
    }
    if (globalScope) {
      await listProductSuggestionsUseCase.hideGlobally(orgId(req), candidateProductId);
    } else {
      await listProductSuggestionsUseCase.hide(orgId(req), req.params.productId, candidateProductId);
    }
    successResponse(res, { hidden: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ── Preview (what the storefront would render) ──────────────────────

export const previewPlacement = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { placement = 'pdpAlsoLike', limit } = req.query;
    const result = await getRecommendationsUseCase.execute(
      new GetRecommendationsCommand(
        placement as string,
        [req.params.productId],
        { organizationId: orgId(req) },
        limit ? parseInt(limit as string, 10) : undefined,
      ),
    );
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ── Rules ───────────────────────────────────────────────────────────

export const listRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    successResponse(res, { rules: await manageRecommendationRulesUseCase.list(orgId(req)) });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const createRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const rule = await manageRecommendationRulesUseCase.create(
      orgId(req),
      req.body as Parameters<typeof manageRecommendationRulesUseCase.create>[1],
    );
    successResponse(res, rule, 201);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const rule = await manageRecommendationRulesUseCase.update(
      orgId(req),
      req.params.ruleId,
      req.body as Parameters<typeof manageRecommendationRulesUseCase.update>[2],
    );
    successResponse(res, rule);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageRecommendationRulesUseCase.delete(orgId(req), req.params.ruleId);
    successResponse(res, { deleted: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ── Exclusions ──────────────────────────────────────────────────────

export const listExclusions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    successResponse(res, { exclusions: await manageRecommendationExclusionsUseCase.list(orgId(req)) });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const createExclusion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const exclusion = await manageRecommendationExclusionsUseCase.create(
      orgId(req),
      req.body as Parameters<typeof manageRecommendationExclusionsUseCase.create>[1],
    );
    successResponse(res, exclusion, 201);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteExclusion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageRecommendationExclusionsUseCase.delete(orgId(req), req.params.exclusionId);
    successResponse(res, { deleted: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ── Rebuild + stats ─────────────────────────────────────────────────

export const rebuild = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const result = await rebuildRecommendationsUseCase.execute({ organizationId: orgId(req) });
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const getStats = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const stats = await getRecommendationStatsUseCase.execute({ organizationId: orgId(req), storeId: null });
    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};
