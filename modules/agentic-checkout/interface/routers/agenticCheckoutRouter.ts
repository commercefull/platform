/**
 * Agentic Checkout Router — mounted at /acp
 *
 * Machine-to-machine ACP endpoints. `express.raw` preserves the body Buffer
 * for `Signature` HMAC verification; `channelAuth` resolves the Bearer key
 * to the channel context; `idempotency` enforces ACP `Idempotency-Key`
 * semantics on all POSTs.
 */

import { createHttpRouter, httpRaw } from 'libs/http';
import type { HttpRequest, HttpResponse, HttpNext } from '../../../../libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { createChannelAuthMiddleware } from '../middleware/channelAuth';
import { createIdempotencyMiddleware } from '../middleware/idempotency';
import {
  createCheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
  completeCheckoutSession,
  cancelCheckoutSession,
  getProductFeed,
} from '../controllers/AgenticCheckoutController';
import { agenticCheckoutPorts, idempotencyRepository } from '../../application/useCases/wired';

const router = createHttpRouter();

router.use(httpRaw({ type: 'application/json' }));

const channelAuth = createChannelAuthMiddleware(agenticCheckoutPorts.channelResolver);
const idempotency = createIdempotencyMiddleware(idempotencyRepository);

router.use(channelAuth);
router.use(
  asyncHandler(async (req: HttpRequest, res: HttpResponse, next: HttpNext) => {
    if (req.method === 'POST') {
      await idempotency(req, res, next);
      return;
    }
    next();
  }),
);

router.post('/checkout_sessions', asyncHandler(createCheckoutSession));
router.get('/checkout_sessions/:id', asyncHandler(getCheckoutSession));
router.post('/checkout_sessions/:id', asyncHandler(updateCheckoutSession));
router.post('/checkout_sessions/:id/complete', asyncHandler(completeCheckoutSession));
router.post('/checkout_sessions/:id/cancel', asyncHandler(cancelCheckoutSession));
router.get('/feed', asyncHandler(getProductFeed));

export default router;
