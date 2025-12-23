/**
 * GetWarehouse Use Case
 * 
 * Retrieves a warehouse by ID or code.
 */

export interface GetWarehouseInput {
  warehouseId?: string;
  code?: string;
}

export interface WarehouseDetails {
  warehouseId: string;
  name: string;
  code: string;
  type: string;
  businessId?: string;
  merchantId?: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    countryCode: string;
    latitude?: number;
    longitude?: number;
  };
  timezone: string;
  cutoffTime?: string;
  processingTime: number;
  isActive: boolean;
  isDefault: boolean;
  capabilities: string[];
  supportedCarriers: string[];
  maxCapacity?: number;
  currentCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetWarehouseOutput {
  warehouse: WarehouseDetails | null;
}

export class GetWarehouseUseCase {
  constructor(
    private readonly warehouseRepository: any // WarehouseRepository
  ) {}

  async execute(input: GetWarehouseInput): Promise<GetWarehouseOutput> {
    if (!input.warehouseId && !input.code) {
      throw new Error('Either warehouseId or code must be provided');
    }

    let warehouse: any = null;

    if (input.warehouseId) {
      warehouse = await this.warehouseRepository.findById(input.warehouseId);
    } else if (input.code) {
      warehouse = await this.warehouseRepository.findByCode(input.code);
    }

    if (!warehouse) {
      return { warehouse: null };
    }

    return {
      warehouse: {
        warehouseId: warehouse.warehouseId,
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type,
        businessId: warehouse.businessId,
        merchantId: warehouse.merchantId,
        address: warehouse.address,
        timezone: warehouse.timezone,
        cutoffTime: warehouse.cutoffTime,
        processingTime: warehouse.processingTime,
        isActive: warehouse.isActive,
        isDefault: warehouse.isDefault,
        capabilities: warehouse.capabilities || [],
        supportedCarriers: warehouse.supportedCarriers || [],
        maxCapacity: warehouse.maxCapacity,
        currentCapacity: warehouse.currentCapacity,
        createdAt: warehouse.createdAt.toISOString(),
        updatedAt: warehouse.updatedAt.toISOString(),
      },
    };
  }
}
