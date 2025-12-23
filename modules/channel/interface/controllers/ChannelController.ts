/**
 * Channel Controller
 *
 * HTTP interface for channel management.
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { channelRepository } from '../../infrastructure/repositories/ChannelRepository';
import {
  CreateChannelUseCase,
  UpdateChannelUseCase,
  GetChannelUseCase,
  ListChannelsUseCase,
  AssignProductsToChannelUseCase,
  AssignWarehouseToChannelUseCase,
} from '../../application/useCases';

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new CreateChannelUseCase(channelRepository);
    const result = await useCase.execute({
      name: req.body.name,
      code: req.body.code,
      type: req.body.type,
      ownerType: req.body.ownerType,
      ownerId: req.body.ownerId,
      storeIds: req.body.storeIds,
      defaultStoreId: req.body.defaultStoreId,
      catalogId: req.body.catalogId,
      priceListId: req.body.priceListId,
      currencyCode: req.body.currencyCode,
      localeCode: req.body.localeCode,
      warehouseIds: req.body.warehouseIds,
      fulfillmentStrategy: req.body.fulfillmentStrategy,
      requiresApproval: req.body.requiresApproval,
      allowCreditPayment: req.body.allowCreditPayment,
      b2bPricingEnabled: req.body.b2bPricingEnabled,
      commissionRate: req.body.commissionRate,
      merchantVisible: req.body.merchantVisible,
      isActive: req.body.isActive,
      isDefault: req.body.isDefault,
      settings: req.body.settings,
    });
    res.status(201).json({ success: true, data: result.channel });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new GetChannelUseCase(channelRepository);
    const result = await useCase.execute({
      channelId: req.params.channelId,
      code: req.query.code as string | undefined,
    });
    if (!result.channel) {
      res.status(404).json({ success: false, error: 'Channel not found' });
      return;
    }
    res.json({ success: true, data: result.channel });
  } catch (error: any) {
    logger.error('Error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new UpdateChannelUseCase(channelRepository);
    const result = await useCase.execute({
      channelId: req.params.channelId,
      name: req.body.name,
      catalogId: req.body.catalogId,
      priceListId: req.body.priceListId,
      currencyCode: req.body.currencyCode,
      localeCode: req.body.localeCode,
      fulfillmentStrategy: req.body.fulfillmentStrategy,
      requiresApproval: req.body.requiresApproval,
      allowCreditPayment: req.body.allowCreditPayment,
      b2bPricingEnabled: req.body.b2bPricingEnabled,
      commissionRate: req.body.commissionRate,
      merchantVisible: req.body.merchantVisible,
      settings: req.body.settings,
    });
    res.json({ success: true, data: result.channel });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new ListChannelsUseCase(channelRepository);
    const result = await useCase.execute({
      type: req.query.type as string | undefined,
      ownerType: req.query.ownerType as string | undefined,
      ownerId: req.query.ownerId as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json({ success: true, data: result.channels });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const assignProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new AssignProductsToChannelUseCase(channelRepository);
    const result = await useCase.execute({
      channelId: req.params.channelId,
      productIds: req.body.productIds,
      isVisible: req.body.isVisible,
      isFeatured: req.body.isFeatured,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const assignWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new AssignWarehouseToChannelUseCase(channelRepository);
    const result = await useCase.execute({
      channelId: req.params.channelId,
      warehouseIds: req.body.warehouseIds,
    });
    res.json({ success: true, data: result.channel });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createChannel,
  getChannel,
  updateChannel,
  listChannels,
  assignProducts,
  assignWarehouse,
};
