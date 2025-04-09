import { Request, Response } from 'express';
import { InventoryRepo } from '../repos/inventoryRepo';

export class InventoryPublicController {
  private inventoryRepo: InventoryRepo;

  constructor() {
    this.inventoryRepo = new InventoryRepo();
  }

  /**
   * Get inventory information for a product with limited details for public use
   */
  getProductInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.inventoryRepo.findInventoryItemsByProductId(req.params.productId);
      
      // Return simplified inventory information without internal details
      const publicItems = items.map(item => ({
        locationId: item.locationId,
        inStock: item.availableQuantity > 0,
        availableQuantity: item.availableQuantity,
        lowStock: item.availableQuantity <= item.lowStockThreshold && item.availableQuantity > 0
      }));
      
      res.status(200).json({
        success: true,
        data: publicItems
      });
    } catch (error) {
      console.error('Error fetching product inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product inventory'
      });
    }
  };

  /**
   * Get inventory information for a specific location with limited details
   */
  getLocationInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verify location exists and is active
      const location = await this.inventoryRepo.findLocationById(req.params.id);
      if (!location || !location.isActive) {
        res.status(404).json({
          success: false,
          message: "Location not found"
        });
        return;
      }
      
      // Get product IDs if provided
      const productIds = req.query.productIds ? (req.query.productIds as string).split(',') : [];
      
      // Get inventory for this location
      const items = await this.inventoryRepo.findInventoryItemsByLocationId(req.params.id);
      
      // Filter by product IDs if provided
      const filteredItems = productIds.length > 0 
        ? items.filter(item => productIds.includes(item.productId))
        : items;
      
      // Return simplified inventory information
      const publicItems = filteredItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        inStock: item.availableQuantity > 0,
        availableQuantity: item.availableQuantity,
        lowStock: item.availableQuantity <= item.lowStockThreshold && item.availableQuantity > 0
      }));
      
      res.status(200).json({
        success: true,
        data: {
          locationId: location.id,
          locationName: location.name,
          items: publicItems
        }
      });
    } catch (error) {
      console.error('Error fetching location inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch location inventory'
      });
    }
  };

  /**
   * Reserve inventory items for a cart
   */
  reserveCartItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId } = req.params;
      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Items array is required and cannot be empty"
        });
        return;
      }
      
      const results = [];
      const errors = [];
      
      // Calculate expiration time (e.g., 30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      // Process each item
      for (const item of items) {
        const { inventoryId, quantity } = item;
        
        if (!inventoryId || !quantity) {
          errors.push({ item, message: "inventoryId and quantity are required" });
          continue;
        }
        
        try {
          // Create reservation
          const reservation = await this.inventoryRepo.createReservation({
            inventoryId,
            quantity,
            cartId,
            expiresAt: expiresAt.toISOString(),
            status: 'active'
          });
          
          results.push(reservation);
        } catch (error) {
          errors.push({ 
            item, 
            message: (error as Error).message 
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          reservations: results,
          errors: errors.length > 0 ? errors : undefined
        },
        message: errors.length > 0 
          ? "Some items could not be reserved" 
          : "Items reserved successfully"
      });
    } catch (error) {
      console.error('Error reserving inventory for cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reserve inventory',
        error: (error as Error).message
      });
    }
  };

  /**
   * Release all reservations for a cart
   */
  releaseCartReservations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId } = req.params;
      
      // Find active reservations for this cart
      const reservations = await this.inventoryRepo.findReservationsByCartId(cartId);
      
      if (reservations.length === 0) {
        res.status(404).json({
          success: false,
          message: "No active reservations found for this cart"
        });
        return;
      }
      
      const results = [];
      const errors = [];
      
      // Cancel each reservation
      for (const reservation of reservations) {
        try {
          const updated = await this.inventoryRepo.updateReservationStatus(reservation.id, 'cancelled');
          results.push(updated);
        } catch (error) {
          errors.push({
            reservationId: reservation.id,
            message: (error as Error).message
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          released: results,
          errors: errors.length > 0 ? errors : undefined
        },
        message: errors.length > 0 
          ? "Some reservations could not be released" 
          : "Reservations released successfully"
      });
    } catch (error) {
      console.error('Error releasing cart reservations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to release reservations',
        error: (error as Error).message
      });
    }
  };
}
