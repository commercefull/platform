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
import { ConvertPriceUseCase } from './ConvertPrice';

export interface CalculatePriceInput extends PriceContext {
  productId: string;
  /** Explicit price list to apply (merchant quote/preview tooling). */
  priceListId?: string;
  /** Reserved for channel-scoped pricing (accepted, not yet evaluated). */
  channelId?: string;
  /** Reserved for store-scoped pricing (accepted, not yet evaluated). */
  storeId?: string;
}

export class CalculatePriceUseCase {
  constructor(
    private readonly currencyCatalog: CurrencyCatalogPort,
    private readonly pricingData: PricingDataQueryPort,
    private readonly pricingRules: PricingRuleQueryPort,
    private readonly membershipBenefits: MembershipBenefitsPort,
    private readonly loyaltyBalance: LoyaltyBalancePort,
    private readonly convertPrice: ConvertPriceUseCase,
  ) {}

  async execute(input: CalculatePriceInput): Promise<PricingResult> {
    const { productId, priceListId } = input;
    const context: PriceContext = input;
    const {
      variantId,
      customerId,
      customerGroupIds = [],
      quantity = 1,
      currencyCode,
      categoryIds = [],
      additionalData = {},
      excludeRuleIds = [],
    } = context;

    // Step 1: Resolve the base price (cents) from the pricing-owned store.
    // Prefer a row in the requested/default currency; fall back to any
    // currency and convert below.
    const defaultCurrency = await this.currencyCatalog.getDefault();
    const requestedCurrency = currencyCode || defaultCurrency?.code || 'USD';

    const basePrice =
      (await this.pricingData.findEffectiveBasePrice(productId, variantId, requestedCurrency)) ||
      (await this.pricingData.findEffectiveBasePrice(productId, variantId));

    if (!basePrice) {
      throw new PricingValidationError(`No base price for product: ${productId}${variantId ? ` variant: ${variantId}` : ''}`);
    }

    // originalPrice stays in the row's native currency; currentPrice is in
    // the requested currency once conversion runs. A sale price overrides the
    // list price as the effective starting point.
    const originalPrice = basePrice.priceCents;
    let currentPrice = basePrice.salePriceCents ?? originalPrice;
    let priceCurrency = basePrice.currencyCode;
    let originalCurrency: string | undefined;
    const appliedRules: PricingResult['appliedRules'] = [];

    // Handle currency conversion if the requested currency differs
    if (requestedCurrency !== priceCurrency) {
      const { convertedPriceCents, appliedRules: currencyRules } = await this.convertPrice.execute({
        priceCents: currentPrice,
        fromCurrencyCode: priceCurrency,
        toCurrencyCode: requestedCurrency,
      });

      currentPrice = convertedPriceCents;
      originalCurrency = priceCurrency;
      priceCurrency = requestedCurrency;

      appliedRules.push(...currencyRules);
    }

    // Step 2: Apply an explicit price list override when given
    // (merchant quote tooling — FIXED/OVERRIDE entries are absolute cents)
    if (priceListId) {
      const priceListItem = await this.pricingData.findPriceListItem(priceListId, productId, variantId);

      if (priceListItem) {
        const previousPrice = currentPrice;
        currentPrice = priceListItem.priceCents;

        appliedRules.push({
          ruleId: priceListId,
          ruleName: `Price List (${priceListId})`,
          adjustmentType: PricingAdjustmentType.OVERRIDE,
          adjustmentValue: priceListItem.priceCents,
          impact: previousPrice - currentPrice,
        });
      }
    }

    // Step 3: Apply tier pricing (quantity discounts)
    if (quantity > 1) {
      const tierPrice = await this.pricingData.findApplicableTier(productId, quantity, variantId, customerGroupIds[0]);

      if (tierPrice) {
        const previousPrice = currentPrice;
        currentPrice = tierPrice.priceCents;

        appliedRules.push({
          ruleId: tierPrice.id,
          ruleName: `Tier Pricing (${tierPrice.quantityMin}+ units)`,
          adjustmentType: PricingAdjustmentType.OVERRIDE,
          adjustmentValue: tierPrice.priceCents,
          impact: previousPrice - currentPrice,
        });
      }
    }

    // Step 4: Apply customer-specific pricing
    if (customerId) {
      // Find price lists applicable to this customer
      const priceLists = await this.pricingData.findPriceListsForCustomer(customerId, customerGroupIds);

      if (priceLists.length > 0) {
        const priceListIds = priceLists.map(list => list.id);

        // Find prices for this product in applicable price lists
        const customerPrices = await this.pricingData.findPricesForProduct(productId, variantId, priceListIds);

        if (customerPrices.length > 0) {
          // Apply the first applicable price (already sorted by priority)
          const customerPrice = customerPrices[0];
          const previousPrice = currentPrice;

          // Apply the price adjustment based on its type
          // (amount operands are stored in major units — convert to cents)
          if (customerPrice.adjustmentType === PricingAdjustmentType.FIXED) {
            currentPrice = Math.round(customerPrice.adjustmentValue * 100);
          } else if (customerPrice.adjustmentType === PricingAdjustmentType.PERCENTAGE) {
            currentPrice = Math.round(currentPrice * (1 - customerPrice.adjustmentValue / 100));
          } else if (customerPrice.adjustmentType === PricingAdjustmentType.OVERRIDE) {
            currentPrice = Math.round(customerPrice.adjustmentValue * 100);
          }

          // Find the price list name for the rule description
          const priceList = priceLists.find(list => list.id === customerPrice.priceListId);

          appliedRules.push({
            ruleId: customerPrice.id,
            ruleName: `Customer Price (${priceList?.name || 'Custom'})`,
            adjustmentType: customerPrice.adjustmentType,
            adjustmentValue: customerPrice.adjustmentValue,
            impact: previousPrice - currentPrice,
          });
        }
      }
    }

    // Step 5: Apply dynamic pricing rules
    const applicableRules = (
      await this.pricingRules.findActiveRules(productId, categoryIds[0], customerId, customerGroupIds)
    ).filter(rule => !excludeRuleIds.includes(rule.id ?? rule.pricingRuleId ?? ''));

    // Sort rules by priority (descending) to apply highest priority rules first
    const sortedRules = [...applicableRules].sort((a, b) => b.priority - a.priority);

    // Apply each rule in order
    for (const rule of sortedRules) {
      // Check if the rule conditions are met
      if (isRuleApplicable(rule, context)) {
        const previousPrice = currentPrice;
        const { priceCents, applied } = applyAdjustments(currentPrice, rule.adjustments);
        currentPrice = priceCents;

        if (applied) {
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            adjustmentType: rule.adjustments[0]?.type || PricingAdjustmentType.FIXED,
            adjustmentValue: rule.adjustments[0]?.value || 0,
            impact: previousPrice - currentPrice,
          });
        }
      }
    }

    // Step 6: Apply membership benefits if applicable
    if (customerId) {
      try {
        const membershipBenefits = await this.membershipBenefits.getDiscountBenefits(customerId);

        if (membershipBenefits.length > 0) {
          // Apply the best membership discount
          const bestDiscount = membershipBenefits.reduce(
            (best, current) => (current.discountPercentage > best.discountPercentage ? current : best),
            membershipBenefits[0],
          );

          const previousPrice = currentPrice;
          currentPrice = Math.round(currentPrice * (1 - bestDiscount.discountPercentage / 100));

          appliedRules.push({
            ruleId: bestDiscount.id,
            ruleName: `Membership: ${bestDiscount.name}`,
            adjustmentType: PricingAdjustmentType.PERCENTAGE,
            adjustmentValue: bestDiscount.discountPercentage,
            impact: previousPrice - currentPrice,
          });
        }
      } catch (error: unknown) {
        logger.warn('Membership benefits lookup failed for pricing calculation', { customerId, error: (error as Error).message });
      }
    }

    // Step 7: Apply loyalty points discount if applicable
    if (customerId && additionalData.applyLoyaltyDiscount) {
      try {
        const currentPoints = await this.loyaltyBalance.getCustomerPoints(customerId);

        // Default points-to-money ratio (e.g., 100 points = $1 → 1 cent/point)
        // This should ideally come from a configuration or settings
        const pointsToMoneyRatio = (additionalData.pointsToMoneyRatio as number) || 0.01;

        const pointsToApply = (additionalData.loyaltyPointsToApply as number) || 0;

        // Make sure customer has enough points
        if (pointsToApply > 0 && pointsToApply <= currentPoints) {
          const pointsValueCents = Math.round(pointsToApply * pointsToMoneyRatio * 100);
          const previousPrice = currentPrice;

          // Don't go below zero
          currentPrice = Math.max(0, currentPrice - pointsValueCents);

          appliedRules.push({
            ruleId: 'loyalty_points',
            ruleName: `Loyalty Points (${pointsToApply} points)`,
            adjustmentType: PricingAdjustmentType.FIXED,
            adjustmentValue: pointsValueCents,
            impact: previousPrice - currentPrice,
          });

          // Note: We're not actually deducting points here
          // This should happen during checkout/order processing
        }
      } catch (error: unknown) {
        logger.warn('Loyalty balance lookup failed for pricing calculation', { customerId, error: (error as Error).message });
      }
    }

    // Ensure price isn't negative (cents are already integer)
    currentPrice = Math.max(0, Math.round(currentPrice));

    return {
      originalPriceCents: originalPrice,
      finalPriceCents: currentPrice,
      appliedRules,
      currency: priceCurrency,
      originalCurrency,
      exchangeRate: originalCurrency ? currentPrice / originalPrice : undefined,
    };
  }
}
