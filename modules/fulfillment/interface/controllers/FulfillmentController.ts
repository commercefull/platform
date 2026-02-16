/**
 * Fulfillment Controller
 *
 * HTTP interface for fulfillment management.
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { fulfillmentRepository } from '../../infrastructure/repositories/FulfillmentRepository';
import {
  CreateFulfillmentUseCase,
  GetFulfillmentUseCase,
  ProcessPickingUseCase,
  ProcessPackingUseCase,
  ShipOrderUseCase,
  MarkDeliveredUseCase,
  CancelFulfillmentUseCase,
  UpdateTrackingUseCase,
} from '../../application/useCases';

export const createFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new CreateFulfillmentUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      orderId: req.body.orderId,
      orderNumber: req.body.orderNumber,
      sourceType: req.body.sourceType,
      sourceId: req.body.sourceId,
      merchantId: req.body.merchantId,
      supplierId: req.body.supplierId,
      storeId: req.body.storeId,
      channelId: req.body.channelId,
      shipFromAddress: req.body.shipFromAddress,
      shipToAddress: req.body.shipToAddress,
      carrierId: req.body.carrierId,
      carrierName: req.body.carrierName,
      shippingMethodId: req.body.shippingMethodId,
      shippingMethodName: req.body.shippingMethodName,
      fulfillmentPartnerId: req.body.fulfillmentPartnerId,
      items: req.body.items,
      notes: req.body.notes,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const processPicking = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ProcessPickingUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
      items: req.body.items,
      completePickingProcess: req.body.completePickingProcess,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const shipOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ShipOrderUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
      trackingNumber: req.body.trackingNumber,
      trackingUrl: req.body.trackingUrl,
      carrierId: req.body.carrierId,
      carrierName: req.body.carrierName,
      shippingCost: req.body.shippingCost,
    });
    res.json({ success: true, data: result.fulfillment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const markDelivered = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new MarkDeliveredUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
    });
    res.json({ success: true, data: result.fulfillment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listFulfillmentsByOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const fulfillments = await fulfillmentRepository.findByOrderId(req.params.orderId);
    res.json({ success: true, data: fulfillments });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listFulfillments = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentRepository.findAll(
      {
        orderId: req.query.orderId as string | undefined,
        status: req.query.status as any,
        sourceType: req.query.sourceType as any,
        merchantId: req.query.merchantId as string | undefined,
        storeId: req.query.storeId as string | undefined,
      },
      {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      },
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const processPacking = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ProcessPackingUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
      completePackingProcess: req.body.completePackingProcess ?? false,
      weight: req.body.weight,
      dimensions: req.body.dimensions,
    });
    res.json({ success: true, data: result.fulfillment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const cancelFulfillment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new CancelFulfillmentUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
      reason: req.body.reason,
    });
    res.json({ success: true, data: result.fulfillment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateTracking = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new UpdateTrackingUseCase(fulfillmentRepository);
    const result = await useCase.execute({
      fulfillmentId: req.params.fulfillmentId,
      trackingNumber: req.body.trackingNumber,
      trackingUrl: req.body.trackingUrl,
    });
    res.json({ success: true, data: result.fulfillment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const initiateReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const fulfillment = await fulfillmentRepository.findById(req.params.fulfillmentId);
    if (!fulfillment) {
      res.status(404).json({ success: false, error: 'Fulfillment not found' });
      return;
    }
    fulfillment.markReturned();
    const saved = await fulfillmentRepository.save(fulfillment);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getTrackingInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
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
};
