import pricingRuleRepository from '../infrastructure/repositories/PricingRuleRepository';
import pricingDataRepository from '../infrastructure/repositories/PricingDataRepository';
import currencyRepository from '../infrastructure/repositories/CurrencyRepository';
import { PriceContext, PricingAdjustmentType, PricingResult, PricingRule, PricingRuleScope } from '../domain/pricingRule';

import { Currency, formatCurrency } from '../domain/currency';
import { ProductPriceDataPort } from '../application/ports/ProductPriceDataPort';
import { MembershipBenefitsPort } from '../application/ports/MembershipBenefitsPort';
import { LoyaltyBalancePort } from '../application/ports/LoyaltyBalancePort';
import { ProductPriceDataAdapter } from '../infrastructure/acl/ProductPriceDataAdapter';
import { MembershipBenefitsAdapter } from '../infrastructure/acl/MembershipBenefitsAdapter';
import { LoyaltyBalanceAdapter } from '../infrastructure/acl/LoyaltyBalanceAdapter';
import { logger } from '../../../libs/logger';
import {
  CurrencyNotFoundError,
  PricingValidationError,
  PricingRuleNotFoundError,
} from '../domain/errors/PricingErrors';

// Interface for pricing rule impact calculations
export interface PricingRuleImpact {
  beforeRule: PricingResult;
  afterRule: PricingResult;
  impact: number;
  percentageImpact: number;
}

export class PricingService {
  // Store cache of currencies to avoid frequent DB lookups
  private currencyCache: Map<string, Currency> = new Map();
  private defaultCurrencyCode: string | null = null;

  // ACL ports
  private readonly productPriceDataPort: ProductPriceDataPort;
  private readonly membershipBenefitsPort: MembershipBenefitsPort;
  private readonly loyaltyBalancePort: LoyaltyBalancePort;

  constructor(
    productPriceDataPort?: ProductPriceDataPort,
    membershipBenefitsPort?: MembershipBenefitsPort,
    loyaltyBalancePort?: LoyaltyBalancePort,
  ) {
    this.productPriceDataPort = productPriceDataPort ?? new ProductPriceDataAdapter();
    this.membershipBenefitsPort = membershipBenefitsPort ?? new MembershipBenefitsAdapter();
    this.loyaltyBalancePort = loyaltyBalancePort ?? new LoyaltyBalanceAdapter();
  }

  /**
   * Get currency by code, with caching
   */
  async getCurrency(code: string): Promise<Currency | null> {
    // Check cache first
    if (this.currencyCache.has(code)) {
      return this.currencyCache.get(code) || null;
    }

    // Get from database
    const currency = await currencyRepository.currencies.getCurrencyByCode(code);

    // Cache the result
    if (currency) {
      this.currencyCache.set(code, currency);
    }

    return currency;
  }

  /**
   * Get default currency, with caching
   */
  async getDefaultCurrency(): Promise<Currency | null> {
    // If we have a cached default code, get that currency
    if (this.defaultCurrencyCode) {
      return this.getCurrency(this.defaultCurrencyCode);
    }

    // Otherwise get from database
    const defaultCurrency = await currencyRepository.currencies.getDefaultCurrency();

    // Cache for future use
    if (defaultCurrency) {
      this.defaultCurrencyCode = defaultCurrency.code;
      this.currencyCache.set(defaultCurrency.code, defaultCurrency);
    }

    return defaultCurrency;
  }

  /**
   * Convert price between currencies
   */
  async convertPrice(
    price: number,
    fromCurrencyCode: string,
    toCurrencyCode: string,
  ): Promise<{
    convertedPrice: number;
    exchangeRate: number;
    appliedRules: PricingResult['appliedRules'];
  }> {
    // If currencies are the same, no conversion needed
    if (fromCurrencyCode === toCurrencyCode) {
      return {
        convertedPrice: price,
        exchangeRate: 1,
        appliedRules: [],
      };
    }

    // Get both currencies
    const fromCurrency = await this.getCurrency(fromCurrencyCode);
    const toCurrency = await this.getCurrency(toCurrencyCode);

    if (!fromCurrency || !toCurrency) {
      throw new CurrencyNotFoundError(!fromCurrency ? fromCurrencyCode : toCurrencyCode);
    }

    // Find applicable currency price rules
    const currencyRules = await pricingRuleRepository.currencyPriceRules.findByCurrencyCode(toCurrencyCode, true);
    let appliedRules: PricingResult['appliedRules'] = [];

    // If we have currency-specific rules, apply them
    if (currencyRules && currencyRules.length > 0) {
      // Sort rules by priority (highest first)
      const sortedRules = currencyRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Apply the first matching rule
      for (const rule of sortedRules) {
        // Check if the rule applies to the current price
        if (
          (rule.minOrderValue === undefined || price >= rule.minOrderValue) &&
          (rule.maxOrderValue === undefined || price <= rule.maxOrderValue)
        ) {
          // Apply the rule
          const adjustment = rule.adjustments[0];

          if (adjustment) {
            // Use basic exchange rate as starting point
            let exchangeRate = (toCurrency.exchangeRate ?? 1) / (fromCurrency.exchangeRate ?? 1);
            let convertedPrice = price * exchangeRate;

            // Apply the adjustment
            if (adjustment.type === PricingAdjustmentType.FIXED) {
              convertedPrice += adjustment.value;
            } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
              convertedPrice *= 1 + adjustment.value / 100;
            } else if (adjustment.type === PricingAdjustmentType.EXCHANGE) {
              // Override the exchange rate
              exchangeRate = adjustment.value;
              convertedPrice = price * exchangeRate;
            }

            appliedRules.push({
              ruleId: rule.id,
              ruleName: rule.name || `Currency conversion to ${toCurrency.code}`,
              adjustmentType: adjustment.type,
              adjustmentValue: adjustment.value,
              impact: price * exchangeRate - convertedPrice,
            });

            return { convertedPrice, exchangeRate, appliedRules };
          }
        }
      }
    }

    // No special rules, just use the standard exchange rate
    const exchangeRate = (toCurrency.exchangeRate ?? 1) / (fromCurrency.exchangeRate ?? 1);
    const convertedPrice = price * exchangeRate;

    return { convertedPrice, exchangeRate, appliedRules };
  }
  /**
   * Calculate the price for a product or variant based on applicable rules and context
   */
  async calculatePrice(productId: string, context: PriceContext = {}): Promise<PricingResult> {
    const {
      variantId,
      customerId,
      customerGroupIds = [],
      quantity = 1,
      date: _date = new Date(),
      cartTotal: _cartTotal = 0,
      currencyCode,
      regionCode: _regionCode,
      additionalData = {},
    } = context;

    // Step 1: Get the base product and variant information
    const product = await this.productPriceDataPort.findProductById(productId);
    if (!product) {
      throw new PricingValidationError(`Product not found with ID: ${productId}`);
    }

    let variant;

    // If a specific variant is requested, use it
    if (variantId) {
      variant = await this.productPriceDataPort.findVariantById(variantId);
      if (!variant) {
        throw new PricingValidationError(`Variant not found with ID: ${variantId}`);
      }
    }
    // Otherwise, use the master variant
    else {
      variant = await this.productPriceDataPort.findDefaultVariantForProduct(productId);
      if (!variant) {
        throw new PricingValidationError(`No default variant found for product: ${productId}`);
      }
    }

    // Initialize the pricing result with original and final price
    const originalPrice = variant.price;
    let currentPrice = originalPrice;
    const appliedRules: PricingResult['appliedRules'] = [];

    // Get default currency if none specified
    let priceCurrency = 'USD'; // Fallback
    let originalCurrency: string | undefined;

    // Handle currency conversion if requested
    if (currencyCode) {
      // Get the default product currency (could be stored with the product/variant)
      const defaultCurrency = await this.getDefaultCurrency();
      priceCurrency = defaultCurrency?.code || 'USD';

      // Only convert if the requested currency is different
      if (currencyCode !== priceCurrency) {
        const {
          convertedPrice,
          exchangeRate: _exchangeRate,
          appliedRules: currencyRules,
        } = await this.convertPrice(currentPrice, priceCurrency, currencyCode);

        // Update price and track original currency
        currentPrice = convertedPrice;
        originalCurrency = priceCurrency;
        priceCurrency = currencyCode;

        // Add currency conversion rules
        appliedRules.push(...currencyRules);
      }
    }

    // Step 2: Apply tier pricing (quantity discounts)
    if (quantity > 1) {
      const tierPrice = await pricingDataRepository.tierPrices.findApplicableTier(productId, quantity, variantId, customerGroupIds[0]);

      if (tierPrice) {
        const previousPrice = currentPrice;
        currentPrice = tierPrice.price;

        appliedRules.push({
          ruleId: tierPrice.id,
          ruleName: `Tier Pricing (${tierPrice.quantityMin}+ units)`,
          adjustmentType: PricingAdjustmentType.OVERRIDE,
          adjustmentValue: tierPrice.price,
          impact: previousPrice - currentPrice,
        });
      }
    }

    // Step 3: Apply customer-specific pricing
    if (customerId) {
      // Find price lists applicable to this customer
      const priceLists = await pricingDataRepository.customerPrices.findPriceListsForCustomer(customerId, customerGroupIds);

      if (priceLists.length > 0) {
        const priceListIds = priceLists.map(list => list.id);

        // Find prices for this product in applicable price lists
        const customerPrices = await pricingDataRepository.customerPrices.findPricesForProduct(productId, variantId, priceListIds);

        if (customerPrices.length > 0) {
          // Apply the first applicable price (already sorted by priority)
          const customerPrice = customerPrices[0];
          const previousPrice = currentPrice;

          // Apply the price adjustment based on its type
          if (customerPrice.adjustmentType === PricingAdjustmentType.FIXED) {
            currentPrice = customerPrice.adjustmentValue;
          } else if (customerPrice.adjustmentType === PricingAdjustmentType.PERCENTAGE) {
            currentPrice = currentPrice * (1 - customerPrice.adjustmentValue / 100);
          } else if (customerPrice.adjustmentType === PricingAdjustmentType.OVERRIDE) {
            currentPrice = customerPrice.adjustmentValue;
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

    // Step 4: Apply dynamic pricing rules
    const applicableRules = await pricingRuleRepository.rules.findActiveRules(productId, product.categoryId, customerId, customerGroupIds);

    // Sort rules by priority (descending) to apply highest priority rules first
    const sortedRules = [...applicableRules].sort((a, b) => b.priority - a.priority);

    // Apply each rule in order
    for (const rule of sortedRules) {
      const previousPrice = currentPrice;
      let ruleApplied = false;

      // Check if the rule conditions are met
      if (await this.evaluateRuleConditions(rule, context)) {
        // Apply the rule's price adjustments
        for (const adjustment of rule.adjustments) {
          if (adjustment.type === PricingAdjustmentType.FIXED) {
            currentPrice = adjustment.value;
            ruleApplied = true;
          } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
            currentPrice = currentPrice * (1 - adjustment.value / 100);
            ruleApplied = true;
          } else if (adjustment.type === PricingAdjustmentType.OVERRIDE) {
            currentPrice = adjustment.value;
            ruleApplied = true;
          }
        }

        if (ruleApplied) {
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

    // Step 5: Apply membership benefits if applicable
    if (customerId) {
      try {
        const membershipBenefits = await this.membershipBenefitsPort.getDiscountBenefits(customerId);

        if (membershipBenefits.length > 0) {
          // Apply the best membership discount
          const bestDiscount = membershipBenefits.reduce(
            (best, current) => (current.discountPercentage > best.discountPercentage ? current : best),
            membershipBenefits[0],
          );

          const previousPrice = currentPrice;
          currentPrice = currentPrice * (1 - bestDiscount.discountPercentage / 100);

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

    // Step 6: Apply loyalty points discount if applicable
    if (customerId && additionalData.applyLoyaltyDiscount) {
      try {
        const currentPoints = await this.loyaltyBalancePort.getCustomerPoints(customerId);

        // Default points-to-money ratio (e.g., 100 points = $1)
        // This should ideally come from a configuration or settings
        const pointsToMoneyRatio = (additionalData.pointsToMoneyRatio as number) || 0.01;

        const pointsToApply = (additionalData.loyaltyPointsToApply as number) || 0;

        // Make sure customer has enough points
        if (pointsToApply > 0 && pointsToApply <= currentPoints) {
          const pointsValue = pointsToApply * pointsToMoneyRatio;
          const previousPrice = currentPrice;

          // Don't go below zero
          currentPrice = Math.max(0, currentPrice - pointsValue);

          appliedRules.push({
            ruleId: 'loyalty_points',
            ruleName: `Loyalty Points (${pointsToApply} points)`,
            adjustmentType: PricingAdjustmentType.FIXED,
            adjustmentValue: pointsValue,
            impact: previousPrice - currentPrice,
          });

          // Note: We're not actually deducting points here
          // This should happen during checkout/order processing
        }
      } catch (error: unknown) {
        logger.warn('Loyalty balance lookup failed for pricing calculation', { customerId, error: (error as Error).message });
      }
    }

    // Ensure price isn't negative
    currentPrice = Math.max(0, currentPrice);

    // Round to 2 decimal places
    currentPrice = Math.round(currentPrice * 100) / 100;

    return {
      originalPrice,
      finalPrice: currentPrice,
      appliedRules,
      currency: priceCurrency,
      originalCurrency,
      exchangeRate: originalCurrency ? currentPrice / originalPrice : undefined,
    };
  }

  /**
   * Calculate prices for multiple products or variants
   */
  async calculatePrices(
    items: Array<{
      productId: string;
      variantId?: string;
      quantity?: number;
    }>,
    context: Omit<PriceContext, 'quantity'> = {},
  ): Promise<Record<string, PricingResult>> {
    const results: Record<string, PricingResult> = {};

    for (const item of items) {
      const itemContext: PriceContext = {
        ...context,
        variantId: item.variantId,
        quantity: item.quantity || 1,
      };

      const key = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
      results[key] = await this.calculatePrice(item.productId, itemContext);
    }

    return results;
  }

  /**
   * Calculate the price impact of a pricing rule on a product
   */
  async calculateRuleImpact(
    ruleIdOrRule: string | PricingRule,
    productIdOrContext: string | PriceContext = {},
    contextParam?: PriceContext,
  ): Promise<PricingRuleImpact> {
    let rule: PricingRule;
    let productId: string;
    let context: PriceContext;
    let beforeRule: PricingResult;

    // Handle different parameter patterns
    if (typeof ruleIdOrRule === 'string') {
      // First overload: (ruleId, productId, context)
      const ruleId = ruleIdOrRule;
      productId = productIdOrContext as string;
      context = contextParam || {};

      // Fetch the rule
      const fetchedRule = await pricingRuleRepository.rules.findById(ruleId);
      if (!fetchedRule) {
        throw new PricingRuleNotFoundError(ruleId);
      }
      rule = fetchedRule;

      // Calculate price without the rule
      beforeRule = await this.calculatePrice(productId, {
        ...context,
        excludeRuleIds: [ruleId],
      });
    } else {
      // Second overload: (rule, context)
      rule = ruleIdOrRule;
      context = productIdOrContext as PriceContext;

      // For this overload we need to get the price from the context
      if (!context.productIds || context.productIds.length === 0) {
        throw new PricingValidationError('Product IDs must be specified in context when using rule object overload');
      }

      // Use the first product ID from the context
      productId = context.productIds[0];

      // Calculate price without the rule
      beforeRule = await this.calculatePrice(productId, {
        ...context,
        excludeRuleIds: rule.id ? [rule.id] : [],
      });
    }

    // Calculate price with only this rule
    const priceAfterRule = await this.calculateAdjustedPrice(beforeRule.originalPrice, rule, context);

    // Create the afterRule result
    const afterRule: PricingResult = {
      originalPrice: beforeRule.originalPrice,
      finalPrice: priceAfterRule,
      appliedRules: [
        {
          ruleId: rule.id,
          ruleName: rule.name,
          adjustmentType:
            rule.adjustments && rule.adjustments.length > 0
              ? rule.adjustments[0]?.type || PricingAdjustmentType.FIXED
              : PricingAdjustmentType.FIXED,
          adjustmentValue: rule.adjustments && rule.adjustments.length > 0 ? rule.adjustments[0]?.value || 0 : 0,
          impact: beforeRule.originalPrice - priceAfterRule,
        },
      ],
      currency: beforeRule.currency,
      originalCurrency: beforeRule.originalCurrency,
      exchangeRate: beforeRule.exchangeRate,
    };

    // Calculate impact metrics
    const impact = beforeRule.originalPrice - priceAfterRule;
    const percentageImpact = (impact / beforeRule.originalPrice) * 100;

    return {
      beforeRule,
      afterRule,
      impact,
      percentageImpact,
    };
  }

  /**
   * Calculate price after applying a specific rule
   */
  private async calculateAdjustedPrice(originalPrice: number, rule: PricingRule, _context: PriceContext): Promise<number> {
    let priceAfterRule = originalPrice;

    // Apply each adjustment in the rule
    for (const adjustment of rule.adjustments) {
      if (adjustment.type === PricingAdjustmentType.FIXED) {
        priceAfterRule = adjustment.value;
      } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
        priceAfterRule = priceAfterRule * (1 - adjustment.value / 100);
      } else if (adjustment.type === PricingAdjustmentType.OVERRIDE) {
        priceAfterRule = adjustment.value;
      }
    }

    return priceAfterRule;
  }

  /**
   * Evaluate if a pricing rule's conditions are met given the context
   */
  private async evaluateRuleConditions(rule: PricingRule, context: PriceContext): Promise<boolean> {
    const { customerId, customerGroupIds = [], quantity = 1, cartTotal = 0, productIds = [], additionalData = {} } = context;

    // Extract date from context or use current date as default
    const date = context.date || new Date();

    // Check date range
    if (rule.startDate && new Date(rule.startDate) > date) {
      return false;
    }

    if (rule.endDate && new Date(rule.endDate) < date) {
      return false;
    }

    // Check quantity constraints
    if (rule.minimumQuantity && quantity < rule.minimumQuantity) {
      return false;
    }

    if (rule.maximumQuantity && quantity > rule.maximumQuantity) {
      return false;
    }

    // Check minimum order amount
    if (rule.minimumOrderAmount && cartTotal < rule.minimumOrderAmount) {
      return false;
    }

    // Check product constraints
    if (rule.scope === PricingRuleScope.PRODUCT && rule.productIds) {
      const matchesProduct = productIds.some(pid => rule.productIds?.includes(pid));
      if (!matchesProduct) {
        return false;
      }
    }

    // Check customer constraints
    if (rule.scope === PricingRuleScope.CUSTOMER && rule.customerIds) {
      if (!customerId || !rule.customerIds.includes(customerId)) {
        return false;
      }
    }

    // Check customer group constraints
    if (rule.scope === PricingRuleScope.CUSTOMER_GROUP && rule.customerGroupIds) {
      const matchesGroup = customerGroupIds.some(gid => rule.customerGroupIds?.includes(gid));
      if (!matchesGroup) {
        return false;
      }
    }

    // Evaluate custom conditions in the rule
    for (const condition of rule.conditions) {
      const params = condition.parameters;
      switch (condition.type) {
        case 'date_range':
          if (
            (params.startDate && new Date(params.startDate as string) > date) ||
            (params.endDate && new Date(params.endDate as string) < date)
          ) {
            return false;
          }
          break;

        case 'day_of_week':
          const dayOfWeek = date.getDay();
          if (!(params.days as number[]).includes(dayOfWeek)) {
            return false;
          }
          break;

        case 'time_of_day':
          const hours = date.getHours();
          if (hours < (params.startHour as number) || hours >= (params.endHour as number)) {
            return false;
          }
          break;

        case 'customer_attribute':
          // This would require additional customer data lookup
          // For now, just check if the attribute exists in additionalData
          if (
            !additionalData.customerAttributes ||
            !(additionalData.customerAttributes as Record<string, unknown>)[params.attribute as string] ||
            (additionalData.customerAttributes as Record<string, unknown>)[params.attribute as string] !== params.value
          ) {
            return false;
          }
          break;

        // Additional condition types can be added here

        default:
          // Unknown condition type, skip it
          break;
      }
    }

    // All conditions passed
    return true;
  }

  /**
   * Format a price according to currency formatting rules
   */
  async formatPrice(price: number, currencyCode?: string): Promise<string> {
    // Get the currency to use for formatting
    const currency = currencyCode ? await this.getCurrency(currencyCode) : await this.getDefaultCurrency();

    if (!currency) {
      // Fallback to basic formatting
      return price.toFixed(2);
    }

    return formatCurrency(price, currency);
  }
}

export default new PricingService();
