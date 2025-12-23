/**
 * ListWarehouses Use Case
 * 
 * Lists warehouses with optional filtering and pagination.
 */

export interface ListWarehousesInput {
  filters?: {
    type?: string;
    businessId?: string;
    merchantId?: string;
    isActive?: boolean;
  };
  pagination?: {
    page?: number;
    limit?: number;
  };
}

export interface WarehouseSummary {
  warehouseId: string;
  name: string;
  code: string;
  type: string;
  city: string;
  countryCode: string;
  isActive: boolean;
  isDefault: boolean;
  currentCapacity?: number;
  maxCapacity?: number;
}

export interface ListWarehousesOutput {
  warehouses: WarehouseSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListWarehousesUseCase {
  constructor(
    private readonly warehouseRepository: any // WarehouseRepository
  ) {}

  async execute(input: ListWarehousesInput): Promise<ListWarehousesOutput> {
    const page = input.pagination?.page || 1;
    const limit = input.pagination?.limit || 20;

    const result = await this.warehouseRepository.findAll({
      ...input.filters,
      offset: (page - 1) * limit,
      limit,
    });

    const warehouses = result.warehouses.map((wh: any) => ({
      warehouseId: wh.warehouseId,
      name: wh.name,
      code: wh.code,
      type: wh.type,
      city: wh.address?.city || '',
      countryCode: wh.address?.countryCode || '',
      isActive: wh.isActive,
      isDefault: wh.isDefault,
      currentCapacity: wh.currentCapacity,
      maxCapacity: wh.maxCapacity,
    }));

    const totalPages = Math.ceil(result.total / limit);

    return {
      warehouses,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }
}
