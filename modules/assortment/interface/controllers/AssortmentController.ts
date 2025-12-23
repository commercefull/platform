/**
 * Assortment Controller
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import {
  CreateAssortmentUseCase,
  GetAssortmentUseCase,
  ListAssortmentsUseCase,
  AddItemToAssortmentUseCase,
  RemoveItemFromAssortmentUseCase,
  SetAssortmentScopeUseCase,
  GetVisibleProductsUseCase,
} from '../../application/useCases';

export const createAssortment = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new CreateAssortmentUseCase();
    const result = await useCase.execute({
      organizationId: req.body.organizationId,
      name: req.body.name,
      description: req.body.description,
      scopeType: req.body.scopeType,
      isDefault: req.body.isDefault,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAssortment = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new GetAssortmentUseCase();
    const result = await useCase.execute({
      assortmentId: req.params.assortmentId,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const listAssortments = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new ListAssortmentsUseCase();
    const result = await useCase.execute({
      organizationId: req.query.organizationId as string,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new AddItemToAssortmentUseCase();
    const result = await useCase.execute({
      assortmentId: req.params.assortmentId,
      productVariantId: req.body.productVariantId,
      visibility: req.body.visibility,
      buyable: req.body.buyable,
      minQty: req.body.minQty,
      maxQty: req.body.maxQty,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new RemoveItemFromAssortmentUseCase();
    const result = await useCase.execute({
      assortmentId: req.params.assortmentId,
      productVariantId: req.params.productVariantId,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const setScope = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new SetAssortmentScopeUseCase();
    const result = await useCase.execute({
      assortmentId: req.params.assortmentId,
      storeId: req.body.storeId,
      sellerId: req.body.sellerId,
      accountId: req.body.accountId,
      channelId: req.body.channelId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getVisibleProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new GetVisibleProductsUseCase();
    const result = await useCase.execute({
      storeId: req.params.storeId,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createAssortment,
  getAssortment,
  listAssortments,
  addItem,
  removeItem,
  setScope,
  getVisibleProducts,
};
