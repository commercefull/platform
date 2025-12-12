/**
 * Bundle Controller
 * Handles product bundle operations
 */

import { Request, Response, NextFunction } from 'express';
import * as bundleRepo from '../../repos/bundleRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Business/Admin Operations
// ============================================================================

export const getBundles: AsyncHandler = async (req, res, next) => {
  try {
    const { bundleType, isActive, limit, offset } = req.query;
    const result = await bundleRepo.getBundles(
      { bundleType: bundleType as any, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get bundles error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBundle: AsyncHandler = async (req, res, next) => {
  try {
    const bundle = await bundleRepo.getBundle(req.params.id);
    if (!bundle) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }
    const items = await bundleRepo.getBundleItems(req.params.id);
    res.json({ success: true, data: { ...bundle, items } });
  } catch (error: any) {
    console.error('Get bundle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBundle: AsyncHandler = async (req, res, next) => {
  try {
    const bundle = await bundleRepo.saveBundle(req.body);
    res.status(201).json({ success: true, data: bundle });
  } catch (error: any) {
    console.error('Create bundle error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBundle: AsyncHandler = async (req, res, next) => {
  try {
    const bundle = await bundleRepo.saveBundle({
      productBundleId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: bundle });
  } catch (error: any) {
    console.error('Update bundle error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBundle: AsyncHandler = async (req, res, next) => {
  try {
    await bundleRepo.deleteBundle(req.params.id);
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (error: any) {
    console.error('Delete bundle error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addBundleItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await bundleRepo.saveBundleItem({
      productBundleId: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Add bundle item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBundleItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await bundleRepo.saveBundleItem({
      bundleItemId: req.params.itemId,
      productBundleId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Update bundle item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBundleItem: AsyncHandler = async (req, res, next) => {
  try {
    await bundleRepo.deleteBundleItem(req.params.itemId);
    res.json({ success: true, message: 'Bundle item deleted' });
  } catch (error: any) {
    console.error('Delete bundle item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Customer/Public Operations
// ============================================================================

export const getActiveBundles: AsyncHandler = async (req, res, next) => {
  try {
    const bundles = await bundleRepo.getActiveBundles();
    res.json({ success: true, data: bundles });
  } catch (error: any) {
    console.error('Get active bundles error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBundleDetails: AsyncHandler = async (req, res, next) => {
  try {
    const bundle = await bundleRepo.getBundle(req.params.id);
    if (!bundle || !bundle.isActive) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }

    const items = await bundleRepo.getBundleItems(req.params.id);
    const pricing = await bundleRepo.calculateBundlePrice(req.params.id);

    res.json({ success: true, data: { ...bundle, items, pricing } });
  } catch (error: any) {
    console.error('Get bundle details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBundleByProduct: AsyncHandler = async (req, res, next) => {
  try {
    const bundle = await bundleRepo.getBundleByProductId(req.params.productId);
    if (!bundle || !bundle.isActive) {
      res.status(404).json({ success: false, message: 'Bundle not found' });
      return;
    }

    const items = await bundleRepo.getBundleItems(bundle.productBundleId);
    const pricing = await bundleRepo.calculateBundlePrice(bundle.productBundleId);

    res.json({ success: true, data: { ...bundle, items, pricing } });
  } catch (error: any) {
    console.error('Get bundle by product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const calculateBundlePrice: AsyncHandler = async (req, res, next) => {
  try {
    const { selectedItems } = req.body;
    const pricing = await bundleRepo.calculateBundlePrice(req.params.id, selectedItems);
    res.json({ success: true, data: pricing });
  } catch (error: any) {
    console.error('Calculate bundle price error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
