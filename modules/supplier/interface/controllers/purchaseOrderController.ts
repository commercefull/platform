import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { createSupplierPurchaseOrderUseCase, managePurchaseOrdersUseCase } from '../../application/wired';
import {
  SupplierPurchaseOrderCreateParams,
  SupplierPurchaseOrderUpdateParams,
  SupplierPurchaseOrderItemCreateParams,
  SupplierPurchaseOrderItemUpdateParams,
} from '../../application/wired';
import { CreateSupplierPurchaseOrderInput } from '../../application/useCases/CreateSupplierPurchaseOrder';
import { SupplierNotFoundError, SupplierValidationError } from '../../domain/errors/SupplierErrors';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

// ---------- Purchase Order CRUD Methods ----------
export const getPurchaseOrders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, supplierId, warehouseId, limit = '50', offset = '0' } = req.query;

  const purchaseOrders = await managePurchaseOrdersUseCase.listPurchaseOrders({
    status: status as string | undefined,
    supplierId: supplierId as string | undefined,
    warehouseId: warehouseId as string | undefined,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  successResponse(res, purchaseOrders);
};

export const getPurchaseOrderById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await managePurchaseOrdersUseCase.getPurchaseOrder(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const getPurchaseOrdersBySupplierId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const purchaseOrders = await managePurchaseOrdersUseCase.listPurchaseOrders({
    supplierId: id,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  successResponse(res, purchaseOrders);
};

export const createPurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
    subtotalCents,
    taxCents,
    shippingCents,
    discountCents,
    totalCents,
    notes,
    supplierNotes,
    attachments,
    items, // Array of purchase order items
  } = req.body as SupplierPurchaseOrderCreateParams & { items: SupplierPurchaseOrderItemCreateParams[]; currency?: string };

  try {
    const result = await createSupplierPurchaseOrderUseCase.execute({
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
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      totalCents,
      notes,
      supplierNotes,
      attachments,
      items,
    } as CreateSupplierPurchaseOrderInput);

    successResponse(
      res,
      {
        purchaseOrder: result.purchaseOrder,
        items: result.items,
      },
      201,
    );
  } catch (error) {
    if (error instanceof SupplierNotFoundError) {
      validationErrorResponse(res, ['Supplier not found']);
      return;
    }
    if (error instanceof SupplierValidationError) {
      validationErrorResponse(res, getErrorMessage(error).split('; '));
      return;
    }
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updatePurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierPurchaseOrderUpdateParams;

  const purchaseOrder = await managePurchaseOrdersUseCase.updatePurchaseOrder(id, updateParams as Record<string, unknown>);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const deletePurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await managePurchaseOrdersUseCase.deletePurchaseOrder(id);

  if (!deleted) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Purchase order deleted successfully' });
};

export const approvePurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await managePurchaseOrdersUseCase.approvePurchaseOrder(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const cancelPurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await managePurchaseOrdersUseCase.cancelPurchaseOrder(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

export const sendPurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const purchaseOrder = await managePurchaseOrdersUseCase.sendPurchaseOrder(id);

  if (!purchaseOrder) {
    errorResponse(res, `Purchase order with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, purchaseOrder);
};

// ---------- Purchase Order Items Methods ----------

export const getPurchaseOrderItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const items = await managePurchaseOrdersUseCase.getItems(id);
  successResponse(res, items);
};

export const addPurchaseOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Omit<SupplierPurchaseOrderItemCreateParams, 'supplierPurchaseOrderId'>;

  try {
    const item = await managePurchaseOrdersUseCase.addItem(id, body);
    successResponse(res, item, 201);
  } catch (error) {
    if (error instanceof SupplierValidationError) {
      validationErrorResponse(res, getErrorMessage(error).split('; '));
      return;
    }
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updatePurchaseOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierPurchaseOrderItemUpdateParams;

  const item = await managePurchaseOrdersUseCase.updateItem(id, updateParams as Record<string, unknown>);

  if (!item) {
    errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, item);
};

export const deletePurchaseOrderItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await managePurchaseOrdersUseCase.deleteItem(id);

  if (!deleted) {
    errorResponse(res, `Purchase order item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Purchase order item deleted successfully' });
};
