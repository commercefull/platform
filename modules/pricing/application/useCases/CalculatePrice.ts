/**
 * CalculatePrice Use Case
 *
 * Calculates the price for a product or variant based on applicable rules
 * and context — the full pricing pipeline: catalog base price (sale price
 * wins as the starting point), currency conversion, explicit price-list
 * override, tier pricing, customer price lists, dynamic pricing rules,
 * membership benefits, and loyalty points.
 *
 * All amounts are integer cents. Base prices come from the pricing-owned
 * productBasePrice table — a variant-level row wins over the product-level
 * row. Rule operands (adjustment values) are stored in major units and
 * converted to cents at application time.
 */

import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import { PricingDataQueryPort } from '../../domain/repositories/PricingDataQueryRepository';
import { PricingRuleQueryPort } from '../../domain/repositories/PricingRuleQueryRepository';
import { applyAdjustments, isRuleApplicable } from '../../domain/services/PricingRuleEvaluator';
import { PriceContext, PricingAdjustmentType, PricingResult } from '../../domain/pricingRule';
import { MembershipBenefitsPort } from '../ports/MembershipBenefitsPort';
import { LoyaltyBalancePort } from '../ports/LoyaltyBalancePort';
import { PricingValidationError } from '../../domain/errors/PricingErrors';
import { logger } from '../../../../libs/logger';
import { toMinorUnits } from '../../../../libs/money';
import { ConvertPriceUseCase } from './ConvertPrice';

export interface CalculatePriceInput extends PriceContext {
  productId: string;
  /** Explicit price list to apply (merchant quote/preview tooling). */
  priceListId?: string;
  channelId?: string;
  storeId?: string;
}
export interface CalculatePriceUseCaseDeps {
  currencyCatalog: CurrencyCatalogPort;
  pricingData: PricingDataQueryPort;
  pricingRules: PricingRuleQueryPort;
  membershipBenefits: MembershipBenefitsPort;
  loyaltyBalance: LoyaltyBalancePort;
  convertPrice: ConvertPriceUseCase;
}

interface PricePipelineState {
  currentPrice: number;
  priceCurrency: string;
  originalCurrency?: string;
  appliedRules: PricingResult['appliedRules'];
}

export class CalculatePriceUseCase {
  constructor(private readonly deps: CalculatePriceUseCaseDeps) {}

  async execute(input: CalculatePriceInput): Promise<PricingResult> {
    const context: PriceContext = input;

    const { basePrice, requestedCurrency } = await this.resolveBasePrice(input);

    // originalPrice stays in the row's native currency; currentPrice is in
    // the requested currency once conversion runs. A sale price overrides the
    // list price as the effective starting point.
    const state: PricePipelineState = {
      currentPrice: basePrice.salePriceCents ?? basePrice.priceCents,
      priceCurrency: basePrice.currencyCode,
      appliedRules: [],
    };

    const resolvedPriceListId = input.priceListId ?? input.marketPriceListId;
    const resolvedFromPriceList = await this.applyPriceListOverride(state, input, basePrice.currencyCode, requestedCurrency);
    await this.applyCurrencyConversion(state, input, requestedCurrency, resolvedFromPriceList);
    await this.applyTierPricing(state, context, input.productId);
    await this.applyCustomerPricing(state, context, input.productId);
    await this.applyDynamicRules(state, context, input.productId);
    await this.applyMembershipBenefits(state, context);
    await this.applyLoyaltyDiscount(state, context);

    // Ensure price isn't negative (cents are already integer)
    state.currentPrice = Math.max(0, Math.round(state.currentPrice));

    return {
      originalPriceCents: basePrice.priceCents,
      finalPriceCents: state.currentPrice,
      appliedRules: state.appliedRules,
      currency: state.priceCurrency,
      originalCurrency: state.originalCurrency,
      exchangeRate: state.originalCurrency ? state.currentPrice / basePrice.priceCents : undefined,
      priceListId: resolvedPriceListId,
    };
  }

  // Step 1: Resolve the base price (cents) from the pricing-owned store.
  // Prefer a row in the requested/default currency; fall back to any
  // currency and convert below.
  private async resolveBasePrice(input: CalculatePriceInput) {
    const { productId, variantId, currencyCode } = input;

    const defaultCurrency = await this.deps.currencyCatalog.getDefault();
    const requestedCurrency = currencyCode || defaultCurrency?.code || 'USD';

    const basePrice =
      (await this.deps.pricingData.findEffectiveBasePrice(productId, variantId, requestedCurrency)) ||
      (await this.deps.pricingData.findEffectiveBasePrice(productId, variantId));

    if (!basePrice) {
      throw new PricingValidationError(`No base price for product: ${productId}${variantId ? ` variant: ${variantId}` : ''}`);
    }

    return { basePrice, requestedCurrency };
  }

  // A market's default price list (or an explicit merchant price list) is
  // authoritative for the market and is checked BEFORE any dynamic FX
  // conversion — deterministic precedence: price list > FX.
  private async applyPriceListOverride(
    state: PricePipelineState,
    input: CalculatePriceInput,
    basePriceCurrency: string,
    requestedCurrency: string,
  ): Promise<boolean> {
    const resolvedPriceListId = input.priceListId ?? input.marketPriceListId;
    if (!resolvedPriceListId) return false;

    const priceListItem = await this.deps.pricingData.findPriceListItem(resolvedPriceListId, input.productId, input.variantId);
    if (!priceListItem) return false;

    const previousPrice = state.currentPrice;
    state.currentPrice = priceListItem.priceCents;
    // Price list prices are expressed in the market's default currency
    // (or the requested currency for explicit merchant overrides), so the
    // resolved price is already in the target currency.
    state.priceCurrency = requestedCurrency;
    if (state.priceCurrency !== basePriceCurrency) {
      state.originalCurrency = basePriceCurrency;
    }

    state.appliedRules.push({
      ruleId: resolvedPriceListId,
      ruleName: `Price List (${resolvedPriceListId})`,
      adjustmentType: PricingAdjustmentType.OVERRIDE,
      adjustmentValue: priceListItem.priceCents,
      impact: previousPrice - state.currentPrice,
    });
    return true;
  }

  // Handle currency conversion only when the market permits dynamic FX and
  // no price list already resolved the price in the requested currency.
  private async applyCurrencyConversion(
    state: PricePipelineState,
    input: CalculatePriceInput,
    requestedCurrency: string,
    resolvedFromPriceList: boolean,
  ): Promise<void> {
    const fxAllowed = input.allowDynamicFxConversion !== false;
    if (resolvedFromPriceList || requestedCurrency === state.priceCurrency || !fxAllowed) return;

    const { convertedPriceCents, appliedRules: currencyRules } = await this.deps.convertPrice.execute({
      priceCents: state.currentPrice,
      fromCurrencyCode: state.priceCurrency,
      toCurrencyCode: requestedCurrency,
    });

    state.originalCurrency = state.priceCurrency;
    state.currentPrice = convertedPriceCents;
    state.priceCurrency = requestedCurrency;

    state.appliedRules.push(...currencyRules);
  }

  // Step 3: Apply tier pricing (quantity discounts)
  private async applyTierPricing(state: PricePipelineState, context: PriceContext, productId: string): Promise<void> {
    const { variantId, customerGroupIds = [], quantity = 1 } = context;
    if (quantity <= 1) return;

    const tierPrice = await this.deps.pricingData.findApplicableTier(productId, quantity, variantId, customerGroupIds[0]);
    if (!tierPrice) return;

    const previousPrice = state.currentPrice;
    state.currentPrice = tierPrice.priceCents;

    state.appliedRules.push({
      ruleId: tierPrice.id,
      ruleName: `Tier Pricing (${tierPrice.quantityMin}+ units)`,
      adjustmentType: PricingAdjustmentType.OVERRIDE,
      adjustmentValue: tierPrice.priceCents,
      impact: previousPrice - state.currentPrice,
    });
  }

  // Step 4: Apply customer-specific pricing
  private async applyCustomerPricing(state: PricePipelineState, context: PriceContext, productId: string): Promise<void> {
    const { variantId, customerId, customerGroupIds = [] } = context;
    if (!customerId) return;

    // Find price lists applicable to this customer
    const priceLists = await this.deps.pricingData.findPriceListsForCustomer(customerId, customerGroupIds);
    if (priceLists.length === 0) return;

    const priceListIds = priceLists.map(list => list.id);

    // Find prices for this product in applicable price lists
    const customerPrices = await this.deps.pricingData.findPricesForProduct(productId, variantId, priceListIds);
    if (customerPrices.length === 0) return;

    // Apply the first applicable price (already sorted by priority)
    const customerPrice = customerPrices[0];
    const previousPrice = state.currentPrice;

    // Apply the price adjustment based on its type
    // (amount operands are stored in major units — convert to minor units)
    if (customerPrice.adjustmentType === PricingAdjustmentType.FIXED) {
      state.currentPrice = toMinorUnits(customerPrice.adjustmentValue, state.priceCurrency);
    } else if (customerPrice.adjustmentType === PricingAdjustmentType.PERCENTAGE) {
      state.currentPrice = Math.round(state.currentPrice * (1 - customerPrice.adjustmentValue / 100));
    } else if (customerPrice.adjustmentType === PricingAdjustmentType.OVERRIDE) {
      state.currentPrice = toMinorUnits(customerPrice.adjustmentValue, state.priceCurrency);
    }

    // Find the price list name for the rule description
    const priceList = priceLists.find(list => list.id === customerPrice.priceListId);

    state.appliedRules.push({
      ruleId: customerPrice.id,
      ruleName: `Customer Price (${priceList?.name || 'Custom'})`,
      adjustmentType: customerPrice.adjustmentType,
      adjustmentValue: customerPrice.adjustmentValue,
      impact: previousPrice - state.currentPrice,
    });
  }

  // Step 5: Apply dynamic pricing rules
  private async applyDynamicRules(state: PricePipelineState, context: PriceContext, productId: string): Promise<void> {
    const { customerId, customerGroupIds = [], categoryIds = [], excludeRuleIds = [] } = context;

    const applicableRules = (await this.deps.pricingRules.findActiveRules(productId, categoryIds[0], customerId, customerGroupIds)).filter(
      rule => !excludeRuleIds.includes(rule.id ?? rule.pricingRuleId ?? ''),
    );

    // Sort rules by priority (descending) to apply highest priority rules first
    const sortedRules = [...applicableRules].sort((a, b) => b.priority - a.priority);

    // Apply each rule in order
    for (const rule of sortedRules) {
      // Check if the rule conditions are met
      if (isRuleApplicable(rule, context)) {
        const previousPrice = state.currentPrice;
        const { priceCents, applied } = applyAdjustments(state.currentPrice, rule.adjustments, state.priceCurrency);
        state.currentPrice = priceCents;

        if (applied) {
          state.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            adjustmentType: rule.adjustments[0]?.type || PricingAdjustmentType.FIXED,
            adjustmentValue: rule.adjustments[0]?.value || 0,
            impact: previousPrice - state.currentPrice,
          });
        }
      }
    }
  }

  // Step 6: Apply membership benefits if applicable
  private async applyMembershipBenefits(state: PricePipelineState, context: PriceContext): Promise<void> {
    const { customerId } = context;
    if (!customerId) return;

    try {
      const membershipBenefits = await this.deps.membershipBenefits.getDiscountBenefits(customerId, {
        storeId: context.storeId,
        channelId: context.channelId,
        currencyCode: context.currencyCode,
        countryCode: context.regionCode,
      });

      if (membershipBenefits.length === 0) return;

      // Apply the best membership discount
      const bestDiscount = membershipBenefits.reduce(
        (best, current) => (current.discountPercentage > best.discountPercentage ? current : best),
        membershipBenefits[0],
      );

      const previousPrice = state.currentPrice;
      state.currentPrice = Math.round(state.currentPrice * (1 - bestDiscount.discountPercentage / 100));

      state.appliedRules.push({
        ruleId: bestDiscount.id,
        ruleName: `Membership: ${bestDiscount.name}`,
        adjustmentType: PricingAdjustmentType.PERCENTAGE,
        adjustmentValue: bestDiscount.discountPercentage,
        impact: previousPrice - state.currentPrice,
      });
    } catch (error: unknown) {
      logger.warn('Membership benefits lookup failed for pricing calculation', { customerId, error: (error as Error).message });
    }
  }

  // Step 7: Apply loyalty points discount if applicable
  private async applyLoyaltyDiscount(state: PricePipelineState, context: PriceContext): Promise<void> {
    const { customerId, additionalData = {} } = context;
    if (!customerId || !additionalData.applyLoyaltyDiscount) return;

    try {
      const currentPoints = await this.deps.loyaltyBalance.getCustomerPoints(customerId);

      // Default points-to-money ratio (e.g., 100 points = $1 → 1 cent/point)
      // This should ideally come from a configuration or settings
      const pointsToMoneyRatio = (additionalData.pointsToMoneyRatio as number) || 0.01;

      const pointsToApply = (additionalData.loyaltyPointsToApply as number) || 0;

      // Make sure customer has enough points
      if (pointsToApply <= 0 || pointsToApply > currentPoints) return;

      const pointsValueCents = toMinorUnits(pointsToApply * pointsToMoneyRatio, state.priceCurrency);
      const previousPrice = state.currentPrice;

      // Don't go below zero
      state.currentPrice = Math.max(0, state.currentPrice - pointsValueCents);

      state.appliedRules.push({
        ruleId: 'loyalty_points',
        ruleName: `Loyalty Points (${pointsToApply} points)`,
        adjustmentType: PricingAdjustmentType.FIXED,
        adjustmentValue: pointsValueCents,
        impact: previousPrice - state.currentPrice,
      });

      // Note: We're not actually deducting points here
      // This should happen during checkout/order processing
    } catch (error: unknown) {
      logger.warn('Loyalty balance lookup failed for pricing calculation', { customerId, error: (error as Error).message });
    }
  }
}
