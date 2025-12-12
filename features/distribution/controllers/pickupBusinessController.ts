/**
 * Pickup Business Controller
 * Handles admin/merchant operations for store locations and pickup orders
 */

import { Request, Response, NextFunction } from 'express';
import * as pickupRepo from '../repos/pickupRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Store Locations
// ============================================================================

export const getLocations: AsyncHandler = async (req, res, next) => {
  try {
    const { type, isActive, acceptsPickup, limit, offset } = req.query;
    const result = await pickupRepo.getLocations(
      { 
        type: type as any, 
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        acceptsPickup: acceptsPickup === 'true' ? true : acceptsPickup === 'false' ? false : undefined
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocation: AsyncHandler = async (req, res, next) => {
  try {
    const location = await pickupRepo.getLocation(req.params.id);
    if (!location) {
      res.status(404).json({ success: false, message: 'Location not found' });
      return;
    }
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Get location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLocation: AsyncHandler = async (req, res, next) => {
  try {
    const location = await pickupRepo.saveLocation(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    console.error('Create location error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLocation: AsyncHandler = async (req, res, next) => {
  try {
    const location = await pickupRepo.saveLocation({
      storeLocationId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLocation: AsyncHandler = async (req, res, next) => {
  try {
    await pickupRepo.deleteLocation(req.params.id);
    res.json({ success: true, message: 'Location deactivated' });
  } catch (error: any) {
    console.error('Delete location error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Pickup Orders
// ============================================================================

export const getPickupOrders: AsyncHandler = async (req, res, next) => {
  try {
    const { storeLocationId, customerId, status, limit, offset } = req.query;
    const result = await pickupRepo.getPickupOrders(
      { storeLocationId: storeLocationId as string, customerId: customerId as string, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get pickup orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markPickupReady: AsyncHandler = async (req, res, next) => {
  try {
    await pickupRepo.markPickupReady(req.params.id, req.body.lockerNumber, req.body.lockerCode);
    res.json({ success: true, message: 'Pickup marked as ready' });
  } catch (error: any) {
    console.error('Mark pickup ready error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const notifyPickupReady: AsyncHandler = async (req, res, next) => {
  try {
    await pickupRepo.notifyPickupReady(req.params.id);
    res.json({ success: true, message: 'Customer notified' });
  } catch (error: any) {
    console.error('Notify pickup ready error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const completePickup: AsyncHandler = async (req, res, next) => {
  try {
    await pickupRepo.completePickup(req.params.id, req.body.pickedUpBy);
    res.json({ success: true, message: 'Pickup completed' });
  } catch (error: any) {
    console.error('Complete pickup error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
