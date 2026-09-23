import type {
  WarehouseRecord,
  WarehouseStatistics,
  WarehouseCreateParams,
  WarehouseUpdateParams,
} from '../../domain/repositories/WarehouseRepository';

interface WarehouseAdminRepositoryPort {
  findAll(activeOnly?: boolean): Promise<WarehouseRecord[]>;
  getStatistics(): Promise<WarehouseStatistics>;
  findById(warehouseId: string): Promise<WarehouseRecord | null>;
  create(params: WarehouseCreateParams): Promise<WarehouseRecord>;
  update(warehouseId: string, params: WarehouseUpdateParams): Promise<WarehouseRecord | null>;
  activate(warehouseId: string): Promise<WarehouseRecord | null>;
  deactivate(warehouseId: string): Promise<WarehouseRecord | null>;
  delete(warehouseId: string): Promise<boolean>;
}

export class ManageWarehouseAdminUseCaseV2 {
  constructor(private readonly warehouseRepo: WarehouseAdminRepositoryPort) {}

  async findAll(activeOnly?: boolean) {
    return this.warehouseRepo.findAll(activeOnly);
  }
  async getStatistics() {
    return this.warehouseRepo.getStatistics();
  }
  async findById(id: string) {
    return this.warehouseRepo.findById(id);
  }
  async create(params: WarehouseCreateParams) {
    return this.warehouseRepo.create(params);
  }
  async update(id: string, params: WarehouseUpdateParams) {
    return this.warehouseRepo.update(id, params);
  }
  async activate(id: string) {
    return this.warehouseRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.warehouseRepo.deactivate(id);
  }
  async delete(id: string) {
    return this.warehouseRepo.delete(id);
  }
}
