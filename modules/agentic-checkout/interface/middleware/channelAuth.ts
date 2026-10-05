/**
 * Channel Authentication Middleware
 *
 * Machine-to-machine auth for /acp endpoints: `Authorization: Bearer <key>`
 * resolves to a channel context (integration + org + channel store) via the
 * integration module's encrypted credentials. When the channel has a signing
 * secret configured, `Signature`/`Timestamp` HMAC over the raw body is also
 * verified (same approach as the payment gateway webhook).
 */

import type { HttpRequest, HttpResponse, HttpNext } from '../../../../libs/http';
import type { ChannelResolverPort, ChannelContext } from '../../application/ports/ChannelResolverPort';
import { ChannelAuthenticationError, ChannelSignatureError } from '../../domain/errors/AgenticCheckoutErrors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      channelContext?: ChannelContext;
    }
  }
}

export function createChannelAuthMiddleware(channelResolver: ChannelResolverPort) {
  return async function channelAuth(req: HttpRequest, res: HttpResponse, next: HttpNext): Promise<void> {
    try {
      const authHeader = req.headers.authorization ?? '';
      const match = /^Bearer\s+(.+)$/i.exec(authHeader);
      if (!match) {
        throw new ChannelAuthenticationError('Missing or malformed Authorization header');
      }

      const channel = await channelResolver.resolveByApiKey(match[1].trim());
      if (!channel) {
        throw new ChannelAuthenticationError();
      }

      // Signature check only applies when the channel configured a secret —
      // resolveByApiKey already authenticated the request otherwise.
      const rawBody = Buffer.isBuffer(req.body) ? (req.body as Buffer) : Buffer.from('');
      const signatureOk = await channelResolver.verifySignature({
        integrationId: channel.integrationId,
        signature: req.headers.signature as string | undefined,
        timestamp: req.headers.timestamp as string | undefined,
        rawBody,
      });
      if (!signatureOk) {
        throw new ChannelSignatureError();
      }

      // Parse the raw JSON body now that signature verification had access to it
      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        try {
          req.body = JSON.parse(req.body.toString('utf8'));
        } catch {
          throw new ChannelAuthenticationError('Request body is not valid JSON');
        }
      }

      req.channelContext = channel;
      next();
    } catch (err) {
      next(err);
    }
  };
}
