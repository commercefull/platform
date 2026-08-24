import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import supplierPurchaseOrderDataRepository from '../../infrastructure/repositories/SupplierPurchaseOrderDataRepository';
import type {
  SupplierPurchaseOrderStatus,
  SupplierPurchaseOrderCreateParams,
  SupplierPurchaseOrderUpdateParams,
  SupplierPurchaseOrderItemCreateParams,
  SupplierPurchaseOrderItemUpdateParams,
} from '../../infrastructure/repositories/SupplierPurchaseOrderDataRepository';
import supplierDataRepository from '../../infrastructure/repositories/SupplierDataRepository';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';

// Use the singleton instance directly
const purchaseOrderRepo = supplierPurchaseOrderDataRepository.purchaseOrders;
const supplierRepoInstance = supplierDataRepository.suppliers;
const supplierRepo = supplierRepoInstance;

// ---------- Purchase Order CRUD Methods ----------
export const getPurchaseOrders = async (req: TypedRequest, res: Response): Promise<void> => {
  const { status, supplierId, warehouseId, limit = '50', offset = '0' } = req.query;

  let purchaseOrders;

  if (status) {
    purchaseOrders = await purchaseOrderRepo.findByStatus(
      status as SupplierPurchaseOrderStatus,
      parseInt(limit as string),
      parseInt(offset as string),
    );
  } else if (supplierId) {
    purchaseOrders = await purchaseOrderRepo.findBySupplierId(
      supplierId as string,
      parseInt(limit as string),
      parseInt(offset as string),
    );
  } else if (warehouseId) {
    purchaseOrders = await purchaseOrderRepo.findByWarehouseId(
      warehouseId as string,
      parseInt(limit as string),
      parseInt(offset as string),
    );
  } else {
    purchaseOrders = await purchaseOrderRepo.findAll(parseInt(limit as string), parseInt(offset as string));
  }

  successResponse(res, purchaseOrders);
};

export const getPurchaseOrderById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await purchaseOrderRepo.findById(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const getPurchaseOrdersBySupplierId = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const purchaseOrders = await purchaseOrderRepo.findBySupplierId(id, parseInt(limit as string), parseInt(offset as string));

  successResponse(res, purchaseOrders);
};

export const createPurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const {
    supplierId,
    distributionWarehouseId,
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
    items, // Array of purchase order items
  } = req.body as SupplierPurchaseOrderCreateParams & { items: SupplierPurchaseOrderItemCreateParams[] };

  // Validate required fields
  const errors: string[] = [];
  if (!supplierId) errors.push('supplierId is required');
  if (!distributionWarehouseId) errors.push('distributionWarehouseId is required');
  if (!items || !Array.isArray(items) || items.length === 0) errors.push('items array is required and must not be empty');

  if (errors.length > 0) {
    validationErrorResponse(res, errors);
    return;
  }

  // Validate supplier exists
  const supplier = await supplierRepo.findById(supplierId);
  if (!supplier) {
    validationErrorResponse(res, ['Supplier not found']);
    return;
  }

  // Create purchase order
  const poParams = {
    supplierId,
    distributionWarehouseId,
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
  };

  const purchaseOrder = await purchaseOrderRepo.create(poParams);

  // Create purchase order items
  const createdItems = [];
  for (const item of items) {
    const itemParams: SupplierPurchaseOrderItemCreateParams = {
      ...item,
      total: item.total ?? (item.quantity * item.unitCost),
      supplierPurchaseOrderId: purchaseOrder.supplierPurchaseOrderId,
    };
    const createdItem = await purchaseOrderRepo.createItem(itemParams);
    createdItems.push(createdItem);
  }

  successResponse(
    res,
    {
      purchaseOrder,
      items: createdItems,
    },
    201,
  );
};

export const updatePurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierPurchaseOrderUpdateParams;

  const purchaseOrder = await purchaseOrderRepo.update(id, updateParams);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const deletePurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await purchaseOrderRepo.delete(id);

  if (!deleted) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Purchase order deleted successfully' });
};

export const approvePurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await purchaseOrderRepo.approve(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const cancelPurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await purchaseOrderRepo.cancel(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const sendPurchaseOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await purchaseOrderRepo.send(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

// ---------- Purchase Order Items Methods ----------

export const getPurchaseOrderItems = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const items = await purchaseOrderRepo.findItemsByOrderId(id);
  successResponse(res, items);
};

export const addPurchaseOrderItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Omit<SupplierPurchaseOrderItemCreateParams, 'supplierPurchaseOrderId'>;
  const itemParams: SupplierPurchaseOrderItemCreateParams = {
    supplierPurchaseOrderId: id,
    ...body,
    total: body.total ?? (body.quantity * body.unitCost),
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
};

export const updatePurchaseOrderItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierPurchaseOrderItemUpdateParams;

  const item = await purchaseOrderRepo.updateItem(id, updateParams);

  if (!item) {
    errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, item);
};

export const deletePurchaseOrderItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await purchaseOrderRepo.deleteItem(id);

  if (!deleted) {
    errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Purchase order item deleted successfully' });
};
