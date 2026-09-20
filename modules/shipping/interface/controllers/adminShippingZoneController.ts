/**
 * Shipping Zone Controller
 * Handles shipping zone management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ManageShippingZonesUseCase } from '../../application/useCases/ManageShippingAdmin';
import { adminRespond } from '../../../../libs/adminRespond';

const manageShippingZonesUseCase = new ManageShippingZonesUseCase();

// ============================================================================
// Shipping Zones Management
// ============================================================================

export const listShippingZones = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const zones = await manageShippingZonesUseCase.findAll();
  const activeCount = zones.filter(z => z.isActive).length;

  adminRespond(req, res, 'shipping/zones/index', {
    pageName: 'Shipping Zones',
    zones,
    stats: { total: zones.length, active: activeCount },

    success: req.query.success || null,
  });
};

export const createShippingZoneForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'shipping/zones/create', {
    pageName: 'Create Shipping Zone',
  });
};

export const createShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, description, locationType, locations, excludedLocations, priority, isActive } = body as {
      name: string;
      description?: string;
      locationType?: string;
      locations?: string;
      excludedLocations?: string;
      priority?: string;
      isActive?: string;
    };

    const zone = await manageShippingZonesUseCase.create({
      name,
      description: description || null,
      locationType: locationType || 'country',
      locations: locations ? JSON.parse(locations) : [],
      excludedLocations: excludedLocations ? JSON.parse(excludedLocations) : undefined,
      priority: priority ? parseInt(priority) : 0,
      isActive: isActive === 'true',
      createdBy: 'admin', // Add required createdBy field
    });

    res.redirect(`/hub/shipping/zones/${zone.shippingZoneId}?success=Shipping zone created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'shipping/zones/create', {
      pageName: 'Create Shipping Zone',
      error: (error as Error).message || 'Failed to create shipping zone',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  const zone = await manageShippingZonesUseCase.findById(zoneId);

  if (!zone) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping zone not found',
    });
    return;
  }

  // Get associated rates
  const rates = (await manageShippingZonesUseCase.findById(zoneId)) ? [] : []; // Placeholder - would need to get rates for this zone

  adminRespond(req, res, 'shipping/zones/view', {
    pageName: `Zone: ${zone.name}`,
    zone,
    rates,

    success: req.query.success || null,
  });
};

export const editShippingZoneForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  const zone = await manageShippingZonesUseCase.findById(zoneId);

  if (!zone) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping zone not found',
    });
    return;
  }

  adminRespond(req, res, 'shipping/zones/edit', {
    pageName: `Edit: ${zone.name}`,
    zone,
  });
};

export const updateShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as HttpRequestBody;
  const { name, description, locationType, locations, excludedLocations, priority, isActive } = body as {
    name?: string;
    description?: string;
    locationType?: string;
    locations?: string;
    excludedLocations?: string;
    priority?: string;
    isActive?: string;
  };

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (locationType !== undefined) updates.locationType = locationType;
  if (locations !== undefined) updates.locations = locations ? JSON.parse(locations) : [];
  if (excludedLocations !== undefined) updates.excludedLocations = excludedLocations ? JSON.parse(excludedLocations) : undefined;
  if (priority !== undefined) updates.priority = priority ? parseInt(priority) : 0;
  if (isActive !== undefined) updates.isActive = isActive === 'true';

  const zone = await manageShippingZonesUseCase.update(zoneId, updates);

  if (!zone) {
    throw new Error('Shipping zone not found after update');
  }

  res.redirect(`/hub/shipping/zones/${zoneId}?success=Shipping zone updated successfully`);
};

export const activateShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  const zone = await manageShippingZonesUseCase.activate(zoneId);

  if (!zone) {
    throw new Error('Shipping zone not found');
  }

  res.json({ success: true, message: 'Shipping zone activated successfully' });
};

export const deactivateShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  const zone = await manageShippingZonesUseCase.deactivate(zoneId);

  if (!zone) {
    throw new Error('Shipping zone not found');
  }

  res.json({ success: true, message: 'Shipping zone deactivated successfully' });
};

export const deleteShippingZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  const success = await manageShippingZonesUseCase.delete(zoneId);

  if (!success) {
    throw new Error('Failed to delete shipping zone');
  }

  res.json({ success: true, message: 'Shipping zone deleted successfully' });
};
