/**
 * Pickup Customer Controller
 * Handles customer-facing operations for store locations and pickup orders
 */

import { Request, Response, NextFunction } from 'express';
import * as pickupRepo from '../repos/pickupRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Store Locations
// ============================================================================

export const findNearbyLocations: AsyncHandler = async (req, res, next) => {
  try {
    const { latitude, longitude, radius, acceptsPickup } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({ success: false, message: 'Latitude and longitude required' });
      return;
    }

    const locations = await pickupRepo.getNearbyLocations(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      parseFloat(radius as string) || 50,
      { acceptsPickup: acceptsPickup === 'true' ? true : undefined }
    );

    res.json({ success: true, data: locations });
  } catch (error: any) {
    console.error('Find nearby locations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPickupLocations: AsyncHandler = async (req, res, next) => {
  try {
    const result = await pickupRepo.getLocations(
      { isActive: true, acceptsPickup: true },
      { limit: 100, offset: 0 }
    );
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('Get pickup locations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocationDetails: AsyncHandler = async (req, res, next) => {
  try {
    const location = await pickupRepo.getLocation(req.params.id);
    if (!location || !location.isActive) {
      res.status(404).json({ success: false, message: 'Location not found' });
      return;
    }
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Get location details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Pickup Orders
// ============================================================================

export const createPickupOrder: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const pickup = await pickupRepo.createPickupOrder({
      customerId,
      ...req.body
    });
    res.status(201).json({ success: true, data: pickup });
  } catch (error: any) {
    console.error('Create pickup order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyPickupOrders: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;

    const result = await pickupRepo.getPickupOrders(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get my pickup orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPickupOrder: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const pickup = await pickupRepo.getPickupOrder(req.params.id);

    if (!pickup || pickup.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Pickup order not found' });
      return;
    }

    const location = await pickupRepo.getLocation(pickup.storeLocationId);
    res.json({ success: true, data: { ...pickup, location } });
  } catch (error: any) {
    console.error('Get my pickup order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelMyPickup: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const pickup = await pickupRepo.getPickupOrder(req.params.id);

    if (!pickup || pickup.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Pickup order not found' });
      return;
    }

    if (pickup.status === 'picked_up' || pickup.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Cannot cancel this pickup' });
      return;
    }

    await pickupRepo.cancelPickup(req.params.id);
    res.json({ success: true, message: 'Pickup cancelled' });
  } catch (error: any) {
    console.error('Cancel my pickup error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyPickupCode: AsyncHandler = async (req, res, next) => {
  try {
    const { code } = req.body;
    const isValid = await pickupRepo.verifyPickupCode(req.params.id, code);
    res.json({ success: true, data: { isValid } });
  } catch (error: any) {
    console.error('Verify pickup code error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
