/**
 * Fulfillment Location & Partner Controller
 *
 * HTTP interface for managing fulfillment locations and partners.
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import fulfillmentLocationRepo from '../../infrastructure/repositories/fulfillmentLocationRepo';
import { CreateFulfillmentLocationParams, UpdateFulfillmentLocationParams } from '../../infrastructure/repositories/fulfillmentLocationRepo';
import fulfillmentPartnerRepo from '../../infrastructure/repositories/fulfillmentPartnerRepo';
import { FulfillmentPartner } from '../../infrastructure/repositories/fulfillmentPartnerRepo';

// ============================================================================
// Fulfillment Locations
// ============================================================================

export const createLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.create(req.body as CreateFulfillmentLocationParams);
    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const getLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.findById(req.params.locationId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const listLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.findByOrganization(
      req.query.organizationId as string,
      {
        type: req.query.type as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      },
    );
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.update(req.params.locationId, req.body as UpdateFulfillmentLocationParams);
    if (!result) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const activateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.activate(req.params.locationId);
    res.json({ success: true, activated: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const deactivateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentLocationRepo.deactivate(req.params.locationId);
    res.json({ success: true, deactivated: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const findNearestLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ success: false, error: 'latitude and longitude query params are required' });
      return;
    }
    const result = await fulfillmentLocationRepo.findNearestLocations(latitude, longitude, {
      limit: parseInt(req.query.limit as string) || 10,
      type: req.query.type as string,
      organizationId: req.query.organizationId as string,
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ============================================================================
// Fulfillment Partners
// ============================================================================

export const listPartners = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const result = await fulfillmentPartnerRepo.findAll(activeOnly);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getPartner = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentPartnerRepo.findById(req.params.partnerId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Partner not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createPartner = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await fulfillmentPartnerRepo.create(req.body as Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'createdAt' | 'updatedAt'>);
    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};
