import { GatewayWebhookPort } from '../../application/ports/GatewayWebhookPort';
import { getAdapter } from './GatewayAdapterRegistry';
import type { WebhookEvent } from './GatewayAdapter';

export class GatewayWebhookAdapter implements GatewayWebhookPort {
  verifySignature(provider: string, rawBody: Buffer, headers: Record<string, string | undefined>, secret: string): boolean {
    return getAdapter(provider).verifySignature(rawBody, headers, secret);
  }

  normalize(provider: string, payload: Record<string, unknown>): WebhookEvent | null {
    return getAdapter(provider).normalize(payload);
  }
}
