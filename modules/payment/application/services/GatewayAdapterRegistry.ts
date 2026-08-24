/**
 * Gateway Adapter Registry
 *
 * Maps provider slugs (as stored in the `paymentGateway` table) to their adapters.
 * Add a new provider by importing its adapter and registering it here.
 */

import { GatewayAdapter, PSPAdapter } from './GatewayAdapter';
import { StripeAdapter } from './adapters/StripeAdapter';
import { AdyenAdapter } from './adapters/AdyenAdapter';
import { GenericAdapter } from './adapters/GenericAdapter';
import { PayPalAdapter } from './adapters/PayPalAdapter';
import { KlarnaAdapter } from './adapters/KlarnaAdapter';
import { ApplePayAdapter } from './adapters/ApplePayAdapter';
import { AffirmAdapter } from './adapters/AffirmAdapter';

const adapters: GatewayAdapter[] = [
  new StripeAdapter(),
  new AdyenAdapter(),
  new GenericAdapter(),
  new PayPalAdapter(),
  new KlarnaAdapter(),
  new ApplePayAdapter(),
  new AffirmAdapter(),
];

const registry = new Map<string, GatewayAdapter>(adapters.map(a => [a.provider, a]));

const fallback = new GenericAdapter();

/**
 * Resolve the adapter for a given provider slug.
 * Falls back to GenericAdapter for unknown providers.
 */
export function getAdapter(provider: string): GatewayAdapter {
  return registry.get(provider.toLowerCase()) ?? fallback;
}

/**
 * Resolve a PSP adapter (full payment operations) for a given provider slug.
 * Returns null if the provider only supports webhooks (e.g. GenericAdapter).
 */
export function getPSPAdapter(provider: string): PSPAdapter | null {
  const adapter = registry.get(provider.toLowerCase());
  if (adapter && 'initiatePayment' in adapter) {
    return adapter as PSPAdapter;
  }
  return null;
}

/**
 * Get all registered PSP adapters (for failover routing).
 */
export function getAllPSPAdapters(): PSPAdapter[] {
  return adapters.filter((a): a is PSPAdapter => 'initiatePayment' in a) as PSPAdapter[];
}

/**
 * List all registered provider slugs.
 */
export function listProviders(): string[] {
  return Array.from(registry.keys());
}

