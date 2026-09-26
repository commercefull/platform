import type {
  WarehouseCreateParams,
  WarehouseRecord,
  WarehouseStatistics,
  WarehouseUpdateParams,
} from '../../domain/repositories/WarehouseRepository';

interface WarehouseAdminRepositoryPort {
  findAll(activeOnly?: boolean): Promise<WarehouseRecord[]>;
  getStatistics(): Promise<WarehouseStatistics>;
  findById(warehouseId: string): Promise<WarehouseRecord | null>;
  findByCode(code: string): Promise<WarehouseRecord | null>;
  findDefault(): Promise<WarehouseRecord | null>;
  search(searchTerm: string, activeOnly?: boolean): Promise<WarehouseRecord[]>;
  findFulfillmentCenters(activeOnly?: boolean): Promise<WarehouseRecord[]>;
  findReturnCenters(activeOnly?: boolean): Promise<WarehouseRecord[]>;
  findByMerchantId(organizationId: string): Promise<WarehouseRecord[]>;
  findByCountry(country: string, activeOnly?: boolean): Promise<WarehouseRecord[]>;
  findNearLocation(
    latitude: number,
    longitude: number,
    radiusKm?: number,
    limit?: number,
  ): Promise<Array<WarehouseRecord & { distance: number }>>;
  create(params: WarehouseCreateParams): Promise<WarehouseRecord>;
  update(warehouseId: string, params: WarehouseUpdateParams): Promise<WarehouseRecord | null>;
  delete(warehouseId: string): Promise<boolean>;
  setAsDefault(warehouseId: string): Promise<WarehouseRecord | null>;
  activate(warehouseId: string): Promise<WarehouseRecord | null>;
  deactivate(warehouseId: string): Promise<WarehouseRecord | null>;
  addShippingMethod(warehouseId: string, method: string): Promise<WarehouseRecord | null>;
  removeShippingMethod(warehouseId: string, method: string): Promise<WarehouseRecord | null>;
}

export class ManageWarehouseAdminUseCase {
  constructor(private readonly warehouseRepo: WarehouseAdminRepositoryPort) {}

  async findAll(activeOnly?: boolean) {
    return this.warehouseRepo.findAll(activeOnly);
  }
  async getStatistics() {
    return this.warehouseRepo.getStatistics();
  }
  async findById(warehouseId: string) {
    return this.warehouseRepo.findById(warehouseId);
  }
  async findByCode(code: string) {
    return this.warehouseRepo.findByCode(code);
  }
  async findDefault() {
    return this.warehouseRepo.findDefault();
  }
  async search(searchTerm: string, activeOnly?: boolean) {
    return this.warehouseRepo.search(searchTerm, activeOnly);
  }
  async findFulfillmentCenters(activeOnly?: boolean) {
    return this.warehouseRepo.findFulfillmentCenters(activeOnly);
  }
  async findReturnCenters(activeOnly?: boolean) {
    return this.warehouseRepo.findReturnCenters(activeOnly);
  }
  async findByMerchantId(organizationId: string) {
    return this.warehouseRepo.findByMerchantId(organizationId);
  }
  async findByCountry(country: string, activeOnly?: boolean) {
    return this.warehouseRepo.findByCountry(country, activeOnly);
  }
  async findNearLocation(latitude: number, longitude: number, radiusKm?: number, limit?: number) {
    return this.warehouseRepo.findNearLocation(latitude, longitude, radiusKm, limit);
  }
  async create(params: WarehouseCreateParams) {
    return this.warehouseRepo.create(params);
  }
  async update(warehouseId: string, params: WarehouseUpdateParams) {
    return this.warehouseRepo.update(warehouseId, params);
  }
  async delete(warehouseId: string) {
    return this.warehouseRepo.delete(warehouseId);
  }
  async setAsDefault(warehouseId: string) {
    return this.warehouseRepo.setAsDefault(warehouseId);
  }
  async activate(warehouseId: string) {
    return this.warehouseRepo.activate(warehouseId);
  }
  async deactivate(warehouseId: string) {
    return this.warehouseRepo.deactivate(warehouseId);
  }
  async addShippingMethod(warehouseId: string, method: string) {
    return this.warehouseRepo.addShippingMethod(warehouseId, method);
  }
  async removeShippingMethod(warehouseId: string, method: string) {
    return this.warehouseRepo.removeShippingMethod(warehouseId, method);
  }
}
