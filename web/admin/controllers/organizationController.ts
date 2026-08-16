import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';
import organizationRepo from '../../../modules/organization/infrastructure/repositories/organizationRepo';

export const listOrganizations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const organizations = await organizationRepo.findAll(limit, offset);
    const total = organizations.length;
    const pages = Math.ceil(total / limit) || 1;

    adminRespond(req, res, 'organizations/index', {
      pageName: 'Organizations',
      organizations,
      pagination: { total, page, pages, limit },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load organizations' });
  }
};

export const viewOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organization = await organizationRepo.findById(req.params.organizationId);
    if (!organization) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Organization not found' });
      return;
    }
    const stores = await organizationRepo.getStoresByOrganization(req.params.organizationId);

    adminRespond(req, res, 'organizations/view', {
      pageName: organization.name,
      organization,
      stores,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load organization' });
  }
};

export const createOrganizationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'organizations/create', { pageName: 'Create Organization', formData: {} });
};

export const createOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const result = await organizationRepo.createWithPassword({
      name: body.name,
      email: body.email,
      password: body.password || 'defaultpassword123',
      phone: body.phone || undefined,
      website: body.website || undefined,
      description: body.description || undefined,
      status: 'pending',
    });
    res.redirect(`/admin/organizations/${result.merchantId}?success=Organization created successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'organizations/create', {
      pageName: 'Create Organization',
      error: (error as Error).message || 'Failed to create organization',
      formData: req.body as RequestBody,
    });
  }
};

export const editOrganizationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organization = await organizationRepo.findById(req.params.organizationId);
    if (!organization) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Organization not found' });
      return;
    }
    adminRespond(req, res, 'organizations/edit', {
      pageName: 'Edit Organization',
      organization,
      formData: organization,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load organization' });
  }
};

export const updateOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    await organizationRepo.update(req.params.organizationId, {
      name: body.name || undefined,
      email: body.email || undefined,
      phone: body.phone || undefined,
      website: body.website || undefined,
      description: body.description || undefined,
      status: body.status || undefined,
    });
    res.redirect(`/admin/organizations/${req.params.organizationId}?success=Organization updated successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    const organization = await organizationRepo.findById(req.params.organizationId).catch(() => null);
    adminRespond(req, res, 'organizations/edit', {
      pageName: 'Edit Organization',
      error: (error as Error).message || 'Failed to update organization',
      organization: organization || { merchantId: req.params.organizationId },
      formData: req.body as RequestBody,
    });
  }
};

export const deleteOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await organizationRepo.delete(req.params.organizationId);
    res.redirect('/admin/organizations?success=Organization deleted successfully');
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.redirect(`/admin/organizations?error=${encodeURIComponent((error as Error).message || 'Failed to delete organization')}`);
  }
};
