/**
 * Agentic Checkout Controller
 *
 * ACP `checkout_sessions` endpoints — machine-to-machine, authenticated by
 * `channelAuth` middleware. Every response echoes `Request-Id` and
 * `Idempotency-Key` per the ACP request/response contract.
 */

import type { HttpRequest, HttpResponse } from '../../../../libs/http';
import { jsonResponse, setHeader } from '../../../../libs/apiResponse';
import type { ChannelContext } from '../../application/ports/ChannelResolverPort';
import { ChannelAuthenticationError, ChannelValidationError } from '../../domain/errors/AgenticCheckoutErrors';
import { CreateChannelSessionCommand } from '../../application/useCases/CreateChannelSession';
import { GetChannelSessionCommand } from '../../application/useCases/GetChannelSession';
import { UpdateChannelSessionCommand } from '../../application/useCases/UpdateChannelSession';
import { CompleteChannelSessionCommand } from '../../application/useCases/CompleteChannelSession';
import { CancelChannelSessionCommand } from '../../application/useCases/CancelChannelSession';
import { GenerateProductFeedCommand } from '../../application/useCases/GenerateProductFeed';
import {
  createChannelSessionUseCase,
  getChannelSessionUseCase,
  updateChannelSessionUseCase,
  completeChannelSessionUseCase,
  cancelChannelSessionUseCase,
  generateProductFeedUseCase,
} from '../../application/useCases/wired';
import { ACP_PROTOCOL_VERSION } from '../../application/services/CheckoutSessionTranslator';

function channel(req: HttpRequest): ChannelContext {
  const ctx = req.channelContext;
  if (!ctx) throw new ChannelAuthenticationError();
  return ctx;
}

function echoAcpHeaders(req: HttpRequest, res: HttpResponse): void {
  const requestId = req.headers['request-id'];
  if (typeof requestId === 'string') setHeader(res, 'Request-Id', requestId);
  setHeader(res, 'API-Version', ACP_PROTOCOL_VERSION);
}

/** POST /acp/checkout_sessions */
export const createCheckoutSession = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const body = req.body as Record<string, unknown>;
  const items = body.items as Array<{ id: string; quantity: number }> | undefined;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ChannelValidationError('items array is required and must not be empty');
  }
  for (const item of items) {
    if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      throw new ChannelValidationError('Each item requires an id and a quantity >= 1');
    }
  }

  const response = await createChannelSessionUseCase.execute(
    new CreateChannelSessionCommand(
      channel(req),
      items,
      body.buyer as CreateChannelSessionCommand['buyer'],
      body.fulfillment_details as CreateChannelSessionCommand['fulfillmentDetails'],
      body.affiliate_attribution as CreateChannelSessionCommand['affiliateAttribution'],
    ),
  );
  jsonResponse(res, 201, response);
};

/** GET /acp/checkout_sessions/:id */
export const getCheckoutSession = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const response = await getChannelSessionUseCase.execute(new GetChannelSessionCommand(req.params.id, channel(req).integrationId));
  jsonResponse(res, 200, response);
};

/** POST /acp/checkout_sessions/:id — update */
export const updateCheckoutSession = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const body = req.body as Record<string, unknown>;
  const response = await updateChannelSessionUseCase.execute(
    new UpdateChannelSessionCommand(
      req.params.id,
      channel(req).integrationId,
      body.items as Array<{ id: string; quantity: number }> | undefined,
      body.buyer as UpdateChannelSessionCommand['buyer'],
      body.fulfillment_details as UpdateChannelSessionCommand['fulfillmentDetails'],
      body.fulfillment_option_id as string | undefined,
      body.affiliate_attribution as UpdateChannelSessionCommand['affiliateAttribution'],
    ),
  );
  jsonResponse(res, 200, response);
};

/** POST /acp/checkout_sessions/:id/complete */
export const completeCheckoutSession = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const body = req.body as Record<string, unknown>;
  const response = await completeChannelSessionUseCase.execute(
    new CompleteChannelSessionCommand(
      req.params.id,
      channel(req).integrationId,
      body.buyer as CompleteChannelSessionCommand['buyer'],
      body.payment_data as CompleteChannelSessionCommand['paymentData'],
    ),
  );
  jsonResponse(res, 200, response);
};

/** POST /acp/checkout_sessions/:id/cancel */
export const cancelCheckoutSession = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const response = await cancelChannelSessionUseCase.execute(new CancelChannelSessionCommand(req.params.id, channel(req).integrationId));
  jsonResponse(res, 200, response);
};

/** GET /acp/feed — ACP product feed for the channel's store assortment */
export const getProductFeed = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  echoAcpHeaders(req, res);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const feed = await generateProductFeedUseCase.execute(new GenerateProductFeedCommand(channel(req), baseUrl));
  jsonResponse(res, 200, feed);
};
