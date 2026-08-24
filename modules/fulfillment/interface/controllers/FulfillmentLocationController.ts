/**
 * Fulfillment Location & Partner Controller
 *
 * HTTP interface for managing fulfillment locations and partners.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import fulfillmentPartnerRepository from '../../infrastructure/repositories/FulfillmentPartnerRepository';
import type { CreateFulfillmentLocationParams, UpdateFulfillmentLocationParams } from '../../infrastructure/repositories/FulfillmentPartnerRepository';
import type { FulfillmentPartner } from '../../infrastructure/repositories/FulfillmentPartnerRepository';

const fulfillmentLocationRepo = fulfillmentPartnerRepository.locations;
const fulfillmentPartnerRepo = fulfillmentPartnerRepository.partners;

// ============================================================================
// Fulfillment Locations
// ============================================================================

export const createLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as CreateFulfillmentLocationParams;
  if (!body.organizationId?.trim()) {
    res.status(400).json({ success: false, error: 'organizationId is required' });
    return;
  }
  if (!body.type?.trim()) {
    res.status(400).json({ success: false, error: 'type is required' });
    return;
  }
  if (!body.name?.trim()) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }
  const result = await fulfillmentLocationRepo.create(body);
  res.status(201).json({ success: true, data: result });
  
};

export const getLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentLocationRepo.findById(req.params.locationId);
  if (!result) {
    res.status(404).json({ success: false, error: 'Location not found' });
    return;
  }
  res.json({ success: true, data: result });
  
};

export const listLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentLocationRepo.findByOrganization(
    req.query.organizationId as string,
    {
      type: req.query.type as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    },
  );
  res.json({ success: true, data: result });
  
};

export const updateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentLocationRepo.update(req.params.locationId, req.body as UpdateFulfillmentLocationParams);
  if (!result) {
    res.status(404).json({ success: false, error: 'Location not found' });
    return;
  }
  res.json({ success: true, data: result });
  
};

export const activateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentLocationRepo.activate(req.params.locationId);
  res.json({ success: true, activated: result });
  
};

export const deactivateLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentLocationRepo.deactivate(req.params.locationId);
  res.json({ success: true, deactivated: result });
  
};

export const findNearestLocations = async (req: TypedRequest, res: Response): Promise<void> => {
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
  
};

// ============================================================================
// Fulfillment Partners
// ============================================================================

export const listPartners = async (req: TypedRequest, res: Response): Promise<void> => {
  const activeOnly = req.query.activeOnly !== 'false';
  const result = await fulfillmentPartnerRepo.findAll(activeOnly);
  res.json({ success: true, data: result });
  
};

export const getPartner = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await fulfillmentPartnerRepo.findById(req.params.partnerId);
  if (!result) {
    res.status(404).json({ success: false, error: 'Partner not found' });
    return;
  }
  res.json({ success: true, data: result });
  
};

export const createPartner = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'createdAt' | 'updatedAt'>;
  if (!body.name?.trim()) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }
  if (!body.code?.trim()) {
    res.status(400).json({ success: false, error: 'code is required' });
    return;
  }
  const result = await fulfillmentPartnerRepo.create(body);
  res.status(201).json({ success: true, data: result });
  
};

export const updatePartner = async (req: TypedRequest, res: Response): Promise<void> => {
  const { partnerId } = req.params;
  const result = await fulfillmentPartnerRepo.update(partnerId, req.body as Record<string, unknown>);
  if (!result) {
    res.status(404).json({ success: false, error: 'Partner not found' });
    return;
  }
  res.status(200).json({ success: true, data: result });
  
};

export const deletePartner = async (req: TypedRequest, res: Response): Promise<void> => {
  const { partnerId } = req.params;
  await fulfillmentPartnerRepo.remove(partnerId);
  res.status(200).json({ success: true, message: 'Partner deleted successfully' });
  
};

export const deleteLocation = async (req: TypedRequest, res: Response): Promise<void> => {
  const { locationId } = req.params;
  await fulfillmentLocationRepo.deleteLocation(locationId);
  res.status(200).json({ success: true, message: 'Location deleted successfully' });
  
};
