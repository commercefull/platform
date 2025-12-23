/**
 * Organization Controller
 */

import { Request, Response } from 'express';
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

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createOrganizationUseCase.execute({
      name: req.body.name,
      slug: req.body.slug,
      type: req.body.type,
      settings: req.body.settings,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await updateOrganizationUseCase.execute({
      organizationId: req.params.organizationId,
      name: req.body.name,
      slug: req.body.slug,
      type: req.body.type,
      settings: req.body.settings,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getOrganizationUseCase.execute({
      organizationId: req.params.organizationId,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getOrganizationBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getOrganizationUseCase.execute({
      slug: req.params.slug,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const listOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await listOrganizationsUseCase.execute({ limit, offset });
    res.json({
      success: true,
      data: result.organizations,
      meta: { total: result.total, limit, offset },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getOrganizationStores = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
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
