/**
 * TaxEnginePort — Specialist Tax Engine Domain Port
 *
 * The contract between commerce orchestration (`checkout`, `order`) and the
 * tax specialist service. Implementations: `InternalRuleTaxEngine`
 * (infrastructure, backed by the taxRate/nexus/VAT-registration tables) or an
 * external provider adapter (Avalara/TaxJar) — swap at the composition root.
 */

import type { TaxDecision } from '../entities/TaxDecision';

/** An address carrying at minimum a country for jurisdiction resolution. */
export interface TaxPartyAddress {
  country: string;
  region?: string;
  state?: string;
  postalCode?: string;
  city?: string;
}

/** A taxable line — the facts the engine prices tax on. */
export interface TaxTransactionLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  taxCategoryId?: string;
  taxable?: boolean;
}

/** The full transaction fact set for a tax quote. */
export interface TaxTransactionContext {
  /** Seller organization and contracting entity. */
  sellerOrganizationId?: string;
  sellerEntityId?: string;
  /** Buyer: id and type (B2C vs B2B drives reverse charge). */
  buyerCustomerId?: string;
  buyerType?: 'B2C' | 'B2B';
  /** Customer VAT registration (intra-EU B2B reverse charge). */
  vatNumber?: string;
  /** Origin — where goods ship from (per fulfillment group). */
  shipFromAddress?: TaxPartyAddress;
  /** Destination — where goods ship to (drives most tax). */
  shipToAddress: TaxPartyAddress;
  /** Billing — digital goods VAT uses this when shipping is absent. */
  billToAddress?: TaxPartyAddress;
  /** Selling market + channel context. */
  marketId?: string;
  channelId?: string;
  /** Transaction currency (minor units below are in this currency). */
  currencyCode?: string;
  /** Whether line prices already include tax. */
  pricesIncludeTax: boolean;
  /** Incoterms for cross-border duty/tax responsibility (DDP/DDU/…). */
  incoterms?: string;
  /** When the transaction occurs — for historical rate lookup. */
  transactionTimestamp?: Date;
  /** Shipping charge, taxed at the default destination rate. */
  shippingAmountCents?: number;
  lines: TaxTransactionLine[];
}

/**
 * Calculate an explainable tax quote for a transaction.
 * Implementations must be pure w.r.t. their inputs — the same context must
 * always produce the same `TaxDecision` (versioned).
 */
export interface TaxEnginePort {
  calculateQuote(context: TaxTransactionContext): Promise<TaxDecision>;
}
