/**
 * Create Warehouse Use Case
 * Handles creation of distribution centers/warehouses with validation
 */
import * as warehouseRepo from '../../repos/warehouseRepo';

export interface CreateWarehouseInput {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  timezone?: string;
  cutoffTime?: string;
  processingTime?: number;
  isActive?: boolean;
  isDefault?: boolean;
  isFulfillmentCenter?: boolean;
  shippingMethods?: string[];
  createdBy?: string;
}

export interface CreateWarehouseOutput {
  success: boolean;
  warehouse?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isFulfillmentCenter: boolean;
  };
  error?: string;
}

export class CreateWarehouse {
  async execute(input: CreateWarehouseInput): Promise<CreateWarehouseOutput> {
    try {
      // 1. Validate required fields
      if (!input.name || !input.code || !input.addressLine1 || !input.city || !input.postalCode || !input.country) {
        return { 
          success: false, 
          error: 'Name, code, addressLine1, city, postalCode, and country are required' 
        };
      }

      // 2. Check for duplicate code
      const existingWarehouse = await warehouseRepo.findWarehouseByCode(input.code);
      if (existingWarehouse) {
        return { 
          success: false, 
          error: 'A distribution center with this code already exists' 
        };
      }

      // 3. Create warehouse
      const warehouse = await warehouseRepo.createWarehouse({
        name: input.name,
        code: input.code,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        state: input.state || null,
        postalCode: input.postalCode,
        country: input.country,
        latitude: input.latitude?.toString() || null,
        longitude: input.longitude?.toString() || null,
        phone: input.phone || null,
        email: input.email || null,
        timezone: input.timezone || 'UTC',
        cutoffTime: input.cutoffTime || null,
        processingTime: input.processingTime || 24,
        isActive: input.isActive !== false,
        isDefault: input.isDefault || false,
        isFulfillmentCenter: input.isFulfillmentCenter !== false,
        shippingMethods: input.shippingMethods || [],
        createdBy: input.createdBy || null
      } as any);

      if (!warehouse) {
        return { success: false, error: 'Failed to create warehouse' };
      }

      return {
        success: true,
        warehouse: {
          id: warehouse.distributionWarehouseId,
          name: warehouse.name,
          code: warehouse.code,
          isActive: warehouse.isActive,
          isFulfillmentCenter: warehouse.isFulfillmentCenter
        }
      };
    } catch (error) {
      console.error('CreateWarehouse error:', error);
      return { success: false, error: 'Failed to create warehouse' };
    }
  }
}

export const createWarehouse = new CreateWarehouse();
