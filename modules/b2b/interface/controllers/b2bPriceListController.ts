/**
 * B2B Price List Controller
 * Handlers for B2B price list operations
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { ManageB2BPriceListUseCase } from '../../application/useCases/ManageB2BPriceList';
import * as b2bPriceListRepo from '../../infrastructure/repositories/b2bPriceListRepo';

// ============================================================================
// List Price Lists
// ============================================================================

export const listPriceLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId || (req.query.companyId as string);
    const priceLists = companyId
      ? await b2bPriceListRepo.findByCompany(companyId)
      : await b2bPriceListRepo.findAll();
    successResponse(res, { priceLists });
  } catch (error: any) {
    logger.error('listPriceLists error:', error);
    errorResponse(res, error.message || 'Failed to list price lists');
  }
};

// ============================================================================
// Get Price List
// ============================================================================

export const getPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { priceListId } = req.params;
    const priceList = await b2bPriceListRepo.findById(priceListId);
    if (!priceList) {
      errorResponse(res, 'Price list not found', 404);
      return;
    }
    successResponse(res, { priceList });
  } catch (error: any) {
    logger.error('getPriceList error:', error);
    errorResponse(res, error.message || 'Failed to get price list');
  }
};

// ============================================================================
// Create Price List
// ============================================================================

export const createPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId;
    const { name, currency, isActive, notes, items } = req.body;
    if (!name) {
      errorResponse(res, 'name is required', 400);
      return;
    }
    const useCase = new ManageB2BPriceListUseCase();
    const result = await useCase.execute({ b2bCompanyId: companyId, name, currency, isActive, notes, items });
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to create price list', 400);
      return;
    }
    successResponse(res, result.priceList, 201);
  } catch (error: any) {
    logger.error('createPriceList error:', error);
    errorResponse(res, error.message || 'Failed to create price list');
  }
};

// ============================================================================
// Update Price List
// ============================================================================

export const updatePriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { priceListId } = req.params;
    const { name, currency, isActive, notes, items } = req.body;
    if (!name) {
      errorResponse(res, 'name is required', 400);
      return;
    }
    const useCase = new ManageB2BPriceListUseCase();
    const result = await useCase.execute({ b2bPriceListId: priceListId, name, currency, isActive, notes, items });
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to update price list', 400);
      return;
    }
    successResponse(res, result.priceList);
  } catch (error: any) {
    logger.error('updatePriceList error:', error);
    errorResponse(res, error.message || 'Failed to update price list');
  }
};
