/**
 * Fulfillment Controller
 * 
 * HTTP interface for fulfillment management.
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { fulfillmentRepository } from '../../infrastructure/repositories/FulfillmentRepository';
import {
  CreateFulfillmentUseCase,
  GetFulfillmentUseCase,
  ProcessPickingUseCase,
  ShipOrderUseCase,
  MarkDeliveredUseCase,
} from '../../application/useCases';

export const createFulfillment = async (req: Request, res: Response): Promise<void> => {
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

export const getFulfillment = async (req: Request, res: Response): Promise<void> => {
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

export const processPicking = async (req: Request, res: Response): Promise<void> => {
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

export const shipOrder = async (req: Request, res: Response): Promise<void> => {
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

export const markDelivered = async (req: Request, res: Response): Promise<void> => {
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

export const listFulfillmentsByOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const fulfillments = await fulfillmentRepository.findByOrderId(req.params.orderId);
    res.json({ success: true, data: fulfillments });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listFulfillments = async (req: Request, res: Response): Promise<void> => {
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
      }
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createFulfillment,
  getFulfillment,
  processPicking,
  shipOrder,
  markDelivered,
  listFulfillmentsByOrder,
  listFulfillments,
};
