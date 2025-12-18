/**
 * Update Warehouse Use Case
 */
import * as warehouseRepo from '../../repos/warehouseRepo';

export interface UpdateWarehouseInput {
  id: string;
  name?: string;
  code?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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
}

export interface UpdateWarehouseOutput {
  success: boolean;
  warehouse?: { id: string; name: string; code: string; isActive: boolean };
  error?: string;
}

export class UpdateWarehouse {
  async execute(input: UpdateWarehouseInput): Promise<UpdateWarehouseOutput> {
    try {
      const existingWarehouse = await warehouseRepo.findWarehouseById(input.id);
      if (!existingWarehouse) {
        return { success: false, error: 'Distribution center not found' };
      }

      if (input.code && input.code !== existingWarehouse.code) {
        const codeExists = await warehouseRepo.findWarehouseByCode(input.code);
        if (codeExists) {
          return { success: false, error: 'A distribution center with this code already exists' };
        }
      }

      const { id, ...updateData } = input;
      const updatedWarehouse = await warehouseRepo.updateWarehouse(id, updateData as any);

      if (!updatedWarehouse) {
        return { success: false, error: 'Failed to update warehouse' };
      }

      return {
        success: true,
        warehouse: {
          id: updatedWarehouse.distributionWarehouseId,
          name: updatedWarehouse.name,
          code: updatedWarehouse.code,
          isActive: updatedWarehouse.isActive
        }
      };
    } catch (error) {
      console.error('UpdateWarehouse error:', error);
      return { success: false, error: 'Failed to update warehouse' };
    }
  }
}

export const updateWarehouse = new UpdateWarehouse();
