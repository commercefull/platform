/**
 * Organization Controller for Admin Hub
 * Handles Organization management for multi-organization platforms
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';

export const listOrganizations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/organizations/index', {
      pageName: 'Organizations',
      organizations: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing organizations:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load organizations',
    });
  }
};

export const createOrganizationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/organizations/create', {
      pageName: 'Add Organization',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const createOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/operations/organizations?success=Organization created successfully');
  } catch (error: unknown) {
    logger.error('Error creating organization:', error);
    adminRespond(req, res, 'operations/organizations/create', {
      pageName: 'Add Organization',
      error: (error as Error).message || 'Failed to create organization',
      formData: req.body as RequestBody,
    });
  }
};

export const viewOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/organizations/view', {
      pageName: 'Organization Details',
      organization: null,
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load organization',
    });
  }
};

export const editOrganizationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/organizations/edit', {
      pageName: 'Edit Organization',
      organization: null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const updateOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization updated successfully`);
  } catch (error: unknown) {
    logger.error('Error updating organization:', error);
    adminRespond(req, res, 'operations/organizations/edit', {
      pageName: 'Edit Organization',
      organization: null,
      error: (error as Error).message || 'Failed to update organization',
      formData: req.body as RequestBody,
    });
  }
};

export const deleteOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error deleting organization:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to delete organization' });
  }
};

export const approveOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization approved successfully`);
  } catch (error: unknown) {
    logger.error('Error approving organization:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to approve organization' });
  }
};

export const suspendOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization suspended successfully`);
  } catch (error: unknown) {
    logger.error('Error suspending organization:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to suspend organization' });
  }
};

// ============================================================================
// Organization Contacts
// ============================================================================

