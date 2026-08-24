/**
 * Tracking Business Controller
 * Handles tracking configuration and event processing via /business/tracking routes.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { TrackingConfigRepositoryImpl } from '../../infrastructure/repositories/TrackingConfigRepositoryImpl';
import { GTMConfig, MetaCAPIConfig, EventMapping } from '../../domain/entities/TrackingConfig';
import {
  ManageTrackingConfigUseCase,
  ProcessTrackingEventUseCase,
  GetTrackingStatusUseCase,
} from '../../application/useCases/Tracking';

const repo = new TrackingConfigRepositoryImpl();
const manageConfigUseCase = new ManageTrackingConfigUseCase(repo);
const processEventUseCase = new ProcessTrackingEventUseCase(repo);
const getStatusUseCase = new GetTrackingStatusUseCase(repo);

export class TrackingController {
  // ── Config CRUD ─────────────────────────────────────────────

  async getConfig(req: TypedRequest, res: Response) {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) {
        res.status(400).json({ success: false, message: 'storeId is required' });
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
      res.status(500).json({ success: false, message: 'Failed to get tracking config' });
    }
  }

  async getStatus(req: TypedRequest, res: Response) {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) {
        res.status(400).json({ success: false, message: 'storeId is required' });
        return;
      }

      const status = await getStatusUseCase.execute(storeId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting tracking status:', error);
      res.status(500).json({ success: false, message: 'Failed to get tracking status' });
    }
  }

  async createConfig(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.create({
        storeId: body.storeId as string,
        organizationId: body.organizationId as string,
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

  async updateGtm(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.updateGtm(storeId, body as unknown as GTMConfig);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeGtm(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.removeGtm(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateMetaCapi(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.updateMetaCapi(storeId, body as unknown as MetaCAPIConfig);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeMetaCapi(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.removeMetaCapi(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Event Mappings ──────────────────────────────────────────

  async addEventMapping(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.addEventMapping(storeId, body as unknown as EventMapping);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async removeEventMapping(req: TypedRequest, res: Response) {
    try {
      const { storeId, sourceEvent } = req.params;
      const config = await manageConfigUseCase.removeEventMapping(storeId, decodeURIComponent(sourceEvent));
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async activate(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.activate(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async disable(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const config = await manageConfigUseCase.disable(storeId);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async setHashPii(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.setHashPii(storeId, body.enabled as boolean);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async setServerSideEnabled(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      const body = req.body as Record<string, unknown>;
      const config = await manageConfigUseCase.setServerSideEnabled(storeId, body.enabled as boolean);
      res.json({ success: true, data: config.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deleteConfig(req: TypedRequest, res: Response) {
    try {
      const { storeId } = req.params;
      await manageConfigUseCase.delete(storeId);
      res.json({ success: true, message: 'Tracking config deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Process Event (manual trigger) ──────────────────────────

  async processEvent(req: TypedRequest, res: Response) {
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
