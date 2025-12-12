/**
 * Delete Warehouse Use Case
 */
import * as warehouseRepo from '../../repos/warehouseRepo';

export interface DeleteWarehouseInput {
  id: string;
}

export interface DeleteWarehouseOutput {
  success: boolean;
  error?: string;
}

export class DeleteWarehouse {
  async execute(input: DeleteWarehouseInput): Promise<DeleteWarehouseOutput> {
    try {
      const existingWarehouse = await warehouseRepo.findWarehouseById(input.id);
      if (!existingWarehouse) {
        return { success: false, error: 'Distribution center not found' };
      }

      const deleted = await warehouseRepo.deleteWarehouse(input.id);
      if (!deleted) {
        return { success: false, error: 'Failed to delete distribution center' };
      }

      return { success: true };
    } catch (error) {
      console.error('DeleteWarehouse error:', error);
      return { success: false, error: 'Failed to delete distribution center' };
    }
  }
}

export const deleteWarehouse = new DeleteWarehouse();
