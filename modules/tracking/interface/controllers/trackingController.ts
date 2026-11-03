import {jsonResponse} from 'libs/apiResponse';
/**
 * Tracking Business Controller
 * Handles tracking configuration and event processing via /business/tracking routes.
 */

import type {HttpRequest, HttpResponse} from 'libs/http';
import {GTMConfig, MetaCAPIConfig, EventMapping} from '../../domain/entities/TrackingConfig';
import {manageTrackingConfigUseCase as manageConfigUseCase, processTrackingEventUseCase as processEventUseCase, getTrackingStatusUseCase as getStatusUseCase} from '../../application/wired';

class TrackingController {
  // ── Config CRUD ─────────────────────────────────────────────

  async getConfig(req: HttpRequest, res: HttpResponse) {
    const storeId = req.query.storeId as string;
    const organizationId = (req.user?.id as string) || '';

    if (!storeId) {
      // No storeId → return all configs for the organization
      const configs = await manageConfigUseCase.getByOrganizationId(organizationId);
      jsonResponse(res, 200, { success: true, data: configs.map(c => c.toJSON()) });
      return;
    }

    const config = await manageConfigUseCase.getByStoreId(storeId);
    if (!config) {
      jsonResponse(res, 404, { success: false, message: 'Tracking config not found' });
      return;
    }

    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async getStatus(req: HttpRequest, res: HttpResponse) {
    const storeId = req.query.storeId as string;
    const organizationId = (req.user?.id as string) || '';

    if (!storeId) {
      // No storeId → return status for the organization's first config
      const configs = await manageConfigUseCase.getByOrganizationId(organizationId);
      if (configs.length === 0) {
        jsonResponse(res, 200, { success: true, data: { active: false, providers: [] } });
        return;
      }
      const status = await getStatusUseCase.execute(configs[0].storeId);
      jsonResponse(res, 200, { success: true, data: status });
      return;
    }

    const status = await getStatusUseCase.execute(storeId);
    jsonResponse(res, 200, { success: true, data: status });
  }

  async createConfig(req: HttpRequest, res: HttpResponse) {
    const body = req.body as Record<string, unknown>;
    const organizationId = (body.organizationId as string) || (req.user?.id as string) || '';
    const config = await manageConfigUseCase.create({
      storeId: body.storeId as string,
      organizationId,
      gtm: body.gtm as GTMConfig | undefined,
      metaCapi: body.metaCapi as MetaCAPIConfig | undefined,
      useDefaultMappings: body.useDefaultMappings !== false,
      hashPii: body.hashPii as boolean | undefined,
      serverSideEnabled: body.serverSideEnabled as boolean | undefined,
    });

    jsonResponse(res, 201, { success: true, data: config.toJSON() });
  }

  async updateGtm(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const body = req.body as Record<string, unknown>;
    const config = await manageConfigUseCase.updateGtm(storeId, body as unknown as GTMConfig);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async removeGtm(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const config = await manageConfigUseCase.removeGtm(storeId);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async updateMetaCapi(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const body = req.body as Record<string, unknown>;
    const config = await manageConfigUseCase.updateMetaCapi(storeId, body as unknown as MetaCAPIConfig);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async removeMetaCapi(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const config = await manageConfigUseCase.removeMetaCapi(storeId);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  // ── Event Mappings ──────────────────────────────────────────

  async addEventMapping(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const body = req.body as Record<string, unknown>;
    const config = await manageConfigUseCase.addEventMapping(storeId, body as unknown as EventMapping);
    jsonResponse(res, 201, { success: true, data: config.toJSON() });
  }

  async removeEventMapping(req: HttpRequest, res: HttpResponse) {
    const { storeId, sourceEvent } = req.params;
    const config = await manageConfigUseCase.removeEventMapping(storeId, decodeURIComponent(sourceEvent));
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async activate(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const config = await manageConfigUseCase.activate(storeId);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async disable(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const config = await manageConfigUseCase.disable(storeId);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async setHashPii(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const body = req.body as Record<string, unknown>;
    const config = await manageConfigUseCase.setHashPii(storeId, body.enabled as boolean);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async setServerSideEnabled(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    const body = req.body as Record<string, unknown>;
    const config = await manageConfigUseCase.setServerSideEnabled(storeId, body.enabled as boolean);
    jsonResponse(res, 200, { success: true, data: config.toJSON() });
  }

  async deleteConfig(req: HttpRequest, res: HttpResponse) {
    const { storeId } = req.params;
    await manageConfigUseCase.delete(storeId);
    jsonResponse(res, 200, { success: true, message: 'Tracking config deleted' });
  }

  // ── Process Event (manual trigger) ──────────────────────────

  async processEvent(req: HttpRequest, res: HttpResponse) {
    const body = req.body as Record<string, unknown>;
    const result = await processEventUseCase.execute({
      storeId: body.storeId as string,
      sourceEvent: body.sourceEvent as string,
      userData: body.userData as Record<string, unknown>,
      ecommerceData: body.ecommerceData as Record<string, unknown> | undefined,
      customData: body.customData as Record<string, unknown> | undefined,
      consentGranted: body.consentGranted as boolean,
      correlationId: body.correlationId as string | undefined,
    });

    jsonResponse(res, 200, { success: true, data: result });
  }
}

export const trackingController = new TrackingController();
