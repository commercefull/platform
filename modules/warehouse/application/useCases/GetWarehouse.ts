/**
 * GetWarehouse Use Case
 *
 * Retrieves a warehouse by ID or code.
 */

import { WarehouseValidationError } from '../../domain/errors/WarehouseErrors';

export interface GetWarehouseInput {
  warehouseId?: string;
  code?: string;
}

export interface WarehouseDetails {
  warehouseId: string;
  name: string;
  code: string;
  type: string;
  organizationId?: string;
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

interface WarehouseRecord {
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isFulfillmentCenter: boolean;
  isReturnCenter: boolean;
  isVirtual: boolean;
  organizationId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  cutoffTime?: string;
  processingTime?: number;
  capabilities?: Record<string, unknown>;
  shippingMethods?: string[];
  maxCapacity?: number;
  currentCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

interface WarehouseRepositoryPort {
  findById(id: string): Promise<WarehouseRecord | null>;
  findByCode(code: string): Promise<WarehouseRecord | null>;
}

export class GetWarehouseUseCase {
  constructor(
    private readonly warehouseRepository: WarehouseRepositoryPort,
  ) {}

  async execute(input: GetWarehouseInput): Promise<GetWarehouseOutput> {
    if (!input.warehouseId && !input.code) {
      throw new WarehouseValidationError('Either warehouseId or code must be provided');
    }

    let warehouse: WarehouseRecord | null = null;

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
        warehouseId: warehouse.distributionWarehouseId,
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.description || '',
        organizationId: warehouse.organizationId,
        address: {
          addressLine1: warehouse.addressLine1,
          addressLine2: warehouse.addressLine2,
          city: warehouse.city,
          state: warehouse.state,
          postalCode: warehouse.postalCode,
          countryCode: warehouse.country,
          latitude: warehouse.latitude,
          longitude: warehouse.longitude,
        },
        timezone: warehouse.timezone,
        cutoffTime: warehouse.cutoffTime,
        processingTime: warehouse.processingTime ?? 0,
        isActive: warehouse.isActive,
        isDefault: warehouse.isDefault,
        capabilities: warehouse.shippingMethods || [],
        supportedCarriers: warehouse.shippingMethods || [],
        maxCapacity: warehouse.maxCapacity,
        currentCapacity: warehouse.currentCapacity,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
      },
    };
  }
}
