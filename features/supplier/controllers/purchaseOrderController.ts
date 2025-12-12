import { Request, Response } from 'express';
import PurchaseOrderRepo from '../repos/purchaseOrderRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../libs/apiResponse';

// Use the singleton instance directly
const purchaseOrderRepo = PurchaseOrderRepo;

// ---------- Purchase Order CRUD Methods ----------
export const getPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      supplierId,
      warehouseId,
      limit = '50',
      offset = '0'
    } = req.query;

    let purchaseOrders;

    if (status) {
      purchaseOrders = await purchaseOrderRepo.findByStatus(status as any, parseInt(limit as string), parseInt(offset as string));
    } else if (supplierId) {
      purchaseOrders = await purchaseOrderRepo.findBySupplierId(supplierId as string, parseInt(limit as string), parseInt(offset as string));
    } else if (warehouseId) {
      purchaseOrders = await purchaseOrderRepo.findByWarehouseId(warehouseId as string, parseInt(limit as string), parseInt(offset as string));
    } else {
      // TODO: Implement findAll method if needed
      successResponse(res, []);
      return;
    }

    successResponse(res, purchaseOrders);
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    errorResponse(res, 'Failed to fetch purchase orders');
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrderRepo.findById(id);

    if (!purchaseOrder) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, purchaseOrder);
  } catch (error: any) {
    console.error(`Error fetching purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to fetch purchase order');
  }
};

export const getPurchaseOrdersBySupplierId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const purchaseOrders = await purchaseOrderRepo.findBySupplierId(
      id,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    successResponse(res, purchaseOrders);
  } catch (error: any) {
    console.error(`Error fetching purchase orders for supplier ${req.params.id}:`, error);
    errorResponse(res, 'Failed to fetch purchase orders');
  }
};

export const createPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      supplierId,
      warehouseId,
      status,
      orderType,
      priority,
      orderDate,
      expectedDeliveryDate,
      deliveryDate,
      shippingMethod,
      trackingNumber,
      carrierName,
      paymentTerms,
      currency,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      notes,
      supplierNotes,
      attachments,
      items // Array of purchase order items
    } = req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!supplierId) errors.push('supplierId is required');
    if (!warehouseId) errors.push('warehouseId is required');
    if (!items || !Array.isArray(items) || items.length === 0) errors.push('items array is required and must not be empty');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    // Create purchase order
    const poParams = {
      supplierId,
      warehouseId,
      status,
      orderType,
      priority,
      orderDate,
      expectedDeliveryDate,
      deliveryDate,
      shippingMethod,
      trackingNumber,
      carrierName,
      paymentTerms,
      currency,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      notes,
      supplierNotes,
      attachments
    };

    const purchaseOrder = await purchaseOrderRepo.create(poParams);

    // Create purchase order items
    const createdItems = [];
    for (const item of items) {
      const itemParams = {
        purchaseOrderId: purchaseOrder.purchaseOrderId,
        ...item
      };
      const createdItem = await purchaseOrderRepo.createItem(itemParams);
      createdItems.push(createdItem);
    }

    successResponse(res, {
      purchaseOrder,
      items: createdItems
    }, 201);
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    errorResponse(res, 'Failed to create purchase order');
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const purchaseOrder = await purchaseOrderRepo.update(id, updateParams);

    if (!purchaseOrder) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, purchaseOrder);
  } catch (error: any) {
    console.error(`Error updating purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to update purchase order');
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await purchaseOrderRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to delete purchase order');
  }
};

export const approvePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrderRepo.approve(id);

    if (!purchaseOrder) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, purchaseOrder);
  } catch (error: any) {
    console.error(`Error approving purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to approve purchase order');
  }
};

export const cancelPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrderRepo.cancel(id);

    if (!purchaseOrder) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, purchaseOrder);
  } catch (error: any) {
    console.error(`Error cancelling purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to cancel purchase order');
  }
};

export const sendPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrderRepo.send(id);

    if (!purchaseOrder) {
      errorResponse(res, `Purchase order with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, purchaseOrder);
  } catch (error: any) {
    console.error(`Error sending purchase order ${req.params.id}:`, error);
    errorResponse(res, 'Failed to send purchase order');
  }
};

// ---------- Purchase Order Items Methods ----------

export const getPurchaseOrderItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const items = await purchaseOrderRepo.findItemsByOrderId(id);
    successResponse(res, items);
  } catch (error: any) {
    console.error(`Error fetching purchase order items ${req.params.id}:`, error);
    errorResponse(res, 'Failed to fetch purchase order items');
  }
};

export const addPurchaseOrderItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const itemParams = {
      purchaseOrderId: id,
      ...req.body
    };

    // Validate required fields
    const errors: string[] = [];
    if (!itemParams.productId) errors.push('productId is required');
    if (!itemParams.sku) errors.push('sku is required');
    if (!itemParams.name) errors.push('name is required');
    if (!itemParams.quantity || itemParams.quantity <= 0) errors.push('quantity must be greater than 0');
    if (!itemParams.unitCost || itemParams.unitCost < 0) errors.push('unitCost must be non-negative');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const item = await purchaseOrderRepo.createItem(itemParams);
    successResponse(res, item, 201);
  } catch (error: any) {
    console.error(`Error adding purchase order item ${req.params.id}:`, error);
    errorResponse(res, 'Failed to add purchase order item');
  }
};

export const updatePurchaseOrderItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const item = await purchaseOrderRepo.updateItem(id, updateParams);

    if (!item) {
      errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, item);
  } catch (error: any) {
    console.error(`Error updating purchase order item ${req.params.id}:`, error);
    errorResponse(res, 'Failed to update purchase order item');
  }
};

export const deletePurchaseOrderItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await purchaseOrderRepo.deleteItem(id);

    if (!deleted) {
      errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Purchase order item deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting purchase order item ${req.params.id}:`, error);
    errorResponse(res, 'Failed to delete purchase order item');
  }
};
