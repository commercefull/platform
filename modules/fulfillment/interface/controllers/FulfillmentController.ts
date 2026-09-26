/**
 * Fulfillment Controller
 *
 * HTTP interface for fulfillment management.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import { FulfillmentStatus, SourceType, Address } from '../../domain/entities/Fulfillment';
import { AppError } from '../../../../libs/errors';
import {
  cancelFulfillmentUseCase,
  createFulfillmentUseCase,
  getFulfillmentUseCase,
  initiateReturnUseCase,
  manageFulfillmentsUseCase,
  markDeliveredUseCase,
  processPackingUseCase,
  processPickingUseCase,
  shipOrderUseCase,
  updateTrackingUseCase,
} from '../../application/wired';

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface CreateFulfillmentBody {
  orderId: string;
  orderNumber?: string;
  sourceType: SourceType;
  sourceId: string;
  organizationId?: string;
  supplierId?: string;
  storeId?: string;
  channelId?: string;
  shipFromAddress: Address;
  shipToAddress: Address;
  carrierId?: string;
  carrierName?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  fulfillmentPartnerId?: string;
  items: Array<{ orderItemId: string; productId: string; variantId?: string; sku: string; name: string; quantityOrdered: number }>;
  notes?: string;
}

interface ProcessPickingBody {
  items: Array<{ fulfillmentItemId: string; quantityPicked: number; serialNumbers?: string[]; lotNumbers?: string[] }>;
  completePickingProcess?: boolean;
}

interface ShipOrderBody {
  trackingNumber: string;
  trackingUrl?: string;
  carrierId?: string;
  carrierName?: string;
  shippingCostCents?: number;
}

interface ProcessPackingBody {
  completePackingProcess?: boolean;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}

interface CancelFulfillmentBody {
  reason: string;
}

interface UpdateTrackingBody {
  trackingNumber: string;
  trackingUrl?: string;
}

interface InitiateReturnBody {
  reason: string;
}

export const createFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as CreateFulfillmentBody;
  if (!body.orderId?.trim()) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }
  if (!body.sourceType?.trim()) {
    res.status(400).json({ success: false, error: 'sourceType is required' });
    return;
  }
  if (!body.sourceId?.trim()) {
    res.status(400).json({ success: false, error: 'sourceId is required' });
    return;
  }
  if (!body.shipFromAddress) {
    res.status(400).json({ success: false, error: 'shipFromAddress is required' });
    return;
  }
  if (!body.shipToAddress) {
    res.status(400).json({ success: false, error: 'shipToAddress is required' });
    return;
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ success: false, error: 'items is required and must be a non-empty array' });
    return;
  }
  const useCase = createFulfillmentUseCase;
  const result = await useCase.execute({
    orderId: body.orderId,
    orderNumber: body.orderNumber,
    sourceType: body.sourceType,
    sourceId: body.sourceId,
    organizationId: body.organizationId,
    supplierId: body.supplierId,
    storeId: body.storeId,
    channelId: body.channelId,
    shipFromAddress: body.shipFromAddress,
    shipToAddress: body.shipToAddress,
    carrierId: body.carrierId,
    carrierName: body.carrierName,
    shippingMethodId: body.shippingMethodId,
    shippingMethodName: body.shippingMethodName,
    fulfillmentPartnerId: body.fulfillmentPartnerId,
    items: body.items,
    notes: body.notes,
  });
  // Serialize domain entities to plain objects
  const plain = {
    fulfillment: result.fulfillment.toPersistence(),
    items: result.items.map(i => i.toPersistence()),
  };
  res.status(201).json({ success: true, data: plain });
};

export const getFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = getFulfillmentUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    trackingNumber: req.query.trackingNumber as string | undefined,
  });
  if (!result.fulfillment) {
    res.status(404).json({ success: false, error: 'Fulfillment not found' });
    return;
  }
  res.json({ success: true, data: result });
};

export const processPicking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as ProcessPickingBody;
  const useCase = processPickingUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    items: body.items,
    completePickingProcess: body.completePickingProcess,
  });
  res.json({ success: true, data: result });
};

export const shipOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as ShipOrderBody;
  const useCase = shipOrderUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
    carrierId: body.carrierId,
    carrierName: body.carrierName,
    shippingCostCents: body.shippingCostCents,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const markDelivered = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = markDeliveredUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const listFulfillmentsByOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const fulfillments = await manageFulfillmentsUseCase.findByOrderId(req.params.orderId);
  res.json({ success: true, data: fulfillments.map(f => f.toPersistence()) });
};

export const listFulfillments = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await manageFulfillmentsUseCase.findAll(
    {
      orderId: req.query.orderId as string | undefined,
      status: req.query.status as FulfillmentStatus | FulfillmentStatus[] | undefined,
      sourceType: req.query.sourceType as SourceType | undefined,
      organizationId: req.query.organizationId as string | undefined,
      storeId: req.query.storeId as string | undefined,
    },
    {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      offset: req.query.page
        ? (parseInt(req.query.page as string, 10) - 1) * (req.query.limit ? parseInt(req.query.limit as string, 10) : 20)
        : 0,
    },
  );
  res.json({ success: true, data: result });
};

export const processPacking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as ProcessPackingBody;
  const useCase = processPackingUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    completePackingProcess: body.completePackingProcess ?? false,
    weight: body.weight,
    dimensions: body.dimensions,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const cancelFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as CancelFulfillmentBody;
  const useCase = cancelFulfillmentUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    reason: body.reason,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const updateTracking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as UpdateTrackingBody;
  const useCase = updateTrackingUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const initiateReturn = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as InitiateReturnBody;
  const useCase = initiateReturnUseCase;
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    reason: body.reason,
  });
  res.json({ success: true, data: result });
};

export const getTrackingInfo = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const fulfillment = await manageFulfillmentsUseCase.findById(req.params.fulfillmentId);
  if (!fulfillment) {
    res.status(404).json({ success: false, error: 'Fulfillment not found' });
    return;
  }
  res.json({
    success: true,
    data: {
      fulfillmentId: fulfillment.fulfillmentId,
      status: fulfillment.status,
      trackingNumber: fulfillment.trackingNumber,
      trackingUrl: fulfillment.trackingUrl,
      carrierName: fulfillment.carrierName,
      shippedAt: fulfillment.shippedAt,
      deliveredAt: fulfillment.deliveredAt,
    },
  });
};

export const assignFulfillment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { fulfillmentId } = req.params;
  const { sourceType, sourceId } = req.body as {
    sourceType: SourceType;
    sourceId: string;
  };

  if (!sourceType || !sourceId) {
    res.status(400).json({ success: false, error: 'sourceType and sourceId are required' });
    return;
  }

  try {
    const saved = await manageFulfillmentsUseCase.assign(fulfillmentId, sourceType, sourceId);
    res.json({ success: true, data: saved });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign fulfillment',
    });
  }
};
