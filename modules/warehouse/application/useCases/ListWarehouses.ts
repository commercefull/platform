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

interface WarehouseRecord {
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  city: string;
  country: string;
  isActive: boolean;
  isDefault: boolean;
  currentCapacity?: number;
  maxCapacity?: number;
  merchantId?: string;
  businessId?: string;
}

interface WarehouseRepositoryPort {
  findAll(activeOnly?: boolean): Promise<WarehouseRecord[]>;
}

export class ListWarehousesUseCase {
  constructor(
    private readonly warehouseRepository: WarehouseRepositoryPort,
  ) {}

  async execute(input: ListWarehousesInput): Promise<ListWarehousesOutput> {
    const page = input.pagination?.page || 1;
    const limit = input.pagination?.limit || 20;

    const allWarehouses = await this.warehouseRepository.findAll(input.filters?.isActive);

    // Apply filters
    let filtered = allWarehouses;
    if (input.filters?.type) {
      const filterType = input.filters.type;
      filtered = filtered.filter(wh => wh.description === filterType);
    }
    if (input.filters?.merchantId) {
      filtered = filtered.filter(wh => wh.merchantId === input.filters?.merchantId);
    }
    if (input.filters?.businessId) {
      filtered = filtered.filter(wh => wh.businessId === input.filters?.businessId);
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    const warehouses = paged.map((wh: WarehouseRecord) => ({
      warehouseId: wh.distributionWarehouseId,
      name: wh.name,
      code: wh.code,
      type: wh.description || '',
      city: wh.city || '',
      countryCode: wh.country || '',
      isActive: wh.isActive,
      isDefault: wh.isDefault,
      currentCapacity: wh.currentCapacity,
      maxCapacity: wh.maxCapacity,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      warehouses,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
