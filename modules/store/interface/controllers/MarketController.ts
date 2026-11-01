import { jsonResponse } from '../../../../libs/apiResponse';
import { AppError, getErrorStatusCode } from '../../../../libs/errors';
import type { HttpRequest, HttpResponse } from '../../../../libs/http';
import { logger } from '../../../../libs/logger';
import {
  evaluateMarketReadinessUseCase,
  launchMarketUseCase,
  manageMarketsUseCase,
} from '../../application/useCases/wired';
import {
  CreateMarketCommand,
  DeleteMarketCommand,
  EvaluateMarketReadinessCommand,
  GetMarketCommand,
  LaunchMarketCommand,
  ListMarketsCommand,
  SetMarketStatusCommand,
  UpdateMarketCommand,
  type MarketWriteData,
} from '../../application/useCases';
import type { MarketStatus } from '../../domain/entities/Market';

function organizationId(req: HttpRequest): string | undefined {
  return req.user?.organizationId || req.user?.id;
}

function handleError(res: HttpResponse, error: unknown): void {
  logger.error('Market request failed', error);
  jsonResponse(res, getErrorStatusCode(error), {
    success: false,
    message: error instanceof Error ? error.message : 'Market request failed',
    ...(error instanceof AppError ? { code: error.code } : {}),
  });
}

export async function listMarkets(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const status = req.query.status as MarketStatus | undefined;
    const countryCode = req.query.countryCode as string | undefined;
    const storeId = req.query.storeId as string | undefined;
    const markets = await manageMarketsUseCase.list(
      new ListMarketsCommand({ status, countryCode, storeId, organizationId: organizationId(req) }),
    );
    jsonResponse(res, 200, { success: true, data: markets });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const market = await manageMarketsUseCase.create(
      new CreateMarketCommand(ownerId, req.body as MarketWriteData),
    );
    jsonResponse(res, 201, { success: true, data: market });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const market = await manageMarketsUseCase.get(new GetMarketCommand(req.params.marketId));
    jsonResponse(res, 200, { success: true, data: market });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const market = await manageMarketsUseCase.update(
      new UpdateMarketCommand(req.params.marketId, req.body as Partial<MarketWriteData>),
    );
    jsonResponse(res, 200, { success: true, data: market });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    await manageMarketsUseCase.delete(new DeleteMarketCommand(req.params.marketId));
    jsonResponse(res, 200, { success: true });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getMarketReadiness(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const report = await evaluateMarketReadinessUseCase.execute(
      new EvaluateMarketReadinessCommand(req.params.marketId),
    );
    jsonResponse(res, 200, { success: true, data: report });
  } catch (error) {
    handleError(res, error);
  }
}

export async function launchMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const result = await launchMarketUseCase.execute(new LaunchMarketCommand(req.params.marketId));
    jsonResponse(res, 200, { success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

export async function disableMarket(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const market = await manageMarketsUseCase.disable(
      new SetMarketStatusCommand(req.params.marketId, 'disable'),
    );
    jsonResponse(res, 200, { success: true, data: market });
  } catch (error) {
    handleError(res, error);
  }
}
