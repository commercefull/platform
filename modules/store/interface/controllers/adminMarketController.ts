import { redirectResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';
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
import type { MarketStatus, MarketTaxDisplayMode } from '../../domain/entities/Market';

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function bodyToWriteData(body: HttpRequestBody): MarketWriteData {
  const capabilities: Record<string, boolean> = {};
  const rawCapabilities = body['capabilities'];
  if (typeof rawCapabilities === 'string' && rawCapabilities.trim()) {
    for (const entry of rawCapabilities.split(',')) {
      const [key, val] = entry.split(':').map(s => s.trim());
      if (key) capabilities[key] = val !== 'false';
    }
  }
  let metadata: Record<string, unknown> | undefined;
  if (typeof body['metadata'] === 'string' && body['metadata'].trim()) {
    try {
      metadata = JSON.parse(body['metadata'] as string) as Record<string, unknown>;
    } catch {
      metadata = undefined;
    }
  }
  return {
    storeId: (body['storeId'] as string) || undefined,
    code: String(body['code'] ?? '').trim(),
    name: String(body['name'] ?? '').trim(),
    countryCodes: parseList(body['countryCodes']).map(c => c.toUpperCase()),
    defaultCurrencyCode: ((body['defaultCurrencyCode'] as string) || '').toUpperCase() || undefined,
    supportedCurrencyCodes: parseList(body['supportedCurrencyCodes']).map(c => c.toUpperCase()),
    defaultLocaleCode: (body['defaultLocaleCode'] as string) || undefined,
    supportedLocaleCodes: parseList(body['supportedLocaleCodes']),
    catalogAssortmentId: (body['catalogAssortmentId'] as string) || undefined,
    defaultPriceListId: (body['defaultPriceListId'] as string) || undefined,
    contractingEntityId: (body['contractingEntityId'] as string) || undefined,
    taxDisplayMode: ((body['taxDisplayMode'] as MarketTaxDisplayMode) || 'exclusive_tax') as MarketTaxDisplayMode,
    allowDynamicFxConversion: body['allowDynamicFxConversion'] === 'true' || body['allowDynamicFxConversion'] === 'on',
    capabilities,
    allowedPaymentMethods: parseList(body['allowedPaymentMethods']),
    allowedFulfillmentMethods: parseList(body['allowedFulfillmentMethods']),
    hostnamePatterns: parseList(body['hostnamePatterns']).map(h => h.toLowerCase()),
    metadata,
  };
}

function organizationId(req: HttpRequest): string {
  return (req.user?.organizationId || req.user?.id || '') as string;
}

export const adminListMarkets = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const status = req.query.status as MarketStatus | undefined;
  const markets = await manageMarketsUseCase.list(
    new ListMarketsCommand({ status, organizationId: organizationId(req) || undefined }),
  );
  adminRespond(req, res, 'markets/index', {
    pageName: 'Markets',
    markets,
    filters: { status: status || '' },
  });
};

export const adminViewMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const marketId = req.params.marketId;
    const [market, readiness] = await Promise.all([
      manageMarketsUseCase.get(new GetMarketCommand(marketId)),
      evaluateMarketReadinessUseCase.execute(new EvaluateMarketReadinessCommand(marketId)).catch(err => {
        logger.warn('Market readiness evaluation failed', { marketId, error: err });
        return null;
      }),
    ]);
    adminRespond(req, res, 'markets/view', {
      pageName: `Market — ${market.name}`,
      market,
      readiness,
    });
  } catch {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Market not found' });
  }
};

export const adminCreateMarketForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'markets/form', {
    pageName: 'Create Market',
    market: null,
    formData: {},
  });
};

export const adminEditMarketForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const market = await manageMarketsUseCase.get(new GetMarketCommand(req.params.marketId));
    adminRespond(req, res, 'markets/form', {
      pageName: `Edit Market — ${market.name}`,
      market,
      formData: market,
    });
  } catch {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Market not found' });
  }
};

export const adminCreateMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  try {
    const market = await manageMarketsUseCase.create(
      new CreateMarketCommand(organizationId(req), bodyToWriteData(body)),
    );
    redirectResponse(res, `/admin/markets/${market.marketId}?success=Market created successfully`);
  } catch (error) {
    logger.error('Failed to create market', error);
    adminRespond(req, res, 'markets/form', {
      pageName: 'Create Market',
      market: null,
      formData: body,
      error: error instanceof Error ? error.message : 'Failed to create market',
    });
  }
};

export const adminUpdateMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const marketId = req.params.marketId;
  try {
    await manageMarketsUseCase.update(new UpdateMarketCommand(marketId, bodyToWriteData(body)));
    redirectResponse(res, `/admin/markets/${marketId}?success=Market updated successfully`);
  } catch (error) {
    logger.error('Failed to update market', error);
    adminRespond(req, res, 'markets/form', {
      pageName: 'Edit Market',
      market: null,
      formData: body,
      error: error instanceof Error ? error.message : 'Failed to update market',
    });
  }
};

export const adminDeleteMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageMarketsUseCase.delete(new DeleteMarketCommand(req.params.marketId));
    redirectResponse(res, '/admin/markets?success=Market deleted');
  } catch (error) {
    logger.error('Failed to delete market', error);
    redirectResponse(res, `/admin/markets?error=${encodeURIComponent(error instanceof Error ? error.message : 'Delete failed')}`);
  }
};

export const adminLaunchMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const marketId = req.params.marketId;
  try {
    await launchMarketUseCase.execute(new LaunchMarketCommand(marketId));
    redirectResponse(res, `/admin/markets/${marketId}?success=Market launched`);
  } catch (error) {
    logger.error('Failed to launch market', error);
    redirectResponse(res, `/admin/markets/${marketId}?error=${encodeURIComponent(error instanceof Error ? error.message : 'Launch failed')}`);
  }
};

export const adminDisableMarket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const marketId = req.params.marketId;
  try {
    await manageMarketsUseCase.disable(new SetMarketStatusCommand(marketId, 'disable'));
    redirectResponse(res, `/admin/markets/${marketId}?success=Market disabled`);
  } catch (error) {
    logger.error('Failed to disable market', error);
    redirectResponse(res, `/admin/markets/${marketId}?error=${encodeURIComponent(error instanceof Error ? error.message : 'Disable failed')}`);
  }
};
