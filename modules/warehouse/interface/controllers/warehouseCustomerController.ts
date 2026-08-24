/**
 * Warehouse Customer Controller
 * Public store locator endpoints for customers
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import warehouseDataRepository from '../../infrastructure/repositories/WarehouseDataRepository';

const warehouseRepo = warehouseDataRepository.warehouses;
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { query } from '../../../../libs/db';

/**
 * Find nearest stores based on customer location
 * GET /stores/nearest?latitude=...&longitude=...&radiusKm=...&limit=...
 */
export const findNearestStores = async (req: TypedRequest, res: Response): Promise<void> => {
  const latitude = (req.query.latitude as string | undefined) ?? (req.query.lat as string | undefined);
  const longitude = (req.query.longitude as string | undefined) ?? (req.query.lng as string | undefined);
  const radiusKm = (req.query.radiusKm as string | undefined) ?? '50';
  const limit = (req.query.limit as string | undefined) ?? '5';

  if (!latitude || !longitude) {
    errorResponse(res, 'Latitude and longitude are required', 400);
    return;
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);

  if (isNaN(lat) || isNaN(lng)) {
    errorResponse(res, 'Invalid latitude or longitude values', 400);
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    errorResponse(res, 'Latitude must be between -90 and 90, longitude between -180 and 180', 400);
    return;
  }

  const stores = await warehouseRepo.findNearLocation(lat, lng, parseFloat(radiusKm as string), parseInt(limit as string));

  // Filter to only return active stores (fulfillment centers that can serve customers)
  const activeStores = stores.filter((store) => store.isActive);

  // Map to public-facing store data (hide internal fields)
  const publicStores = activeStores.map((store) => ({
    storeId: store.distributionWarehouseId,
    name: store.name,
    address: {
      line1: store.addressLine1,
      line2: store.addressLine2,
      city: store.city,
      state: store.state,
      postalCode: store.postalCode,
      country: store.country,
    },
    coordinates: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
    phone: store.phone,
    email: store.email,
    operatingHours: store.operatingHours,
    distance: store.distance, // Distance from search location
  }));

  successResponse(res, publicStores);
};

/**
 * Get store details by ID
 * GET /stores/:id
 */
export const getStoreById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    errorResponse(res, 'Store ID is required', 400);
    return;
  }

  const store = await warehouseRepo.findById(id);

  if (!store) {
    errorResponse(res, 'Store not found', 404);
    return;
  }

  // Only return active stores
  if (!store.isActive) {
    errorResponse(res, 'Store not found', 404);
    return;
  }

  // Return public-facing store data
  const publicStore = {
    storeId: store.distributionWarehouseId,
    name: store.name,
    description: store.description,
    address: {
      line1: store.addressLine1,
      line2: store.addressLine2,
      city: store.city,
      state: store.state,
      postalCode: store.postalCode,
      country: store.country,
    },
    coordinates: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
    phone: store.phone,
    email: store.email,
    operatingHours: store.operatingHours,
    shippingMethods: store.shippingMethods,
    isFulfillmentCenter: store.isFulfillmentCenter,
    isReturnCenter: store.isReturnCenter,
  };

  successResponse(res, publicStore);
};

/**
 * Get all stores in a specific city
 * GET /stores/city/:city
 */
export const getStoresByCity = async (req: TypedRequest, res: Response): Promise<void> => {
  const { city } = req.params;

  if (!city) {
    errorResponse(res, 'City name is required', 400);
    return;
  }

  // Find all active warehouses and filter by city
  const allStores = await warehouseRepo.findAll(true);
  const stores = allStores.filter((store) => store.city.toLowerCase() === city.toLowerCase());

  // Already filtered to active stores
  const activeStores = stores;

  // Map to public-facing store data
  const publicStores = activeStores.map((store) => ({
    storeId: store.distributionWarehouseId,
    name: store.name,
    address: {
      line1: store.addressLine1,
      line2: store.addressLine2,
      city: store.city,
      state: store.state,
      postalCode: store.postalCode,
      country: store.country,
    },
    coordinates: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
    phone: store.phone,
    operatingHours: store.operatingHours,
  }));

  successResponse(res, publicStores);
};

/**
 * Get stores by country
 * GET /stores/country/:country
 */
export const getStoresByCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  const { country } = req.params;

  if (!country) {
    errorResponse(res, 'Country code is required', 400);
    return;
  }

  const stores = await warehouseRepo.findByCountry(country);

  // Repo already filters to active stores
  const activeStores = stores;

  // Map to public-facing store data
  const publicStores = activeStores.map((store) => ({
    storeId: store.distributionWarehouseId,
    name: store.name,
    city: store.city,
    state: store.state,
    country: store.country,
    coordinates: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
  }));

  successResponse(res, publicStores);
};

/**
 * Check if a product is available for pickup at a specific store
 * GET /stores/:id/availability/:productId
 */
export const checkStoreAvailability = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id, productId } = req.params;
  const { variantId } = req.query;

  if (!id || !productId) {
    errorResponse(res, 'Store ID and Product ID are required', 400);
    return;
  }

  const store = await warehouseRepo.findById(id);

  if (!store || !store.isActive) {
    errorResponse(res, 'Store not found', 404);
    return;
  }

  // Check inventory availability at this location
  const inventoryRows = await query<Array<{ availableQuantity: number }>>(
    `SELECT "availableQuantity" FROM "inventoryLocation" WHERE "distributionWarehouseId" = $1 AND "productId" = $2${variantId ? ' AND "productVariantId" = $3' : ''} LIMIT 1`,
    variantId ? [id, productId, variantId as string] : [id, productId],
  );
  const availableQuantity = inventoryRows?.[0]?.availableQuantity ?? 0;

  const availability = {
    storeId: id,
    productId,
    variantId: variantId || null,
    available: availableQuantity > 0,
    quantity: availableQuantity,
    pickupAvailable: store.isFulfillmentCenter,
    estimatedPickupTime: '2 hours',
  };

  successResponse(res, availability);
};
