import pricingDataRepository from '../infrastructure/repositories/PricingDataRepository';
import pricingRuleRepository from '../infrastructure/repositories/PricingRuleRepository';
import currencyRepository from '../infrastructure/repositories/CurrencyRepository';
import { pricingRuleRepo } from '../infrastructure';
import { MembershipBenefitsAdapter } from '../infrastructure/acl/MembershipBenefitsAdapter';
import { LoyaltyBalanceAdapter } from '../infrastructure/acl/LoyaltyBalanceAdapter';
import { MembershipRepo } from '../../membership/infrastructure/repositories/membershipRepo';
import { LoyaltyRepo } from '../../loyalty/infrastructure/repositories/loyaltyRepo';
import { CachedCurrencyCatalog } from '../infrastructure/services/CachedCurrencyCatalog';
import { PricingAdjustmentType } from '../domain/pricingRule';
import type { CurrencyCatalogPort } from '../domain/repositories/CurrencyCatalog';
import type { PricingDataQueryPort } from '../domain/repositories/PricingDataQueryRepository';
import type { CurrencyPriceRuleQueryPort, PricingRuleQueryPort } from '../domain/repositories/PricingRuleQueryRepository';
import { GetCurrencyUseCase, GetDefaultCurrencyUseCase } from './useCases/GetCurrency';
import { ConvertPriceUseCase } from './useCases/ConvertPrice';
import { CalculatePriceUseCase } from './useCases/CalculatePrice';
import { CalculatePricesUseCase } from './useCases/CalculatePrices';
import { CalculateRuleImpactUseCase } from './useCases/CalculateRuleImpact';
import { FormatPriceUseCase } from './useCases/FormatPrice';

export { pricingDataRepository, pricingRuleRepository, currencyRepository };

export { pricingRuleRepo };

// ── Read ports over the consolidated repositories ───────────────────
// The consolidated repos expose more than the pricing pipeline needs —
// these adapters narrow them to the domain query ports.

const currencyCatalog: CurrencyCatalogPort = new CachedCurrencyCatalog();

const pricingDataQuery: PricingDataQueryPort = {
  findEffectiveBasePrice: (productId, variantId, currencyCode) =>
    pricingDataRepository.basePrices.findEffective(productId, variantId, currencyCode),
  findApplicableTier: (productId, quantity, variantId, customerGroupId) =>
    pricingDataRepository.tierPrices.findApplicableTier(productId, quantity, variantId, customerGroupId),
  findPriceListsForCustomer: (customerId, customerGroupIds) =>
    pricingDataRepository.customerPrices.findPriceListsForCustomer(customerId, customerGroupIds),
  findPricesForProduct: (productId, variantId, priceListIds) =>
    pricingDataRepository.customerPrices.findPricesForProduct(productId, variantId, priceListIds),
  findPriceListItem: async (priceListId, productId, variantId) => {
    const prices = await pricingDataRepository.customerPrices.findPricesForProduct(productId, variantId, [priceListId]);
    const entry = prices.find(
      p => p.adjustmentType === PricingAdjustmentType.OVERRIDE || p.adjustmentType === PricingAdjustmentType.FIXED,
    );
    // Price-list amounts are stored in major units — convert to cents
    return entry ? { priceCents: Math.round(entry.adjustmentValue * 100) } : null;
  },
};

const pricingRuleQuery: PricingRuleQueryPort = {
  findActiveRules: (productId, categoryId, customerId, customerGroupIds) =>
    pricingRuleRepository.findActiveRules(productId, categoryId, customerId, customerGroupIds),
  findById: ruleId => pricingRuleRepository.rules.findById(ruleId),
};

const currencyPriceRuleQuery: CurrencyPriceRuleQueryPort = {
  findByCurrencyCode: (currencyCode, activeOnly) =>
    pricingRuleRepository.currencyPriceRules.findByCurrencyCode(currencyCode, activeOnly),
};

// ── Wired use-case instances (composition root) ─────────────────────

export const getCurrencyUseCase = new GetCurrencyUseCase(currencyCatalog);
export const getDefaultCurrencyUseCase = new GetDefaultCurrencyUseCase(currencyCatalog);
export const convertPriceUseCase = new ConvertPriceUseCase(currencyCatalog, currencyPriceRuleQuery);
export const calculatePriceUseCase = new CalculatePriceUseCase(
  currencyCatalog,
  pricingDataQuery,
  pricingRuleQuery,
  new MembershipBenefitsAdapter(new MembershipRepo()),
  new LoyaltyBalanceAdapter(new LoyaltyRepo()),
  convertPriceUseCase,
);
export const calculatePricesUseCase = new CalculatePricesUseCase(calculatePriceUseCase);
export const calculateRuleImpactUseCase = new CalculateRuleImpactUseCase(pricingRuleQuery, calculatePriceUseCase);
export const formatPriceUseCase = new FormatPriceUseCase(currencyCatalog);
