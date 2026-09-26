import type {
  CustomerTaxExemption,
  TaxCategory,
  TaxExemptionStatus,
  TaxRate,
  TaxZone,
} from '../../taxTypes';

interface TaxQueryPort {
  findTaxRateById(id: string): Promise<TaxRate | null>;
  findAllTaxRates(
    status?: boolean,
    country?: string,
    region?: string,
    limit?: number,
    offset?: number,
  ): Promise<TaxRate[]>;
  findTaxRatesByCategoryAndZone(categoryId: string, zoneId: string, status?: TaxRate['isActive']): Promise<TaxRate[]>;
  findTaxZoneById(id: string): Promise<TaxZone | null>;
  findTaxZoneForAddress(country: string, state?: string, postalCode?: string, city?: string): Promise<TaxZone | null>;
  findAllTaxZones(status?: TaxZone['isActive'], limit?: number, offset?: number): Promise<TaxZone[]>;
  findTaxCategoryById(id: string): Promise<TaxCategory | null>;
  findTaxCategoryByCode(code: string): Promise<TaxCategory | null>;
  findAllTaxCategories(status?: TaxCategory['isActive'], limit?: number, offset?: number): Promise<TaxCategory[]>;
  findDefaultTaxCategory(): Promise<TaxCategory | null>;
  findCustomerTaxExemptions(customerId: string, status?: TaxExemptionStatus): Promise<CustomerTaxExemption[]>;
  findTaxExemptionsByCustomerId(customerId: string, status?: TaxExemptionStatus): Promise<unknown[]>;
  findAllTaxExemptions(status?: TaxExemptionStatus, limit?: number, offset?: number): Promise<CustomerTaxExemption[]>;
}

interface TaxCommandPort {
  createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate>;
  updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxRate>;
  deleteTaxRate(id: string): Promise<boolean>;
  updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxCategory>;
  deleteTaxCategory(id: string): Promise<boolean>;
  deleteTaxZone(id: string): Promise<boolean>;
}

export class ManageTaxRecordsUseCase {
  constructor(
    private readonly query: TaxQueryPort,
    private readonly commands: TaxCommandPort,
  ) {}

  // Rates
  async findTaxRateById(id: string) {
    return this.query.findTaxRateById(id);
  }
  async findAllTaxRates(status?: boolean, country?: string, region?: string, limit?: number, offset?: number) {
    return this.query.findAllTaxRates(status, country, region, limit, offset);
  }
  async findTaxRatesByCategoryAndZone(categoryId: string, zoneId: string, status?: TaxRate['isActive']) {
    return this.query.findTaxRatesByCategoryAndZone(categoryId, zoneId, status);
  }
  async createTaxRate(taxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.commands.createTaxRate(taxRate);
  }
  async updateTaxRate(id: string, taxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.commands.updateTaxRate(id, taxRate);
  }
  async deleteTaxRate(id: string) {
    return this.commands.deleteTaxRate(id);
  }

  // Zones
  async findTaxZoneById(id: string) {
    return this.query.findTaxZoneById(id);
  }
  async findTaxZoneForAddress(country: string, state?: string, postalCode?: string, city?: string) {
    return this.query.findTaxZoneForAddress(country, state, postalCode, city);
  }
  async findAllTaxZones(status?: TaxZone['isActive'], limit?: number, offset?: number) {
    return this.query.findAllTaxZones(status, limit, offset);
  }
  async deleteTaxZone(id: string) {
    return this.commands.deleteTaxZone(id);
  }

  // Categories
  async findTaxCategoryById(id: string) {
    return this.query.findTaxCategoryById(id);
  }
  async findTaxCategoryByCode(code: string) {
    return this.query.findTaxCategoryByCode(code);
  }
  async findAllTaxCategories(status?: TaxCategory['isActive'], limit?: number, offset?: number) {
    return this.query.findAllTaxCategories(status, limit, offset);
  }
  async findDefaultTaxCategory() {
    return this.query.findDefaultTaxCategory();
  }
  async updateTaxCategory(id: string, category: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.commands.updateTaxCategory(id, category);
  }
  async deleteTaxCategory(id: string) {
    return this.commands.deleteTaxCategory(id);
  }

  // Exemptions
  async findCustomerTaxExemptions(customerId: string, status?: TaxExemptionStatus) {
    return this.query.findCustomerTaxExemptions(customerId, status);
  }
  async findTaxExemptionsByCustomerId(customerId: string, status?: TaxExemptionStatus) {
    return this.query.findTaxExemptionsByCustomerId(customerId, status);
  }
  async findAllTaxExemptions(status?: TaxExemptionStatus, limit?: number, offset?: number) {
    return this.query.findAllTaxExemptions(status, limit, offset);
  }
}
