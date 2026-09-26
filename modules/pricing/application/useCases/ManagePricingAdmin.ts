import type { Currency, CurrencyRegion } from '../../domain/currency';
import type {
  CurrencyPriceRule,
  CustomerPrice,
  CustomerPriceList,
  PricingRule,
  PricingRuleCreateProps,
  PricingRuleStatus,
  PricingRuleUpdateProps,
  TierPrice,
} from '../../domain/pricingRule';
import type { ProductBasePrice, ProductBasePriceCreateProps } from '../../domain/catalogPrice';

export interface PricingRuleFilters {
  status?: PricingRuleStatus | PricingRuleStatus[];
  type?: string | string[];
  scope?: string | string[];
  productId?: string;
  categoryId?: string;
  customerId?: string;
  customerGroupId?: string;
  organizationId?: string;
  activeOnly?: boolean;
}

export interface PricingRulePagination {
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface TierPriceFindAllOptions {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  customerGroupId?: string;
}

export interface PriceListRecord {
  priceListId: string;
  name: string;
  description?: string;
  priority?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type PriceListCreateParams = Omit<PriceListRecord, 'priceListId' | 'createdAt' | 'updatedAt'>;

interface CurrenciesPort {
  getAllCurrencies(activeOnly?: boolean): Promise<Currency[]>;
  getDefaultCurrency(): Promise<Currency | null>;
  updateExchangeRates(source: string): Promise<Currency[]>;
  getCurrencyRegions(activeOnly?: boolean): Promise<CurrencyRegion[]>;
  getCurrencyRegionById(id: string): Promise<CurrencyRegion | null>;
  deleteCurrencyRegion(id: string): Promise<boolean>;
}

interface PricingRulesPort {
  findAllRules(filters?: PricingRuleFilters, pagination?: PricingRulePagination): Promise<PricingRule[]>;
  countRules(filters?: PricingRuleFilters): Promise<number>;
  findById(id: string): Promise<PricingRule | null>;
  create(data: PricingRuleCreateProps): Promise<PricingRule>;
  update(id: string, data: PricingRuleUpdateProps): Promise<PricingRule>;
  delete(id: string): Promise<boolean>;
}

interface CurrencyPriceRulesPort {
  findByCurrencyCode(currencyCode: string, activeOnly?: boolean): Promise<CurrencyPriceRule[]>;
  findById(id: string): Promise<CurrencyPriceRule | null>;
  delete(id: string): Promise<boolean>;
}

interface TierPricesPort {
  findAll(options?: TierPriceFindAllOptions): Promise<{ tierPrices: TierPrice[]; total: number }>;
  findById(id: string): Promise<TierPrice | null>;
  update(id: string, tierPrice: Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TierPrice>;
  delete(id: string): Promise<boolean>;
}

interface CustomerPricesPort {
  findPriceListById(id: string): Promise<CustomerPriceList | null>;
  findPriceListsForCustomer(customerId: string, customerGroupIds?: string[]): Promise<CustomerPriceList[]>;
  createPriceList(priceList: Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPriceList>;
  updatePriceList(
    id: string,
    priceList: Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<CustomerPriceList>;
  deletePriceList(id: string): Promise<boolean>;
  findPricesByPriceListId(priceListId: string): Promise<CustomerPrice[]>;
}

interface BasePricesPort {
  upsert(params: ProductBasePriceCreateProps): Promise<ProductBasePrice>;
}

interface PriceListsPort {
  create(params: PriceListCreateParams): Promise<PriceListRecord>;
}

export interface ManagePricingAdminDeps {
  currencies: CurrenciesPort;
  rules: PricingRulesPort;
  currencyPriceRules: CurrencyPriceRulesPort;
  tierPrices: TierPricesPort;
  customerPrices: CustomerPricesPort;
  basePrices: BasePricesPort;
  priceLists: PriceListsPort;
}

export class ManagePricingAdminUseCase {
  constructor(private readonly deps: ManagePricingAdminDeps) {}

  // Currencies
  async getAllCurrencies(activeOnly?: boolean) {
    return this.deps.currencies.getAllCurrencies(activeOnly);
  }
  async getDefaultCurrency() {
    return this.deps.currencies.getDefaultCurrency();
  }
  async updateExchangeRates(source: string) {
    return this.deps.currencies.updateExchangeRates(source);
  }
  async getCurrencyRegions(activeOnly?: boolean) {
    return this.deps.currencies.getCurrencyRegions(activeOnly);
  }
  async getCurrencyRegionById(id: string) {
    return this.deps.currencies.getCurrencyRegionById(id);
  }
  async deleteCurrencyRegion(id: string) {
    return this.deps.currencies.deleteCurrencyRegion(id);
  }

  // Pricing rules
  async findAllRules(filters?: PricingRuleFilters, pagination?: PricingRulePagination) {
    return this.deps.rules.findAllRules(filters, pagination);
  }
  async countRules(filters?: PricingRuleFilters) {
    return this.deps.rules.countRules(filters);
  }
  async findRuleById(id: string) {
    return this.deps.rules.findById(id);
  }
  async createRule(data: PricingRuleCreateProps) {
    return this.deps.rules.create(data);
  }
  async updateRule(id: string, data: PricingRuleUpdateProps) {
    return this.deps.rules.update(id, data);
  }
  async deleteRule(id: string) {
    return this.deps.rules.delete(id);
  }

  // Currency price rules
  async findCurrencyPriceRulesByCurrency(currencyCode: string, activeOnly?: boolean) {
    return this.deps.currencyPriceRules.findByCurrencyCode(currencyCode, activeOnly);
  }
  async findCurrencyPriceRuleById(id: string) {
    return this.deps.currencyPriceRules.findById(id);
  }
  async deleteCurrencyPriceRule(id: string) {
    return this.deps.currencyPriceRules.delete(id);
  }

  /**
   * Composed read: rules for a single currency, or for every currency when
   * no currency code is supplied.
   */
  async getAllPriceRules(currencyCode: string | undefined, includeInactive?: boolean): Promise<CurrencyPriceRule[]> {
    if (currencyCode) {
      return this.deps.currencyPriceRules.findByCurrencyCode(currencyCode, includeInactive);
    }

    const currencies = await this.deps.currencies.getAllCurrencies(includeInactive);
    const rules: CurrencyPriceRule[] = [];
    for (const currency of currencies) {
      const currencyRules = await this.deps.currencyPriceRules.findByCurrencyCode(currency.code, includeInactive);
      rules.push(...currencyRules);
    }
    return rules;
  }

  // Tier prices
  async findTierPrices(options?: TierPriceFindAllOptions) {
    return this.deps.tierPrices.findAll(options);
  }
  async findTierPriceById(id: string) {
    return this.deps.tierPrices.findById(id);
  }
  async updateTierPrice(id: string, tierPrice: Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.deps.tierPrices.update(id, tierPrice);
  }
  async deleteTierPrice(id: string) {
    return this.deps.tierPrices.delete(id);
  }

  // Customer price lists
  async findPriceListById(id: string) {
    return this.deps.customerPrices.findPriceListById(id);
  }
  async findPriceListsForCustomer(customerId: string, customerGroupIds?: string[]) {
    return this.deps.customerPrices.findPriceListsForCustomer(customerId, customerGroupIds);
  }
  async createCustomerPriceList(priceList: Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.deps.customerPrices.createPriceList(priceList);
  }
  async updateCustomerPriceList(
    id: string,
    priceList: Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    return this.deps.customerPrices.updatePriceList(id, priceList);
  }
  async deleteCustomerPriceList(id: string) {
    return this.deps.customerPrices.deletePriceList(id);
  }
  async findPricesByPriceListId(priceListId: string) {
    return this.deps.customerPrices.findPricesByPriceListId(priceListId);
  }

  // Base prices
  async upsertBasePrice(params: ProductBasePriceCreateProps) {
    return this.deps.basePrices.upsert(params);
  }

  // Price lists
  async createPriceList(params: PriceListCreateParams) {
    return this.deps.priceLists.create(params);
  }
}
