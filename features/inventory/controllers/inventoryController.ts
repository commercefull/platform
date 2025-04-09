import { Request, Response } from 'express';
import { 
  InventoryRepo, 
  InventoryItem, 
  InventoryLocation, 
  InventoryTransaction,
  InventoryReservation
} from '../repos/inventoryRepo';

export class InventoryController {
  private inventoryRepo: InventoryRepo;

  constructor() {
    this.inventoryRepo = new InventoryRepo();
  }

  // Inventory Item Endpoints
  getInventoryItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const locationId = req.query.locationId as string | undefined;
      const lowStock = req.query.lowStock === 'true';
      const outOfStock = req.query.outOfStock === 'true';
      
      const filter = { locationId, lowStock, outOfStock };
      
      const items = await this.inventoryRepo.findInventoryItems(limit, offset, filter);

      res.status(200).json({
        success: true,
        data: items,
        pagination: {
          limit,
          offset
        }
      });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory items',
        error: (error as Error).message
      });
    }
  };

  getInventoryItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const item = await this.inventoryRepo.findInventoryItemById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory item',
        error: (error as Error).message
      });
    }
  };

  getInventoryItemsBySku = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sku } = req.params;
      const locationId = req.query.locationId as string | undefined;
      
      const item = await this.inventoryRepo.findInventoryItemBySku(sku, locationId);

      if (!item) {
        res.status(404).json({
          success: false,
          message: `Inventory item with SKU ${sku} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error fetching inventory item by SKU:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory item by SKU',
        error: (error as Error).message
      });
    }
  };

  getInventoryItemsByProductId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const items = await this.inventoryRepo.findInventoryItemsByProductId(productId);

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching inventory items by product ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory items by product ID',
        error: (error as Error).message
      });
    }
  };

  getLowStockItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.inventoryRepo.findLowStockItems();

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock items',
        error: (error as Error).message
      });
    }
  };

  getOutOfStockItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.inventoryRepo.findOutOfStockItems();

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch out of stock items',
        error: (error as Error).message
      });
    }
  };

  createInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        productId,
        sku,
        locationId,
        quantity,
        reservedQuantity = 0,
        lowStockThreshold,
        reorderPoint,
        reorderQuantity,
        lastRestockDate
      } = req.body;

      // Basic validation
      if (!productId || !sku || !locationId || typeof quantity !== 'number') {
        res.status(400).json({
          success: false,
          message: 'productId, sku, locationId, and quantity are required'
        });
        return;
      }

      // Calculate available quantity
      const availableQuantity = Math.max(0, quantity - reservedQuantity);

      const item = await this.inventoryRepo.createInventoryItem({
        productId,
        sku,
        locationId,
        quantity,
        reservedQuantity,
        availableQuantity,
        lowStockThreshold: lowStockThreshold || 10,
        reorderPoint: reorderPoint || 5,
        reorderQuantity: reorderQuantity || 20,
        lastRestockDate: lastRestockDate || new Date().toISOString()
      });

      // Create initial stock transaction
      if (quantity > 0) {
        await this.inventoryRepo.createTransaction({
          inventoryId: item.id,
          transactionType: 'restock',
          quantity,
          notes: 'Initial inventory setup',
          createdBy: 'system'
        });
      }

      res.status(201).json({
        success: true,
        data: item,
        message: 'Inventory item created successfully'
      });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create inventory item',
        error: (error as Error).message
      });
    }
  };

  updateInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        quantity,
        reservedQuantity,
        lowStockThreshold,
        reorderPoint,
        reorderQuantity,
        lastRestockDate
      } = req.body;

      // Check if inventory item exists
      const existingItem = await this.inventoryRepo.findInventoryItemById(id);
      if (!existingItem) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${id} not found`
        });
        return;
      }

      // Calculate new available quantity if quantity or reservedQuantity is changing
      let availableQuantity;
      if (quantity !== undefined || reservedQuantity !== undefined) {
        const newQuantity = quantity !== undefined ? quantity : existingItem.quantity;
        const newReservedQuantity = reservedQuantity !== undefined ? reservedQuantity : existingItem.reservedQuantity;
        availableQuantity = Math.max(0, newQuantity - newReservedQuantity);
      }

      const updatedItem = await this.inventoryRepo.updateInventoryItem(id, {
        quantity,
        reservedQuantity,
        availableQuantity,
        lowStockThreshold,
        reorderPoint,
        reorderQuantity,
        lastRestockDate
      });

      res.status(200).json({
        success: true,
        data: updatedItem,
        message: 'Inventory item updated successfully'
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory item',
        error: (error as Error).message
      });
    }
  };

  adjustInventoryQuantity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity, reason, reference } = req.body;

      // Basic validation
      if (typeof quantity !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Quantity adjustment value is required and must be a number'
        });
        return;
      }

      // Check if inventory item exists
      const existingItem = await this.inventoryRepo.findInventoryItemById(id);
      if (!existingItem) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${id} not found`
        });
        return;
      }

      // Create transaction for the adjustment
      await this.inventoryRepo.createTransaction({
        inventoryId: id,
        transactionType: 'adjustment',
        quantity,
        notes: reason || 'Manual inventory adjustment',
        reference: reference || undefined,
        createdBy: req.body.userId || 'system'
      });

      // Get the updated inventory item
      const updatedItem = await this.inventoryRepo.findInventoryItemById(id);

      res.status(200).json({
        success: true,
        data: updatedItem,
        message: 'Inventory quantity adjusted successfully'
      });
    } catch (error) {
      console.error('Error adjusting inventory quantity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust inventory quantity',
        error: (error as Error).message
      });
    }
  };

  deleteInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if inventory item exists
      const existingItem = await this.inventoryRepo.findInventoryItemById(id);
      if (!existingItem) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${id} not found`
        });
        return;
      }

      // Check if item has transactions or reservations before allowing deletion
      const transactions = await this.inventoryRepo.findTransactionsByInventoryId(id);
      if (transactions.length > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete inventory item with ID ${id} as it has associated transactions`
        });
        return;
      }

      const deleted = await this.inventoryRepo.deleteInventoryItem(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Inventory item deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete inventory item'
        });
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete inventory item',
        error: (error as Error).message
      });
    }
  };

  // Inventory Location Endpoints
  getLocations = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const locations = await this.inventoryRepo.findAllLocations(includeInactive);

      res.status(200).json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Error fetching inventory locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory locations',
        error: (error as Error).message
      });
    }
  };

  getLocationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const location = await this.inventoryRepo.findLocationById(id);

      if (!location) {
        res.status(404).json({
          success: false,
          message: `Inventory location with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error('Error fetching inventory location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory location',
        error: (error as Error).message
      });
    }
  };

  getLocationInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if location exists
      const location = await this.inventoryRepo.findLocationById(id);
      if (!location) {
        res.status(404).json({
          success: false,
          message: `Inventory location with ID ${id} not found`
        });
        return;
      }
      
      const items = await this.inventoryRepo.findInventoryItemsByLocationId(id);

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching location inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch location inventory',
        error: (error as Error).message
      });
    }
  };

  createLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        type,
        address,
        city,
        state,
        country,
        postalCode,
        isActive = true
      } = req.body;

      // Basic validation
      if (!name || !type) {
        res.status(400).json({
          success: false,
          message: 'Name and type are required'
        });
        return;
      }

      const location = await this.inventoryRepo.createLocation({
        name,
        type,
        address,
        city,
        state,
        country,
        postalCode,
        isActive
      });

      res.status(201).json({
        success: true,
        data: location,
        message: 'Inventory location created successfully'
      });
    } catch (error) {
      console.error('Error creating inventory location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create inventory location',
        error: (error as Error).message
      });
    }
  };

  updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        address,
        city,
        state,
        country,
        postalCode,
        isActive
      } = req.body;

      // Check if location exists
      const existingLocation = await this.inventoryRepo.findLocationById(id);
      if (!existingLocation) {
        res.status(404).json({
          success: false,
          message: `Inventory location with ID ${id} not found`
        });
        return;
      }

      const updatedLocation = await this.inventoryRepo.updateLocation(id, {
        name,
        type,
        address,
        city,
        state,
        country,
        postalCode,
        isActive
      });

      res.status(200).json({
        success: true,
        data: updatedLocation,
        message: 'Inventory location updated successfully'
      });
    } catch (error) {
      console.error('Error updating inventory location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory location',
        error: (error as Error).message
      });
    }
  };

  deleteLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if location exists
      const existingLocation = await this.inventoryRepo.findLocationById(id);
      if (!existingLocation) {
        res.status(404).json({
          success: false,
          message: `Inventory location with ID ${id} not found`
        });
        return;
      }

      try {
        const deleted = await this.inventoryRepo.deleteLocation(id);

        if (deleted) {
          res.status(200).json({
            success: true,
            message: 'Inventory location deleted successfully'
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to delete inventory location'
          });
        }
      } catch (error) {
        // Handle the specific error from the repository about associated items
        if ((error as Error).message.includes('as it has associated inventory items')) {
          res.status(400).json({
            success: false,
            message: (error as Error).message
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error deleting inventory location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete inventory location',
        error: (error as Error).message
      });
    }
  };

  // Inventory Transaction Endpoints
  getTransactionsByInventoryId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inventoryId } = req.params;
      
      // Check if inventory item exists
      const item = await this.inventoryRepo.findInventoryItemById(inventoryId);
      if (!item) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${inventoryId} not found`
        });
        return;
      }
      
      const transactions = await this.inventoryRepo.findTransactionsByInventoryId(inventoryId);

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory transactions',
        error: (error as Error).message
      });
    }
  };

  getTransactionsByReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reference } = req.params;
      const transactions = await this.inventoryRepo.findTransactionsByReference(reference);

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching inventory transactions by reference:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory transactions by reference',
        error: (error as Error).message
      });
    }
  };

  createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        inventoryId,
        transactionType,
        quantity,
        sourceLocationId,
        destinationLocationId,
        reference,
        notes,
        createdBy
      } = req.body;

      // Basic validation
      if (!inventoryId || !transactionType || typeof quantity !== 'number' || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'inventoryId, transactionType, quantity, and createdBy are required'
        });
        return;
      }

      const transaction = await this.inventoryRepo.createTransaction({
        inventoryId,
        transactionType,
        quantity,
        sourceLocationId,
        destinationLocationId,
        reference,
        notes,
        createdBy
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Inventory transaction created successfully'
      });
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create inventory transaction',
        error: (error as Error).message
      });
    }
  };

  // Inventory Reservation Endpoints
  getReservationsByInventoryId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inventoryId } = req.params;
      
      // Check if inventory item exists
      const item = await this.inventoryRepo.findInventoryItemById(inventoryId);
      if (!item) {
        res.status(404).json({
          success: false,
          message: `Inventory item with ID ${inventoryId} not found`
        });
        return;
      }
      
      const reservations = await this.inventoryRepo.findReservationsByInventoryId(inventoryId);

      res.status(200).json({
        success: true,
        data: reservations
      });
    } catch (error) {
      console.error('Error fetching inventory reservations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory reservations',
        error: (error as Error).message
      });
    }
  };

  getReservationsByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const reservations = await this.inventoryRepo.findReservationsByOrderId(orderId);

      res.status(200).json({
        success: true,
        data: reservations
      });
    } catch (error) {
      console.error('Error fetching inventory reservations by order ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory reservations by order ID',
        error: (error as Error).message
      });
    }
  };

  getReservationsByCartId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId } = req.params;
      const reservations = await this.inventoryRepo.findReservationsByCartId(cartId);

      res.status(200).json({
        success: true,
        data: reservations
      });
    } catch (error) {
      console.error('Error fetching inventory reservations by cart ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory reservations by cart ID',
        error: (error as Error).message
      });
    }
  };

  createReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        inventoryId,
        quantity,
        orderId,
        cartId,
        expiresAt,
        status = 'active'
      } = req.body;

      // Basic validation
      if (!inventoryId || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          message: 'inventoryId and a positive quantity are required'
        });
        return;
      }

      if (!orderId && !cartId) {
        res.status(400).json({
          success: false,
          message: 'Either orderId or cartId is required'
        });
        return;
      }

      if (!expiresAt) {
        res.status(400).json({
          success: false,
          message: 'expiresAt timestamp is required'
        });
        return;
      }

      const reservation = await this.inventoryRepo.createReservation({
        inventoryId,
        quantity,
        orderId,
        cartId,
        expiresAt,
        status
      });

      res.status(201).json({
        success: true,
        data: reservation,
        message: 'Inventory reservation created successfully'
      });
    } catch (error) {
      console.error('Error creating inventory reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create inventory reservation',
        error: (error as Error).message
      });
    }
  };

  updateReservationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Basic validation
      if (!status || !['active', 'fulfilled', 'expired', 'cancelled'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (active, fulfilled, expired, cancelled) is required'
        });
        return;
      }

      // Check if reservation exists
      const existingReservation = await this.inventoryRepo.findReservationById(id);
      if (!existingReservation) {
        res.status(404).json({
          success: false,
          message: `Inventory reservation with ID ${id} not found`
        });
        return;
      }

      try {
        const updatedReservation = await this.inventoryRepo.updateReservationStatus(id, status as any);

        res.status(200).json({
          success: true,
          data: updatedReservation,
          message: 'Inventory reservation status updated successfully'
        });
      } catch (error) {
        if ((error as Error).message.includes('Invalid status transition')) {
          res.status(400).json({
            success: false,
            message: (error as Error).message
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating inventory reservation status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory reservation status',
        error: (error as Error).message
      });
    }
  };

  // Product Availability Endpoints
  checkProductAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const quantity = parseInt(req.query.quantity as string) || 1;
      
      const availability = await this.inventoryRepo.checkProductAvailability(productId, quantity);
      const productInventory = await this.inventoryRepo.updateProductAvailability(productId);

      res.status(200).json({
        success: true,
        data: {
          productId,
          available: availability,
          totalQuantity: productInventory.totalQuantity,
          totalAvailable: productInventory.totalAvailable,
          requestedQuantity: quantity
        }
      });
    } catch (error) {
      console.error('Error checking product availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check product availability',
        error: (error as Error).message
      });
    }
  };
}
