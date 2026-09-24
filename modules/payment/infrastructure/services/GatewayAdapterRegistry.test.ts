import { getAdapter } from './GatewayAdapterRegistry';
import { StripeAdapter } from './adapters/StripeAdapter';
import { AdyenAdapter } from './adapters/AdyenAdapter';
import { GenericAdapter } from './adapters/GenericAdapter';

describe('GatewayAdapterRegistry', () => {
  it('should return StripeAdapter for "stripe"', () => {
    const adapter = getAdapter('stripe');
    expect(adapter).toBeInstanceOf(StripeAdapter);
  });

  it('should return AdyenAdapter for "adyen"', () => {
    const adapter = getAdapter('adyen');
    expect(adapter).toBeInstanceOf(AdyenAdapter);
  });

  it('should return GenericAdapter for "generic"', () => {
    const adapter = getAdapter('generic');
    expect(adapter).toBeInstanceOf(GenericAdapter);
  });

  it('should return GenericAdapter as fallback for unknown provider', () => {
    const adapter = getAdapter('unknown_provider');
    expect(adapter).toBeInstanceOf(GenericAdapter);
  });

  it('should be case-insensitive', () => {
    const adapter = getAdapter('STRIPE');
    expect(adapter).toBeInstanceOf(StripeAdapter);
  });
});
