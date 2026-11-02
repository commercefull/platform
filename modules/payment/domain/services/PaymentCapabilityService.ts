/**
 * PaymentCapabilityService — Payment Method / Route Capability Resolution
 *
 * Single domain service that answers "can this payment method/PSP route
 * serve this transaction?" — currency, amount (minor units), country, and
 * market/channel eligibility. Used by `GetPaymentMethodsUseCase` (what to
 * offer) and `RoutePaymentUseCase` (what can actually execute).
 *
 * Replaces scattered inline country/currency checks so adding a market is a
 * data change to gateway/config capability rows, not a code change.
 */

/** The transaction facts a method/route is checked against. */
export interface PaymentEligibilityContext {
  /** Transaction currency (ISO 4217, upper-cased internally). */
  currency?: string;
  /** Transaction amount in currency minor units. */
  amountCents?: number;
  /** Buyer/destination country (ISO-2). */
  country?: string;
  /** Selling market — future market-scoped capability filtering. */
  marketId?: string;
  /** Sales channel — future channel-scoped capability filtering. */
  channelId?: string;
}

/** The capability surface shared by gateway configs and PSP routes. */
export interface PaymentMethodCapabilities {
  isActive: boolean;
  minAmountCents?: number;
  maxAmountCents?: number;
  supportedCurrencies?: string[];
  supportedCountries?: string[];
}

export interface PaymentEligibilityResult {
  eligible: boolean;
  /** Machine-readable failure reason for decision logs. */
  reasonCode?:
    'ELIGIBLE' | 'INACTIVE' | 'CURRENCY_NOT_SUPPORTED' | 'AMOUNT_BELOW_MINIMUM' | 'AMOUNT_ABOVE_MAXIMUM' | 'COUNTRY_NOT_SUPPORTED';
}

export class PaymentCapabilityService {
  /**
   * Whether a method/route can serve a transaction. An empty capability
   * list means "unrestricted" (backward compatible with configs that never
   * declared capabilities).
   */
  checkEligibility(capabilities: PaymentMethodCapabilities, context: PaymentEligibilityContext): PaymentEligibilityResult {
    if (!capabilities.isActive) return { eligible: false, reasonCode: 'INACTIVE' };

    if (
      context.currency &&
      capabilities.supportedCurrencies &&
      capabilities.supportedCurrencies.length > 0 &&
      !capabilities.supportedCurrencies.includes(context.currency.toUpperCase())
    ) {
      return { eligible: false, reasonCode: 'CURRENCY_NOT_SUPPORTED' };
    }

    if (context.amountCents !== undefined) {
      if (capabilities.minAmountCents !== undefined && context.amountCents < capabilities.minAmountCents) {
        return { eligible: false, reasonCode: 'AMOUNT_BELOW_MINIMUM' };
      }
      if (capabilities.maxAmountCents !== undefined && context.amountCents > capabilities.maxAmountCents) {
        return { eligible: false, reasonCode: 'AMOUNT_ABOVE_MAXIMUM' };
      }
    }

    if (
      context.country &&
      capabilities.supportedCountries &&
      capabilities.supportedCountries.length > 0 &&
      !capabilities.supportedCountries.includes(context.country.toUpperCase())
    ) {
      return { eligible: false, reasonCode: 'COUNTRY_NOT_SUPPORTED' };
    }

    return { eligible: true, reasonCode: 'ELIGIBLE' };
  }
}
