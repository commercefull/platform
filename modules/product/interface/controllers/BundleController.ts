import { jsonResponse } from 'libs/apiResponse';
/**
 * Bundle Controller
 * Handles product bundle operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageBundlesUseCase } from '../../application/useCases/wired';
import { BundleType, ProductBundle, BundleItem } from '../../application/wired';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

// ============================================================================
// Business/Admin Operations
// ============================================================================

export const getBundles: AsyncHandler = async (req, res, _next) => {
  const { bundleType, isActive, limit, offset } = req.query;
  const result = await manageBundlesUseCase.listBundles(
    { bundleType: bundleType as BundleType | undefined, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  jsonResponse(res, 200, { success: true, ...result });
};

export const getBundle: AsyncHandler = async (req, res, _next) => {
  const data = await manageBundlesUseCase.getBundleWithItems(req.params.id);
  jsonResponse(res, 200, { success: true, data });
};

export const createBundle: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<ProductBundle> & { productId: string; name: string };
  const bundle = await manageBundlesUseCase.createBundle(body);
  jsonResponse(res, 201, { success: true, data: bundle });
};

export const updateBundle: AsyncHandler = async (req, res, _next) => {
  const bundle = await manageBundlesUseCase.updateBundle(req.params.id, req.body as Partial<ProductBundle>);
  jsonResponse(res, 200, { success: true, data: bundle });
};

export const deleteBundle: AsyncHandler = async (req, res, _next) => {
  await manageBundlesUseCase.deleteBundle(req.params.id);
  jsonResponse(res, 200, { success: true, message: 'Bundle deleted' });
};

export const addBundleItem: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<BundleItem> & { productId: string };
  const item = await manageBundlesUseCase.addBundleItem(req.params.id, body);
  jsonResponse(res, 201, { success: true, data: item });
};

export const updateBundleItem: AsyncHandler = async (req, res, _next) => {
  const item = await manageBundlesUseCase.updateBundleItem(req.params.id, req.params.itemId, req.body as Partial<BundleItem>);
  jsonResponse(res, 200, { success: true, data: item });
};

export const deleteBundleItem: AsyncHandler = async (req, res, _next) => {
  await manageBundlesUseCase.deleteBundleItem(req.params.itemId);
  jsonResponse(res, 200, { success: true, message: 'Bundle item deleted' });
};

// ============================================================================
// Customer/Public Operations
// ============================================================================

export const getActiveBundles: AsyncHandler = async (req, res, _next) => {
  const bundles = await manageBundlesUseCase.listActiveBundles();
  jsonResponse(res, 200, { success: true, data: bundles });
};

export const getBundleDetails: AsyncHandler = async (req, res, _next) => {
  const data = await manageBundlesUseCase.getActiveBundleDetails(req.params.id);
  jsonResponse(res, 200, { success: true, data });
};

export const getBundleByProduct: AsyncHandler = async (req, res, _next) => {
  const data = await manageBundlesUseCase.getActiveBundleForProduct(req.params.productId);
  jsonResponse(res, 200, { success: true, data });
};

export const calculateBundlePrice: AsyncHandler = async (req, res, _next) => {
  const { selectedItems } = req.body as { selectedItems?: Array<{ productId: string; productVariantId?: string; quantity: number }> };
  const pricing = await manageBundlesUseCase.calculatePrice(req.params.id, selectedItems);
  jsonResponse(res, 200, { success: true, data: pricing });
};
