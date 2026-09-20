/**
 * Tracking Admin UI Controller
 * Admin views for managing tracking configurations
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ManageTrackingConfigUseCase, GetTrackingStatusUseCase } from '../../application/useCases/Tracking';
import { TrackingConfigRepositoryImpl } from '../../application/wired';
import { adminRespond } from '../../../../libs/adminRespond';

const repo = new TrackingConfigRepositoryImpl();
const manageConfigUseCase = new ManageTrackingConfigUseCase(repo);
const getStatusUseCase = new GetTrackingStatusUseCase(repo);

export const listTrackingConfigs = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const storeId = req.query.storeId as string;

  if (!storeId) {
    adminRespond(req, res, 'tracking/index', {
      pageName: 'Tracking Configurations',
      config: null,
      status: null,
      storeId: '',
    });
    return;
  }

  const config = await manageConfigUseCase.getByStoreId(storeId);
  const status = await getStatusUseCase.execute(storeId);

  adminRespond(req, res, 'tracking/index', {
    pageName: 'Tracking Configuration',
    config: config ? config.toJSON() : null,
    status,
    storeId,
    success: req.query.success || null,
  });
};

export const viewTrackingConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  const config = await manageConfigUseCase.getByStoreId(storeId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Tracking config not found' });
    return;
  }

  adminRespond(req, res, 'tracking/view', {
    pageName: `Tracking: ${storeId}`,
    config: config.toJSON(),
    storeId,
    success: req.query.success || null,
  });
};

export const createTrackingConfigForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'tracking/create', { pageName: 'Create Tracking Configuration' });
};

export const createTrackingConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const config = await manageConfigUseCase.create({
    storeId: body.storeId as string,
    organizationId: body.organizationId as string,
    useDefaultMappings: body.useDefaultMappings !== false,
    hashPii: body.hashPii as boolean | undefined,
    serverSideEnabled: body.serverSideEnabled as boolean | undefined,
  });

  res.redirect(`/admin/tracking/${config.storeId}?success=Tracking config created successfully`);
};

export const editTrackingConfigForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  const config = await manageConfigUseCase.getByStoreId(storeId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Tracking config not found' });
    return;
  }

  adminRespond(req, res, 'tracking/edit', {
    pageName: `Edit Tracking: ${storeId}`,
    config: config.toJSON(),
    storeId,
  });
};

export const activateTrackingConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  await manageConfigUseCase.activate(storeId);
  res.redirect(`/admin/tracking/${storeId}?success=Tracking config activated`);
};

export const disableTrackingConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  await manageConfigUseCase.disable(storeId);
  res.redirect(`/admin/tracking/${storeId}?success=Tracking config disabled`);
};

export const deleteTrackingConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  await manageConfigUseCase.delete(storeId);
  res.redirect('/admin/tracking?success=Tracking config deleted');
};
