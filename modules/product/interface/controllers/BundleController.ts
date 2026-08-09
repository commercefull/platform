/**
 * Bundle Controller
 * Handles product bundle operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as bundleRepo from '../../infrastructure/repositories/bundleRepo';

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Business/Admin Operations
// ============================================================================

export const getBundles: AsyncHandler = async (req, res, _next) => {
  try {
    const { bundleType, isActive, limit, offset } = req.query;
    const result = await bundleRepo.getBundles(
      { bundleType: bundleType as bundleRepo.BundleType | undefined, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBundle: AsyncHandler = async (req, res, _next) => {
  try {
    const bundle = await bundleRepo.getBundle(req.params.id);
    if (!bundle) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }
    const items = await bundleRepo.getBundleItems(req.params.id);
    res.json({ success: true, data: { ...bundle, items } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createBundle: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<bundleRepo.ProductBundle> & { productId: string; name: string };
    const bundle = await bundleRepo.saveBundle(body);
    res.status(201).json({ success: true, data: bundle });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateBundle: AsyncHandler = async (req, res, _next) => {
  try {
    const existing = await bundleRepo.getBundle(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }
    const bundle = await bundleRepo.saveBundle({
      ...existing,
      productBundleId: req.params.id,
      ...(req.body as Partial<bundleRepo.ProductBundle>),
    });
    res.json({ success: true, data: bundle });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteBundle: AsyncHandler = async (req, res, _next) => {
  try {
    await bundleRepo.deleteBundle(req.params.id);
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const addBundleItem: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<bundleRepo.BundleItem> & { productId: string };
    const item = await bundleRepo.saveBundleItem({
      productBundleId: req.params.id,
      ...body,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateBundleItem: AsyncHandler = async (req, res, _next) => {
  try {
    const existing = await bundleRepo.getBundleItem(req.params.itemId);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bundle item not found' });
      return;
    }
    const item = await bundleRepo.saveBundleItem({
      ...existing,
      bundleItemId: req.params.itemId,
      productBundleId: req.params.id,
      ...(req.body as Partial<bundleRepo.BundleItem>),
    });
    res.json({ success: true, data: item });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteBundleItem: AsyncHandler = async (req, res, _next) => {
  try {
    await bundleRepo.deleteBundleItem(req.params.itemId);
    res.json({ success: true, message: 'Bundle item deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Customer/Public Operations
// ============================================================================

export const getActiveBundles: AsyncHandler = async (req, res, _next) => {
  try {
    const bundles = await bundleRepo.getActiveBundles();
    res.json({ success: true, data: bundles });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBundleDetails: AsyncHandler = async (req, res, _next) => {
  try {
    const bundle = await bundleRepo.getBundle(req.params.id);
    if (!bundle || !bundle.isActive) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }

    const items = await bundleRepo.getBundleItems(req.params.id);
    const pricing = await bundleRepo.calculateBundlePrice(req.params.id);

    res.json({ success: true, data: { ...bundle, items, pricing } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBundleByProduct: AsyncHandler = async (req, res, _next) => {
  try {
    const bundle = await bundleRepo.getBundleByProductId(req.params.productId);
    if (!bundle || !bundle.isActive) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }

    const items = await bundleRepo.getBundleItems(bundle.productBundleId);
    const pricing = await bundleRepo.calculateBundlePrice(bundle.productBundleId);

    res.json({ success: true, data: { ...bundle, items, pricing } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const calculateBundlePrice: AsyncHandler = async (req, res, _next) => {
  try {
    const { selectedItems } = req.body as { selectedItems?: Array<{ productId: string; productVariantId?: string; quantity: number }> };
    const pricing = await bundleRepo.calculateBundlePrice(req.params.id, selectedItems);
    res.json({ success: true, data: pricing });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
