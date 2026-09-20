/**
 * Tracking Business Controller
 * Handles tracking configuration and event processing via /business/tracking routes.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { GTMConfig, MetaCAPIConfig, EventMapping } from '../../domain/entities/TrackingConfig';
import { ManageTrackingConfigUseCase, ProcessTrackingEventUseCase, GetTrackingStatusUseCase } from '../../application/useCases/Tracking';
import { TrackingConfigRepositoryImpl } from '../../application/wired';

const repo = new TrackingConfigRepositoryImpl();
const manageConfigUseCase = new ManageTrackingConfigUseCase(repo);
const processEventUseCase = new ProcessTrackingEventUseCase(repo);
const getStatusUseCase = new GetTrackingStatusUseCase(repo);

class TrackingController {
  // ── Config CRUD ─────────────────────────────────────────────

  async getConfig(req: HttpRequest, res: HttpResponse) {
    try {
      const storeId = req.query.storeId as string;
      const organizationId = (req.user?.id as string) || '';

      if (!storeId) {
        // No storeId → return all configs for the organization
        const configs = await manageConfigUseCase.getByOrganizationId(organizationId);
        res.json({ success: true, data: configs.map(c => c.toJSON()) });
        return;
      }

      const config = await manageConfigUseCase.getByStoreId(storeId);
      if (!config) {
        res.status(404).json({ success: false, message: 'Tracking config not found' });
        return;
      }

      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      logger.error('Error getting tracking config:', error);
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async getStatus(req: HttpRequest, res: HttpResponse) {
    try {
      const storeId = req.query.storeId as string;
      const organizationId = (req.user?.id as string) || '';

      if (!storeId) {
        // No storeId → return status for the organization's first config
        const configs = await manageConfigUseCase.getByOrganizationId(organizationId);
        if (configs.length === 0) {
          res.json({ success: true, data: { active: false, providers: [] } });
          return;
        }
        const status = await getStatusUseCase.execute(configs[0].storeId);
        res.json({ success: true, data: status });
        return;
      }

      const status = await getStatusUseCase.execute(storeId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting tracking status:', error);
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async createConfig(req: HttpRequest, res: HttpResponse) {
    try {
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

      res.status(201).json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateGtm(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.updateGtm(storeId, body as unknown as GTMConfig);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeGtm(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.removeGtm(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateMetaCapi(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.updateMetaCapi(storeId, body as unknown as MetaCAPIConfig);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeMetaCapi(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.removeMetaCapi(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Event Mappings ──────────────────────────────────────────

  async addEventMapping(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.addEventMapping(storeId, body as unknown as EventMapping);
      res.status(201).json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeEventMapping(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId, sourceEvent } = req.params;
      const config = await manageConfigUseCase.removeEventMapping(storeId, decodeURIComponent(sourceEvent));
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async activate(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.activate(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async disable(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.disable(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async setHashPii(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.setHashPii(storeId, body.enabled as boolean);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async setServerSideEnabled(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.setServerSideEnabled(storeId, body.enabled as boolean);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deleteConfig(req: HttpRequest, res: HttpResponse) {
    try {
      const { storeId } = req.params;
      await manageConfigUseCase.delete(storeId);
      res.json({ success: true, message: 'Tracking config deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Process Event (manual trigger) ──────────────────────────

  async processEvent(req: HttpRequest, res: HttpResponse) {
    try {
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

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }
}

export const trackingController = new TrackingController();
