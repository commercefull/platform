import type { WebhookEvent } from '../../infrastructure/services/GatewayAdapter';

/**
 * Gateway Webhook Port
 *
 * Provider-specific webhook mechanics (signature verification, payload
 * normalization) exposed to the interface layer without letting controllers
 * reach into infrastructure adapter registries.
 */
export interface GatewayWebhookPort {
  verifySignature(provider: string, rawBody: Buffer, headers: Record<string, string | undefined>, secret: string): boolean;
  normalize(provider: string, payload: Record<string, unknown>): WebhookEvent | null;
}
