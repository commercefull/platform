/**
 * Fulfillment Location & Partner Controller
 *
 * HTTP interface for managing fulfillment locations and partners.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageFulfillmentLocationsUseCase } from '../../application/wired';
import { CreateFulfillmentLocationParams, UpdateFulfillmentLocationParams, FulfillmentPartner } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  res.status(getErrorStatusCode(error)).json({ success: false, error: getErrorMessage(error) || fallback });
}

// ============================================================================
// Fulfillment Locations
// ============================================================================

export const createLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as CreateFulfillmentLocationParams;
  try {
    const result = await manageFulfillmentLocationsUseCase.createLocation(body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Failed to create location');
  }
};

export const getLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.json({ success: true, data: await manageFulfillmentLocationsUseCase.getLocation(req.params.locationId) });
  } catch (error) {
    respondError(res, error, 'Location not found');
  }
};

export const listLocations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await manageFulfillmentLocationsUseCase.listLocations(req.query.organizationId as string, {
    type: req.query.type as string,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
  });
  res.json({ success: true, data: result });
};

export const updateLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const result = await manageFulfillmentLocationsUseCase.updateLocation(req.params.locationId, req.body as UpdateFulfillmentLocationParams);
    res.json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Location not found');
  }
};

export const activateLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await manageFulfillmentLocationsUseCase.activateLocation(req.params.locationId);
  res.json({ success: true, activated: result });
};

export const deactivateLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await manageFulfillmentLocationsUseCase.deactivateLocation(req.params.locationId);
  res.json({ success: true, deactivated: result });
};

export const findNearestLocations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const latitude = parseFloat(req.query.latitude as string);
  const longitude = parseFloat(req.query.longitude as string);
  try {
    const result = await manageFulfillmentLocationsUseCase.findNearestLocations(latitude, longitude, {
      limit: parseInt(req.query.limit as string) || 10,
      type: req.query.type as string,
      organizationId: req.query.organizationId as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Failed to find nearest locations');
  }
};

// ============================================================================
// Fulfillment Partners
// ============================================================================

export const listPartners = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const activeOnly = req.query.activeOnly !== 'false';
  const result = await manageFulfillmentLocationsUseCase.listPartners(activeOnly);
  res.json({ success: true, data: result });
};

export const getPartner = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.json({ success: true, data: await manageFulfillmentLocationsUseCase.getPartner(req.params.partnerId) });
  } catch (error) {
    respondError(res, error, 'Partner not found');
  }
};

export const createPartner = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'createdAt' | 'updatedAt'>;
  try {
    const result = await manageFulfillmentLocationsUseCase.createPartner(body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Failed to create partner');
  }
};

export const updatePartner = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { partnerId } = req.params;
  try {
    const result = await manageFulfillmentLocationsUseCase.updatePartner(
      partnerId,
      req.body as Parameters<typeof manageFulfillmentLocationsUseCase.updatePartner>[1],
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Partner not found');
  }
};

export const deletePartner = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { partnerId } = req.params;
  await manageFulfillmentLocationsUseCase.deletePartner(partnerId);
  res.status(200).json({ success: true, message: 'Partner deleted successfully' });
};

export const deleteLocation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { locationId } = req.params;
  await manageFulfillmentLocationsUseCase.deleteLocation(locationId);
  res.status(200).json({ success: true, message: 'Location deleted successfully' });
};
