/**
 * ConvertPrice Use Case
 *
 * Converts a price between currencies. Amounts are integer cents.
 * Currency rule operands (adjustment values, order thresholds) are
 * stored in major units and converted to cents at application time.
 */

import { CurrencyCatalogPort } from '../../domain/repositories/CurrencyCatalog';
import { CurrencyPriceRuleQueryPort } from '../../domain/repositories/PricingRuleQueryRepository';
import { convertAmount, selectCurrencyPriceRule } from '../../domain/services/PricingRuleEvaluator';
import { PricingResult } from '../../domain/pricingRule';
import { CurrencyNotFoundError } from '../../domain/errors/PricingErrors';

export interface ConvertPriceInput {
  /** Price in integer cents */
  priceCents: number;
  fromCurrencyCode: string;
  toCurrencyCode: string;
}

export interface ConvertPriceOutput {
  convertedPriceCents: number;
  exchangeRate: number;
  appliedRules: PricingResult['appliedRules'];
}

export class ConvertPriceUseCase {
  constructor(
    private readonly currencyCatalog: CurrencyCatalogPort,
    private readonly currencyPriceRules: CurrencyPriceRuleQueryPort,
  ) {}

  async execute(input: ConvertPriceInput): Promise<ConvertPriceOutput> {
    const { priceCents, fromCurrencyCode, toCurrencyCode } = input;

    // If currencies are the same, no conversion needed
    if (fromCurrencyCode === toCurrencyCode) {
      return { convertedPriceCents: priceCents, exchangeRate: 1, appliedRules: [] };
    }

    const fromCurrency = await this.currencyCatalog.getByCode(fromCurrencyCode);
    const toCurrency = await this.currencyCatalog.getByCode(toCurrencyCode);

    if (!fromCurrency || !toCurrency) {
      throw new CurrencyNotFoundError(!fromCurrency ? fromCurrencyCode : toCurrencyCode);
    }

    // Find applicable currency price rules and apply the first match
    const currencyRules = await this.currencyPriceRules.findByCurrencyCode(toCurrencyCode, true);
    const rule = selectCurrencyPriceRule(currencyRules, priceCents);
    const conversion = convertAmount(priceCents, fromCurrency, toCurrency, rule);

    const appliedRules: PricingResult['appliedRules'] = [];
    if (rule && conversion.appliedAdjustment) {
      appliedRules.push({
        ruleId: rule.id,
        ruleName: conversion.appliedRuleName ?? `Currency conversion to ${toCurrency.code}`,
        adjustmentType: conversion.appliedAdjustment.type,
        adjustmentValue: conversion.appliedAdjustment.value,
        impact: Math.round(priceCents * conversion.exchangeRate) - conversion.convertedPriceCents,
      });
    }

    return {
      convertedPriceCents: conversion.convertedPriceCents,
      exchangeRate: conversion.exchangeRate,
      appliedRules,
    };
  }
}
