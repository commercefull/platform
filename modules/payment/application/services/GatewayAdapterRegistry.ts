/**
 * Gateway Adapter Registry
 *
 * Maps provider slugs (as stored in the `paymentGateway` table) to their adapters.
 * Add a new provider by importing its adapter and registering it here.
 */

import { GatewayAdapter } from './GatewayAdapter';
import { StripeAdapter } from './adapters/StripeAdapter';
import { AdyenAdapter } from './adapters/AdyenAdapter';
import { GenericAdapter } from './adapters/GenericAdapter';

const adapters: GatewayAdapter[] = [new StripeAdapter(), new AdyenAdapter(), new GenericAdapter()];

const registry = new Map<string, GatewayAdapter>(adapters.map(a => [a.provider, a]));

const fallback = new GenericAdapter();

/**
 * Resolve the adapter for a given provider slug.
 * Falls back to GenericAdapter for unknown providers.
 */
export function getAdapter(provider: string): GatewayAdapter {
  return registry.get(provider.toLowerCase()) ?? fallback;
}
