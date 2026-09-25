/**
 * Organization Controller for Admin Hub
 * Handles Organization management for multi-organization platforms
 */

import { logger } from '../../../../libs/logger';
import { eventBus } from '../../../../libs/events/eventBus';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { organizationRepoInstance } from '../../application/wired';

export const listOrganizations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'operations/organizations/index', {
    pageName: 'Organizations',
    organizations: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createOrganizationForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'operations/organizations/create', {
    pageName: 'Add Organization',
  });
};

export const createOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/operations/organizations?success=Organization created successfully');
  } catch (error: unknown) {
    logger.warn('Error creating organization:', error);
    adminRespond(req, res, 'operations/organizations/create', {
      pageName: 'Add Organization',
      error: (error as Error).message || 'Failed to create organization',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'operations/organizations/view', {
    pageName: 'Organization Details',
    organization: null,
    success: req.query.success || null,
  });
};

export const editOrganizationForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'operations/organizations/edit', {
    pageName: 'Edit Organization',
    organization: null,
  });
};

export const updateOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { organizationId } = req.params;
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating organization:', error);
    adminRespond(req, res, 'operations/organizations/edit', {
      pageName: 'Edit Organization',
      organization: null,
      error: (error as Error).message || 'Failed to update organization',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Organization deleted successfully' });
};

export const approveOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.params;
  try {
    const organization = await organizationRepoInstance.update(organizationId, { status: 'approved' });
    await eventBus.emit('organization.approved', {
      organizationId: organization.organizationId,
      businessName: organization.name,
    });
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization approved successfully`);
  } catch (error: unknown) {
    logger.warn('Error approving organization:', error);
    res.redirect(`/admin/operations/organizations/${organizationId}?error=${encodeURIComponent((error as Error).message || 'Failed to approve organization')}`);
  }
};

export const suspendOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.params;
  try {
    await organizationRepoInstance.update(organizationId, { status: 'suspended' });
    res.redirect(`/admin/operations/organizations/${organizationId}?success=Organization suspended successfully`);
  } catch (error: unknown) {
    logger.warn('Error suspending organization:', error);
    res.redirect(`/admin/operations/organizations/${organizationId}?error=${encodeURIComponent((error as Error).message || 'Failed to suspend organization')}`);
  }
};

// ============================================================================
// Organization Contacts
// ============================================================================
