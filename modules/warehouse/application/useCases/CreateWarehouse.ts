/**
 * CreateWarehouse Use Case
 *
 * Creates a new warehouse for inventory storage and fulfillment.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export type WarehouseType = 'warehouse' | 'store' | 'fulfillment_center' | 'distribution_center';

export interface CreateWarehouseInput {
  name: string;
  code: string;
  type: WarehouseType;

  // Ownership
  organizationId?: string;

  // Address
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

  // Settings
  timezone?: string;
  cutoffTime?: string; // e.g., "14:00" - orders after this time ship next day
  processingTime?: number; // Hours to process an order
  isActive?: boolean;
  isDefault?: boolean;

  // Capabilities
  capabilities?: string[];
  supportedCarriers?: string[];

  // Capacity
  maxCapacity?: number;
  currentCapacity?: number;
}

export interface CreateWarehouseOutput {
  warehouseId: string;
  name: string;
  code: string;
  type: WarehouseType;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface WarehouseRecord {
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface WarehouseRepositoryPort {
  findByCode(code: string): Promise<WarehouseRecord | null>;
  findDefault(): Promise<WarehouseRecord | null>;
  update(warehouseId: string, params: Record<string, unknown>): Promise<WarehouseRecord | null>;
  create(data: Record<string, unknown>): Promise<WarehouseRecord>;
}

export class CreateWarehouseUseCase {
  constructor(
    private readonly warehouseRepository: WarehouseRepositoryPort,
  ) {}

  async execute(input: CreateWarehouseInput): Promise<CreateWarehouseOutput> {
    // Check if code already exists
    const existingWarehouse = await this.warehouseRepository.findByCode(input.code);
    if (existingWarehouse) {
      throw new Error(`Warehouse with code '${input.code}' already exists`);
    }

    // If setting as default, unset current default
    if (input.isDefault) {
      const currentDefault = await this.warehouseRepository.findDefault();
      if (currentDefault) {
        await this.warehouseRepository.update(currentDefault.distributionWarehouseId, { isDefault: false });
      }
    }

    // Generate warehouse ID
    const warehouseId = this.generateWarehouseId();

    // Create warehouse
    const warehouse = await this.warehouseRepository.create({
      warehouseId,
      name: input.name,
      code: input.code,
      type: input.type,
      organizationId: input.organizationId,
      address: input.address,
      timezone: input.timezone || 'UTC',
      cutoffTime: input.cutoffTime,
      processingTime: input.processingTime || 24,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
      capabilities: input.capabilities || [],
      supportedCarriers: input.supportedCarriers || [],
      maxCapacity: input.maxCapacity,
      currentCapacity: input.currentCapacity || 0,
    });

    // Emit event
    eventBus.emit('warehouse.created', {
      warehouseId: warehouse.distributionWarehouseId,
      name: warehouse.name,
      code: warehouse.code,
      type: input.type,
    });

    return {
      warehouseId: warehouse.distributionWarehouseId,
      name: warehouse.name,
      code: warehouse.code,
      type: input.type,
      isActive: warehouse.isActive,
      isDefault: warehouse.isDefault,
      createdAt: warehouse.createdAt,
    };
  }

  private generateWarehouseId(): string {
    return `wh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
