import { jsonResponse } from 'libs/apiResponse';
/**
 * Store Customer Router
 *
 * Public-facing routes for browsing stores and pickup locations.
 */

import { createHttpRouter } from 'libs/http';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode } from '../../../../libs/errors';
import { manageStoresAdminUseCase, resolveMarketContextUseCase } from '../../application/useCases/wired';
import { ResolveMarketContextCommand } from '../../application/useCases/ResolveMarketContext';
const router = createHttpRouter();

router.get('/stores', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const stores = await manageStoresAdminUseCase.findAll();
    jsonResponse(res, 200, { data: stores });
  } catch {
    jsonResponse(res, 500, { error: 'Failed to list stores' });
  }
});

// Resolve the market context for this hostname (+ optional currency/locale overrides)
router.get('/markets/context', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const context = await resolveMarketContextUseCase.execute(
      new ResolveMarketContextCommand(
        req.hostname,
        req.query.currency as string | undefined,
        req.query.locale as string | undefined,
      ),
    );
    jsonResponse(res, 200, { data: context });
  } catch (error) {
    jsonResponse(res, getErrorStatusCode(error), {
      error: error instanceof Error ? error.message : 'Failed to resolve market context',
    });
  }
});

// Explicit market selection for the storefront market switcher
router.get('/markets/:marketId/context', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const context = await resolveMarketContextUseCase.executeForMarket(req.params.marketId);
    jsonResponse(res, 200, { data: context });
  } catch (error) {
    jsonResponse(res, getErrorStatusCode(error), {
      error: error instanceof Error ? error.message : 'Failed to resolve market context',
    });
  }
});

router.get('/stores/:storeId', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const store = await manageStoresAdminUseCase.findById(req.params.storeId);
    if (!store) {
      return jsonResponse(res, 404, { error: 'Store not found' });
    }
    jsonResponse(res, 200, { data: store });
  } catch {
    jsonResponse(res, 500, { error: 'Failed to get store' });
  }
});

export const storeCustomerRouter = router;
export default router;
