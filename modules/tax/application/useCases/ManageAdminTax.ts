export interface AdminTaxRateRecord {
  taxRateId: string;
  name: string;
  rate: number;
  country?: string;
  state?: string;
  taxClass?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AdminTaxZoneRecord {
  taxZoneId: string;
  name: string;
  description?: string;
  countries?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AdminTaxClassRecord {
  taxClassId: string;
  name: string;
  description?: string;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AdminTaxRateParams {
  name: string;
  rate: number;
  country?: string;
  state?: string;
  taxClass?: string;
  isActive: boolean;
}

export interface AdminTaxZoneParams {
  name: string;
  description?: string;
  countries: string[];
  isActive: boolean;
}

export interface AdminTaxClassParams {
  name: string;
  description?: string;
}

export interface TaxAdminPort {
  findAllTaxRates(): Promise<AdminTaxRateRecord[]>;
  createTaxRate(params: AdminTaxRateParams): Promise<void>;
  updateTaxRate(taxRateId: string, params: AdminTaxRateParams): Promise<void>;
  softDeleteTaxRate(taxRateId: string): Promise<void>;
  findAllTaxZones(): Promise<AdminTaxZoneRecord[]>;
  createTaxZone(params: AdminTaxZoneParams): Promise<void>;
  updateTaxZone(taxZoneId: string, params: AdminTaxZoneParams): Promise<void>;
  softDeleteTaxZone(taxZoneId: string): Promise<void>;
  findAllTaxClasses(): Promise<AdminTaxClassRecord[]>;
  createTaxClass(params: AdminTaxClassParams): Promise<void>;
  updateTaxClass(taxClassId: string, params: AdminTaxClassParams): Promise<void>;
  softDeleteTaxClass(taxClassId: string): Promise<void>;
}

export class ManageAdminTaxUseCase {
  constructor(private readonly adminRepo: TaxAdminPort) {}

  async findAllTaxRates() {
    return this.adminRepo.findAllTaxRates();
  }
  async createTaxRate(params: AdminTaxRateParams) {
    return this.adminRepo.createTaxRate(params);
  }
  async updateTaxRate(taxRateId: string, params: AdminTaxRateParams) {
    return this.adminRepo.updateTaxRate(taxRateId, params);
  }
  async softDeleteTaxRate(taxRateId: string) {
    return this.adminRepo.softDeleteTaxRate(taxRateId);
  }
  async findAllTaxZones() {
    return this.adminRepo.findAllTaxZones();
  }
  async createTaxZone(params: AdminTaxZoneParams) {
    return this.adminRepo.createTaxZone(params);
  }
  async updateTaxZone(taxZoneId: string, params: AdminTaxZoneParams) {
    return this.adminRepo.updateTaxZone(taxZoneId, params);
  }
  async softDeleteTaxZone(taxZoneId: string) {
    return this.adminRepo.softDeleteTaxZone(taxZoneId);
  }
  async findAllTaxClasses() {
    return this.adminRepo.findAllTaxClasses();
  }
  async createTaxClass(params: AdminTaxClassParams) {
    return this.adminRepo.createTaxClass(params);
  }
  async updateTaxClass(taxClassId: string, params: AdminTaxClassParams) {
    return this.adminRepo.updateTaxClass(taxClassId, params);
  }
  async softDeleteTaxClass(taxClassId: string) {
    return this.adminRepo.softDeleteTaxClass(taxClassId);
  }
}
