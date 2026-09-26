/**
 * Bundle Controller
 * Handles product bundle operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageBundlesUseCase } from '../../application/useCases/wired';
import { BundleType, ProductBundle, BundleItem } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) || fallback });
}

// ============================================================================
// Business/Admin Operations
// ============================================================================

export const getBundles: AsyncHandler = async (req, res, _next) => {
  const { bundleType, isActive, limit, offset } = req.query;
  const result = await manageBundlesUseCase.listBundles(
    { bundleType: bundleType as BundleType | undefined, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getBundle: AsyncHandler = async (req, res, _next) => {
  try {
    const data = await manageBundlesUseCase.getBundleWithItems(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    respondError(res, error, 'Bundle not found');
  }
};

export const createBundle: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<ProductBundle> & { productId: string; name: string };
  const bundle = await manageBundlesUseCase.createBundle(body);
  res.status(201).json({ success: true, data: bundle });
};

export const updateBundle: AsyncHandler = async (req, res, _next) => {
  try {
    const bundle = await manageBundlesUseCase.updateBundle(req.params.id, req.body as Partial<ProductBundle>);
    res.json({ success: true, data: bundle });
  } catch (error) {
    respondError(res, error, 'Bundle not found');
  }
};

export const deleteBundle: AsyncHandler = async (req, res, _next) => {
  await manageBundlesUseCase.deleteBundle(req.params.id);
  res.json({ success: true, message: 'Bundle deleted' });
};

export const addBundleItem: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<BundleItem> & { productId: string };
  const item = await manageBundlesUseCase.addBundleItem(req.params.id, body);
  res.status(201).json({ success: true, data: item });
};

export const updateBundleItem: AsyncHandler = async (req, res, _next) => {
  try {
    const item = await manageBundlesUseCase.updateBundleItem(req.params.id, req.params.itemId, req.body as Partial<BundleItem>);
    res.json({ success: true, data: item });
  } catch (error) {
    respondError(res, error, 'Bundle item not found');
  }
};

export const deleteBundleItem: AsyncHandler = async (req, res, _next) => {
  await manageBundlesUseCase.deleteBundleItem(req.params.itemId);
  res.json({ success: true, message: 'Bundle item deleted' });
};

// ============================================================================
// Customer/Public Operations
// ============================================================================

export const getActiveBundles: AsyncHandler = async (req, res, _next) => {
  const bundles = await manageBundlesUseCase.listActiveBundles();
  res.json({ success: true, data: bundles });
};

export const getBundleDetails: AsyncHandler = async (req, res, _next) => {
  try {
    const data = await manageBundlesUseCase.getActiveBundleDetails(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    respondError(res, error, 'Bundle not found');
  }
};

export const getBundleByProduct: AsyncHandler = async (req, res, _next) => {
  try {
    const data = await manageBundlesUseCase.getActiveBundleForProduct(req.params.productId);
    res.json({ success: true, data });
  } catch (error) {
    respondError(res, error, 'Bundle not found');
  }
};

export const calculateBundlePrice: AsyncHandler = async (req, res, _next) => {
  const { selectedItems } = req.body as { selectedItems?: Array<{ productId: string; productVariantId?: string; quantity: number }> };
  const pricing = await manageBundlesUseCase.calculatePrice(req.params.id, selectedItems);
  res.json({ success: true, data: pricing });
};
