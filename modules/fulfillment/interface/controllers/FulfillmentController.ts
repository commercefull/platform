/**
 * Fulfillment Controller
 *
 * HTTP interface for fulfillment management.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import fulfillmentDataRepository from '../../infrastructure/repositories/FulfillmentDataRepository';

const fulfillmentRepository = fulfillmentDataRepository.fulfillments;
import { FulfillmentStatus, SourceType, Address } from '../../domain/entities/Fulfillment';
import {
  CreateFulfillmentUseCase,
  GetFulfillmentUseCase,
  ProcessPickingUseCase,
  ProcessPackingUseCase,
  ShipOrderUseCase,
  MarkDeliveredUseCase,
  CancelFulfillmentUseCase,
  UpdateTrackingUseCase,
  InitiateReturnUseCase,
} from '../../application/useCases';

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
  shippingCost?: number;
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

export const createFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
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
  const useCase = new CreateFulfillmentUseCase(fulfillmentRepository);
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

export const getFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new GetFulfillmentUseCase(fulfillmentRepository);
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

export const processPicking = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as ProcessPickingBody;
  const useCase = new ProcessPickingUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    items: body.items,
    completePickingProcess: body.completePickingProcess,
  });
  res.json({ success: true, data: result });
};

export const shipOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as ShipOrderBody;
  const useCase = new ShipOrderUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
    carrierId: body.carrierId,
    carrierName: body.carrierName,
    shippingCost: body.shippingCost,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const markDelivered = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new MarkDeliveredUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const listFulfillmentsByOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const fulfillments = await fulfillmentRepository.findByOrderId(req.params.orderId);
  res.json({ success: true, data: fulfillments });
};

export const listFulfillments = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentRepository.findAll(
    {
      orderId: req.query.orderId as string | undefined,
      status: req.query.status as FulfillmentStatus | FulfillmentStatus[] | undefined,
      sourceType: req.query.sourceType as SourceType | undefined,
      organizationId: req.query.organizationId as string | undefined,
      storeId: req.query.storeId as string | undefined,
    },
    {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      offset: req.query.page ? (parseInt(req.query.page as string, 10) - 1) * (req.query.limit ? parseInt(req.query.limit as string, 10) : 20) : 0,
    },
  );
  res.json({ success: true, data: result });
};

export const processPacking = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as ProcessPackingBody;
  const useCase = new ProcessPackingUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    completePackingProcess: body.completePackingProcess ?? false,
    weight: body.weight,
    dimensions: body.dimensions,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const cancelFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as CancelFulfillmentBody;
  const useCase = new CancelFulfillmentUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    reason: body.reason,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const updateTracking = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as UpdateTrackingBody;
  const useCase = new UpdateTrackingUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    trackingNumber: body.trackingNumber,
    trackingUrl: body.trackingUrl,
  });
  res.json({ success: true, data: result.fulfillment });
};

export const initiateReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as InitiateReturnBody;
  const useCase = new InitiateReturnUseCase(fulfillmentRepository);
  const result = await useCase.execute({
    fulfillmentId: req.params.fulfillmentId,
    reason: body.reason,
  });
  res.json({ success: true, data: result });
};

export const getTrackingInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  const fulfillment = await fulfillmentRepository.findById(req.params.fulfillmentId);
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

export const assignFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  const { fulfillmentId } = req.params;
  const { sourceType, sourceId } = req.body as {
    sourceType: SourceType;
    sourceId: string;
  };

  if (!sourceType || !sourceId) {
    res.status(400).json({ success: false, error: 'sourceType and sourceId are required' });
    return;
  }

  const fulfillment = await fulfillmentRepository.findById(fulfillmentId);
  if (!fulfillment) {
    res.status(404).json({ success: false, error: 'Fulfillment not found' });
    return;
  }

  fulfillment.assign(sourceType, sourceId);

  const saved = await fulfillmentRepository.save(fulfillment);
  res.json({ success: true, data: saved });
};

export default {
  createFulfillment,
  getFulfillment,
  processPicking,
  processPacking,
  shipOrder,
  markDelivered,
  cancelFulfillment,
  updateTracking,
  initiateReturn,
  getTrackingInfo,
  listFulfillmentsByOrder,
  listFulfillments,
  assignFulfillment,
};
