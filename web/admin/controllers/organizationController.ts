import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';
import {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  GetOrganizationUseCase,
  ListOrganizationsUseCase,
  GetOrganizationStoresUseCase,
} from '../../../modules/organization/application/useCases';
import organizationRepo from '../../../modules/organization/infrastructure/repositories/organizationRepo';

const createOrganizationUseCase = new CreateOrganizationUseCase();
const updateOrganizationUseCase = new UpdateOrganizationUseCase();
const getOrganizationUseCase = new GetOrganizationUseCase();
const listOrganizationsUseCase = new ListOrganizationsUseCase();
const getOrganizationStoresUseCase = new GetOrganizationStoresUseCase();

export const listOrganizations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const result = await listOrganizationsUseCase.execute({ limit, offset });

    const total = result.total;
    const pages = Math.ceil(total / limit) || 1;

    adminRespond(req, res, 'organizations/index', {
      pageName: 'Organizations',
      organizations: result.organizations,
      pagination: { total, page, pages, limit },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load organizations' });
  }
};

export const viewOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await getOrganizationUseCase.execute({ organizationId: req.params.organizationId });
    const storesResult = await getOrganizationStoresUseCase.execute({ organizationId: req.params.organizationId });

    adminRespond(req, res, 'organizations/view', {
      pageName: result.name,
      organization: result,
      stores: storesResult.stores,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    const status = (error as Error).message.includes('not found') ? 'Not Found' : 'Error';
    adminRespond(req, res, 'error', { pageName: status, error: (error as Error).message || 'Failed to load organization' });
  }
};

export const createOrganizationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'organizations/create', { pageName: 'Create Organization', formData: {} });
};

export const createOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const result = await createOrganizationUseCase.execute({
      name: body.name,
      slug: body.slug,
      type: body.type || undefined,
      settings: body.settings ? JSON.parse(body.settings) : undefined,
    });
    res.redirect(`/admin/organizations/${result.organizationId}?success=Organization created successfully`);
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
    const result = await getOrganizationUseCase.execute({ organizationId: req.params.organizationId });
    adminRespond(req, res, 'organizations/edit', {
      pageName: 'Edit Organization',
      organization: result,
      formData: result,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load organization' });
  }
};

export const updateOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    await updateOrganizationUseCase.execute({
      organizationId: req.params.organizationId,
      name: body.name || undefined,
      slug: body.slug || undefined,
      type: body.type || undefined,
      settings: body.settings ? JSON.parse(body.settings) : undefined,
    });
    res.redirect(`/admin/organizations/${req.params.organizationId}?success=Organization updated successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);
    const result = await getOrganizationUseCase.execute({ organizationId: req.params.organizationId }).catch(() => null);
    adminRespond(req, res, 'organizations/edit', {
      pageName: 'Edit Organization',
      error: (error as Error).message || 'Failed to update organization',
      organization: result || { organizationId: req.params.organizationId },
      formData: req.body as RequestBody,
    });
  }
};

export const deleteOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await organizationRepo.softDelete(req.params.organizationId);
    res.redirect('/admin/organizations?success=Organization deleted successfully');
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.redirect(`/admin/organizations?error=${encodeURIComponent((error as Error).message || 'Failed to delete organization')}`);
  }
};
