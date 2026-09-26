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
import { SaveCurrencyUseCase } from './useCases/SaveCurrency';
import { DeleteCurrencyUseCase } from './useCases/DeleteCurrency';
import { CreateCurrencyRegionUseCase } from './useCases/CreateCurrencyRegion';
import { UpdateCurrencyRegionUseCase } from './useCases/UpdateCurrencyRegion';
import { CreateCurrencyPriceRuleUseCase } from './useCases/CreateCurrencyPriceRule';
import { UpdateCurrencyPriceRuleUseCase } from './useCases/UpdateCurrencyPriceRule';
import { CreatePricingRuleUseCase } from './useCases/CreatePricingRule';
import { CreateTierPriceUseCase } from './useCases/CreateTierPrice';
import { AddPriceToListUseCase } from './useCases/AddPriceToList';
import { ManagePricingAdminUseCase } from './useCases/ManagePricingAdmin';
import { CreatePriceListUseCase } from './useCases/CreatePriceList';
import { SetProductPriceUseCase } from './useCases/SetProductPrice';

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

// ── Catalog administration use cases ────────────────────────────────

export const saveCurrencyUseCase = new SaveCurrencyUseCase(currencyRepository.currencies);
export const deleteCurrencyUseCase = new DeleteCurrencyUseCase(currencyRepository.currencies);
export const createCurrencyRegionUseCase = new CreateCurrencyRegionUseCase(currencyRepository.currencies);
export const updateCurrencyRegionUseCase = new UpdateCurrencyRegionUseCase(currencyRepository.currencies);

export const createCurrencyPriceRuleUseCase = new CreateCurrencyPriceRuleUseCase({
  getCurrencyByCode: code => currencyRepository.currencies.getCurrencyByCode(code),
  getCurrencyRegionByCode: regionCode => currencyRepository.currencies.getCurrencyRegionByCode(regionCode),
  create: data => pricingRuleRepository.currencyPriceRules.create(data),
});
export const updateCurrencyPriceRuleUseCase = new UpdateCurrencyPriceRuleUseCase({
  findById: id => pricingRuleRepository.currencyPriceRules.findById(id),
  getCurrencyByCode: code => currencyRepository.currencies.getCurrencyByCode(code),
  getCurrencyRegionByCode: regionCode => currencyRepository.currencies.getCurrencyRegionByCode(regionCode),
  update: (id, data) => pricingRuleRepository.currencyPriceRules.update(id, data),
});

export const createPricingRuleUseCase = new CreatePricingRuleUseCase(pricingRuleRepository.rules);
export const createTierPriceUseCase = new CreateTierPriceUseCase(pricingDataRepository.tierPrices);
export const addPriceToListUseCase = new AddPriceToListUseCase(pricingDataRepository.customerPrices);

export const managePricingAdminUseCase = new ManagePricingAdminUseCase({
  currencies: currencyRepository.currencies,
  rules: pricingRuleRepository.rules,
  currencyPriceRules: pricingRuleRepository.currencyPriceRules,
  tierPrices: pricingDataRepository.tierPrices,
  customerPrices: pricingDataRepository.customerPrices,
  basePrices: pricingDataRepository.basePrices,
  priceLists: pricingDataRepository.priceLists,
});

const createPriceListAdapter = {
  createPriceList: async (data: {
    priceListId: string;
    name: string;
    description?: string;
    currencyCode: string;
    type: string;
    isDefault: boolean;
    validFrom?: Date;
    validTo?: Date;
    storeIds: string[];
    isActive: boolean;
  }) => {
    const result = await pricingDataRepository.priceLists.create({
      name: data.name,
      description: data.description,
      priority: 0,
      isActive: data.isActive,
      startDate: data.validFrom?.toISOString(),
      endDate: data.validTo?.toISOString(),
    });
    return {
      priceListId: result.priceListId,
      name: result.name,
      type: data.type,
      currencyCode: data.currencyCode,
      isDefault: data.isDefault,
      createdAt: new Date(result.createdAt),
    };
  },
};

const setProductPriceAdapter = {
  setPrice: async (data: {
    productId: string;
    variantId?: string;
    priceListId?: string;
    priceCents: number;
    salePriceCents?: number;
    currencyCode: string;
  }) => {
    const saved = await pricingDataRepository.basePrices.upsert({
      productId: data.productId,
      productVariantId: data.variantId ?? null,
      currencyCode: data.currencyCode,
      priceCents: data.priceCents,
      salePriceCents: data.salePriceCents ?? null,
    });
    return {
      productId: saved.productId,
      variantId: saved.productVariantId ?? undefined,
      priceCents: saved.priceCents,
      salePriceCents: saved.salePriceCents,
      updatedAt: saved.updatedAt,
    };
  },
};

export const createPriceListUseCase = new CreatePriceListUseCase(createPriceListAdapter);
export const setProductPriceUseCase = new SetProductPriceUseCase(setProductPriceAdapter);
