/**
 * Shipping Zone Controller
 * Handles shipping zone management for the Admin Hub
 */

import { Request, Response } from 'express';
import shippingZoneRepo from '../../../modules/shipping/repos/shippingZoneRepo';
import shippingMethodRepo from '../../../modules/shipping/repos/shippingMethodRepo';

// ============================================================================
// Shipping Zones Management
// ============================================================================

export const listShippingZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await shippingZoneRepo.findAll();
    const activeCount = zones.filter(z => z.isActive).length;

    res.render('hub/views/shipping/zones/index', {
      pageName: 'Shipping Zones',
      zones,
      stats: { total: zones.length, active: activeCount },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing shipping zones:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping zones',
      user: req.user
    });
  }
};

export const createShippingZoneForm = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('hub/views/shipping/zones/create', {
      pageName: 'Create Shipping Zone',
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create zone form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      locationType,
      locations,
      excludedLocations,
      priority,
      isActive
    } = req.body;

    const zone = await shippingZoneRepo.create({
      name,
      description: description || undefined,
      locationType: locationType || 'country',
      locations: locations ? JSON.parse(locations) : [],
      excludedLocations: excludedLocations ? JSON.parse(excludedLocations) : undefined,
      priority: priority ? parseInt(priority) : 0,
      isActive: isActive === 'true',
      createdBy: 'admin' // Add required createdBy field
    });

    res.redirect(`/hub/shipping/zones/${zone.shippingZoneId}?success=Shipping zone created successfully`);
  } catch (error: any) {
    console.error('Error creating shipping zone:', error);

    res.render('hub/views/shipping/zones/create', {
      pageName: 'Create Shipping Zone',
      error: error.message || 'Failed to create shipping zone',
      formData: req.body,
      user: req.user
    });
  }
};

export const viewShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const zone = await shippingZoneRepo.findById(zoneId);

    if (!zone) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Shipping zone not found',
        user: req.user
      });
      return;
    }

    // Get associated rates
    const rates = await shippingZoneRepo.findById(zoneId) ? [] : []; // Placeholder - would need to get rates for this zone

    res.render('hub/views/shipping/zones/view', {
      pageName: `Zone: ${zone.name}`,
      zone,
      rates,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing shipping zone:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping zone',
      user: req.user
    });
  }
};

export const editShippingZoneForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const zone = await shippingZoneRepo.findById(zoneId);

    if (!zone) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Shipping zone not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/shipping/zones/edit', {
      pageName: `Edit: ${zone.name}`,
      zone,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit zone form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updateShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const updates: any = {};

    const {
      name,
      description,
      locationType,
      locations,
      excludedLocations,
      priority,
      isActive
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || undefined;
    if (locationType !== undefined) updates.locationType = locationType;
    if (locations !== undefined) updates.locations = locations ? JSON.parse(locations) : [];
    if (excludedLocations !== undefined) updates.excludedLocations = excludedLocations ? JSON.parse(excludedLocations) : undefined;
    if (priority !== undefined) updates.priority = priority ? parseInt(priority) : 0;
    if (isActive !== undefined) updates.isActive = isActive === 'true';

    const zone = await shippingZoneRepo.update(zoneId, updates);

    if (!zone) {
      throw new Error('Shipping zone not found after update');
    }

    res.redirect(`/hub/shipping/zones/${zoneId}?success=Shipping zone updated successfully`);
  } catch (error: any) {
    console.error('Error updating shipping zone:', error);

    try {
      const zone = await shippingZoneRepo.findById(req.params.zoneId);

      res.render('hub/views/shipping/zones/edit', {
        pageName: `Edit: ${zone?.name || 'Zone'}`,
        zone,
        error: error.message || 'Failed to update shipping zone',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update shipping zone',
        user: req.user
      });
    }
  }
};

export const activateShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const zone = await shippingZoneRepo.activate(zoneId);

    if (!zone) {
      throw new Error('Shipping zone not found');
    }

    res.json({ success: true, message: 'Shipping zone activated successfully' });
  } catch (error: any) {
    console.error('Error activating shipping zone:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to activate shipping zone' });
  }
};

export const deactivateShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const zone = await shippingZoneRepo.deactivate(zoneId);

    if (!zone) {
      throw new Error('Shipping zone not found');
    }

    res.json({ success: true, message: 'Shipping zone deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating shipping zone:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate shipping zone' });
  }
};

export const deleteShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const success = await shippingZoneRepo.delete(zoneId);

    if (!success) {
      throw new Error('Failed to delete shipping zone');
    }

    res.json({ success: true, message: 'Shipping zone deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting shipping zone:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete shipping zone' });
  }
};
