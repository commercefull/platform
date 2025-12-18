/**
 * Track Product View Use Case
 */

import * as recommendationRepo from '../../../repos/recommendationRepo';

export interface TrackProductViewInput {
  customerId?: string;
  sessionId?: string;
  productId: string;
  productVariantId?: string;
  source?: string;
  referrer?: string;
  deviceType?: string;
  country?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrackProductViewOutput {
  viewId: string;
}

export async function trackProductView(input: TrackProductViewInput): Promise<TrackProductViewOutput> {
  if (!input.productId) {
    throw new Error('Product ID is required');
  }

  // Need either customerId or sessionId for tracking
  if (!input.customerId && !input.sessionId) {
    throw new Error('Either customerId or sessionId is required');
  }

  const view = await recommendationRepo.recordProductView({
    customerId: input.customerId,
    sessionId: input.sessionId,
    productId: input.productId,
    productVariantId: input.productVariantId,
    source: input.source,
    referrer: input.referrer,
    deviceType: input.deviceType,
    country: input.country,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return { viewId: view.customerProductViewId };
}

export interface UpdateProductViewInput {
  viewId: string;
  viewDurationSeconds?: number;
  scrollDepthPercent?: number;
  addedToCart?: boolean;
  purchased?: boolean;
}

export async function updateProductView(input: UpdateProductViewInput): Promise<void> {
  await recommendationRepo.updateProductView(input.viewId, {
    viewDurationSeconds: input.viewDurationSeconds,
    scrollDepthPercent: input.scrollDepthPercent,
    addedToCart: input.addedToCart,
    purchased: input.purchased
  });
}

export interface GetRecentlyViewedInput {
  customerId?: string;
  sessionId?: string;
  limit?: number;
}

export async function getRecentlyViewed(input: GetRecentlyViewedInput): Promise<{ products: recommendationRepo.CustomerProductView[] }> {
  const views = await recommendationRepo.getRecentlyViewedProducts(
    input.customerId,
    input.sessionId,
    input.limit || 10
  );

  return { products: views };
}
