/**
 * Organization Controller
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  GetOrganizationUseCase,
  ListOrganizationsUseCase,
  GetOrganizationStoresUseCase,
} from '../../application/useCases';

const createOrganizationUseCase = new CreateOrganizationUseCase();
const updateOrganizationUseCase = new UpdateOrganizationUseCase();
const getOrganizationUseCase = new GetOrganizationUseCase();
const listOrganizationsUseCase = new ListOrganizationsUseCase();
const getOrganizationStoresUseCase = new GetOrganizationStoresUseCase();

export const createOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as { name: string; slug: string; type?: 'single' | 'multi_store' | 'marketplace'; settings?: Record<string, unknown> };
    const result = await createOrganizationUseCase.execute({
      name: body.name,
      slug: body.slug,
      type: body.type,
      settings: body.settings,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as { name?: string; slug?: string; type?: 'single' | 'multi_store' | 'marketplace'; settings?: Record<string, unknown> };
    const result = await updateOrganizationUseCase.execute({
      organizationId: req.params.organizationId,
      name: body.name,
      slug: body.slug,
      type: body.type,
      settings: body.settings,
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    const status = (error as Error).message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
};

export const getOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await getOrganizationUseCase.execute({
      organizationId: req.params.organizationId,
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    const status = (error as Error).message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
};

export const getOrganizationBySlug = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await getOrganizationUseCase.execute({
      slug: req.params.slug,
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error:', error);
    const status = (error as Error).message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
};

export const listOrganizations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await listOrganizationsUseCase.execute({ limit, offset });
    res.json({
      success: true,
      data: result.organizations,
      meta: { total: result.total, limit, offset },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const getOrganizationStores = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getOrganizationStoresUseCase.execute({
      organizationId: req.params.organizationId,
      limit,
      offset,
    });
    res.json({
      success: true,
      data: result.stores,
      meta: { total: result.total, limit, offset },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    const status = (error as Error).message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: (error as Error).message });
  }
};

export default {
  createOrganization,
  updateOrganization,
  getOrganization,
  getOrganizationBySlug,
  listOrganizations,
  getOrganizationStores,
};
