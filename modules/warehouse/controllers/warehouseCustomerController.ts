/**
 * Warehouse Customer Controller
 * Public store locator endpoints for customers
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import warehouseRepo from '../repos/warehouseRepo';
import { successResponse, errorResponse } from '../../../libs/apiResponse';

/**
 * Find nearest stores based on customer location
 * GET /stores/nearest?latitude=...&longitude=...&radiusKm=...&limit=...
 */
export const findNearestStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radiusKm = '50',
      limit = '5'
    } = req.query;

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

    const stores = await warehouseRepo.findNearLocation(
      lat,
      lng,
      parseFloat(radiusKm as string),
      parseInt(limit as string)
    );

    // Filter to only return active stores (fulfillment centers that can serve customers)
    const activeStores = stores.filter((store: any) => store.isActive);

    // Map to public-facing store data (hide internal fields)
    const publicStores = activeStores.map((store: any) => ({
      storeId: store.distributionWarehouseId,
      name: store.name,
      address: {
        line1: store.addressLine1,
        line2: store.addressLine2,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        country: store.country
      },
      coordinates: {
        latitude: store.latitude,
        longitude: store.longitude
      },
      phone: store.phone,
      email: store.email,
      operatingHours: store.operatingHours,
      distance: store.distance // Distance from search location
    }));

    successResponse(res, publicStores);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to find nearby stores');
  }
};

/**
 * Get store details by ID
 * GET /stores/:id
 */
export const getStoreById = async (req: Request, res: Response): Promise<void> => {
  try {
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
        country: store.country
      },
      coordinates: {
        latitude: store.latitude,
        longitude: store.longitude
      },
      phone: store.phone,
      email: store.email,
      operatingHours: store.operatingHours,
      shippingMethods: store.shippingMethods,
      isFulfillmentCenter: store.isFulfillmentCenter,
      isReturnCenter: store.isReturnCenter
    };

    successResponse(res, publicStore);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch store');
  }
};

/**
 * Get all stores in a specific city
 * GET /stores/city/:city
 */
export const getStoresByCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city } = req.params;

    if (!city) {
      errorResponse(res, 'City name is required', 400);
      return;
    }

    // Find all active warehouses and filter by city
    const allStores = await warehouseRepo.findAll(true);
    const stores = allStores.filter((store: any) => 
      store.city.toLowerCase() === city.toLowerCase()
    );

    // Already filtered to active stores
    const activeStores = stores;

    // Map to public-facing store data
    const publicStores = activeStores.map((store: any) => ({
      storeId: store.distributionWarehouseId,
      name: store.name,
      address: {
        line1: store.addressLine1,
        line2: store.addressLine2,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        country: store.country
      },
      coordinates: {
        latitude: store.latitude,
        longitude: store.longitude
      },
      phone: store.phone,
      operatingHours: store.operatingHours
    }));

    successResponse(res, publicStores);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch stores');
  }
};

/**
 * Get stores by country
 * GET /stores/country/:country
 */
export const getStoresByCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country } = req.params;

    if (!country) {
      errorResponse(res, 'Country code is required', 400);
      return;
    }

    const stores = await warehouseRepo.findByCountry(country);

    // Repo already filters to active stores
    const activeStores = stores;

    // Map to public-facing store data
    const publicStores = activeStores.map((store: any) => ({
      storeId: store.distributionWarehouseId,
      name: store.name,
      city: store.city,
      state: store.state,
      country: store.country,
      coordinates: {
        latitude: store.latitude,
        longitude: store.longitude
      }
    }));

    successResponse(res, publicStores);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch stores');
  }
};

/**
 * Check if a product is available for pickup at a specific store
 * GET /stores/:id/availability/:productId
 */
export const checkStoreAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // TODO: Integrate with inventory service to check actual availability
    // const availability = await inventoryService.checkAvailabilityAtLocation(
    //   productId,
    //   variantId as string,
    //   id
    // );

    // For now, return mock availability
    const availability = {
      storeId: id,
      productId,
      variantId: variantId || null,
      available: true,
      quantity: 10,
      pickupAvailable: store.isFulfillmentCenter,
      estimatedPickupTime: '2 hours'
    };

    successResponse(res, availability);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to check availability');
  }
};
