/**
 * Tracking Use Cases
 *
 * - ManageTrackingConfig: CRUD for per-store tracking configuration
 * - ProcessTrackingEvent: Consent-gate, build TrackingEvent, route to adapters
 * - GetTrackingStatus: Check tracking health and configuration status
 */

import { generateUUID } from '../../../../libs/uuid';
import { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';
import { TrackingConfig, GTMConfig, MetaCAPIConfig, EventMapping } from '../../domain/entities/TrackingConfig';
import { TrackingEvent, TrackingUserData, TrackingEcommerceData } from '../../domain/entities/TrackingEvent';
import { TrackingAdapter, TrackingSendResult } from '../../domain/services/TrackingAdapter';
import { GTMServerAdapter } from '../../domain/services/GTMServerAdapter';
import { MetaCAPIAdapter } from '../../domain/services/MetaCAPIAdapter';
import { getDefaultEventMappings } from '../../domain/services/defaultEventMappings';
import {
  TrackingConfigNotFoundError,
  TrackingConfigAlreadyExistsError,
  TrackingEventNotMappedError,
} from '../../domain/errors/TrackingErrors';
import { logger } from '../../../../libs/logger';

// ============================================================================
// Manage Tracking Config
// ============================================================================

export class ManageTrackingConfigUseCase {
  constructor(private readonly repo: TrackingConfigRepository) {}

  async create(params: {
    storeId: string;
    organizationId: string;
    gtm?: GTMConfig;
    metaCapi?: MetaCAPIConfig;
    useDefaultMappings?: boolean;
    hashPii?: boolean;
    serverSideEnabled?: boolean;
  }): Promise<TrackingConfig> {
    const existing = await this.repo.findByStoreId(params.storeId);
    if (existing) throw new TrackingConfigAlreadyExistsError(params.storeId);

    const config = TrackingConfig.create({
      configId: generateUUID(),
      storeId: params.storeId,
      organizationId: params.organizationId,
      gtm: params.gtm,
      metaCapi: params.metaCapi,
      eventMappings: params.useDefaultMappings !== false ? getDefaultEventMappings() : [],
      hashPii: params.hashPii,
      serverSideEnabled: params.serverSideEnabled,
    });

    return this.repo.save(config);
  }

  async getByStoreId(storeId: string): Promise<TrackingConfig | null> {
    return this.repo.findByStoreId(storeId);
  }

  async getByOrganizationId(organizationId: string): Promise<TrackingConfig[]> {
    return this.repo.findByOrganizationId(organizationId);
  }

  async updateGtm(storeId: string, gtm: GTMConfig): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.updateGtm(gtm);
    return this.repo.save(config);
  }

  async removeGtm(storeId: string): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.removeGtm();
    return this.repo.save(config);
  }

  async updateMetaCapi(storeId: string, metaCapi: MetaCAPIConfig): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.updateMetaCapi(metaCapi);
    return this.repo.save(config);
  }

  async removeMetaCapi(storeId: string): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.removeMetaCapi();
    return this.repo.save(config);
  }

  async addEventMapping(storeId: string, mapping: EventMapping): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.addEventMapping(mapping);
    return this.repo.save(config);
  }

  async removeEventMapping(storeId: string, sourceEvent: string): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.removeEventMapping(sourceEvent);
    return this.repo.save(config);
  }

  async updateEventMapping(storeId: string, sourceEvent: string, updates: Partial<EventMapping>): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.updateEventMapping(sourceEvent, updates);
    return this.repo.save(config);
  }

  async activate(storeId: string): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.activate();
    return this.repo.save(config);
  }

  async disable(storeId: string): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.disable();
    return this.repo.save(config);
  }

  async setHashPii(storeId: string, enabled: boolean): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.setHashPii(enabled);
    return this.repo.save(config);
  }

  async setServerSideEnabled(storeId: string, enabled: boolean): Promise<TrackingConfig> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    config.setServerSideEnabled(enabled);
    return this.repo.save(config);
  }

  async delete(storeId: string): Promise<void> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) throw new TrackingConfigNotFoundError(storeId);
    await this.repo.delete(config.configId);
  }
}

// ============================================================================
// Process Tracking Event
// ============================================================================

export interface ProcessTrackingEventInput {
  storeId: string;
  sourceEvent: string;
  userData: TrackingUserData;
  ecommerceData?: TrackingEcommerceData;
  customData?: Record<string, unknown>;
  /** Whether consent was granted for the required category */
  consentGranted: boolean;
  correlationId?: string;
}

export interface ProcessTrackingEventResult {
  eventId: string;
  sent: TrackingSendResult[];
  skipped: string[];
}

export class ProcessTrackingEventUseCase {
  private readonly gtmAdapter: TrackingAdapter;
  private readonly metaCapiAdapter: TrackingAdapter;

  constructor(
    private readonly repo: TrackingConfigRepository,
    gtmAdapter?: TrackingAdapter,
    metaCapiAdapter?: TrackingAdapter,
  ) {
    this.gtmAdapter = gtmAdapter || new GTMServerAdapter();
    this.metaCapiAdapter = metaCapiAdapter || new MetaCAPIAdapter();
  }

  async execute(input: ProcessTrackingEventInput): Promise<ProcessTrackingEventResult> {
    const config = await this.repo.findByStoreId(input.storeId);
    if (!config) {
      throw new TrackingConfigNotFoundError(input.storeId);
    }

    if (!config.isActive() || !config.serverSideEnabled) {
      return { eventId: '', sent: [], skipped: ['tracking_disabled'] };
    }

    const mapping = config.findMapping(input.sourceEvent);
    if (!mapping) {
      throw new TrackingEventNotMappedError(input.sourceEvent);
    }

    // Consent gate
    if (!input.consentGranted) {
      logger.debug('Tracking event skipped — consent not granted', {
        sourceEvent: input.sourceEvent,
        category: mapping.consentCategory,
      });
      return { eventId: '', sent: [], skipped: ['consent_not_granted'] };
    }

    const event = TrackingEvent.create({
      eventId: generateUUID(),
      storeId: input.storeId,
      sourceEvent: input.sourceEvent,
      targetEvent: mapping.targetEvent,
      providers: mapping.providers,
      userData: input.userData,
      ecommerceData: input.ecommerceData || {},
      customData: input.customData || {},
      consentCategory: mapping.consentCategory,
      consentGranted: input.consentGranted,
      timestamp: new Date(),
      correlationId: input.correlationId,
    });

    const sent: TrackingSendResult[] = [];
    const skipped: string[] = [];

    if (event.shouldSendToGtm() && config.isGtmEnabled()) {
      const result = await this.gtmAdapter.send(event, config);
      sent.push(result);
    } else if (mapping.providers.includes('gtm')) {
      skipped.push('gtm_disabled');
    }

    if (event.shouldSendToMetaCapi() && config.isMetaCapiEnabled()) {
      const result = await this.metaCapiAdapter.send(event, config);
      sent.push(result);
    } else if (mapping.providers.includes('meta_capi')) {
      skipped.push('meta_capi_disabled');
    }

    return { eventId: event.eventId, sent, skipped };
  }
}

// ============================================================================
// Get Tracking Status
// ============================================================================

export interface TrackingStatus {
  configured: boolean;
  status: string;
  gtmEnabled: boolean;
  metaCapiEnabled: boolean;
  serverSideEnabled: boolean;
  hashPii: boolean;
  eventMappingCount: number;
  mappings: Array<{ sourceEvent: string; targetEvent: string; providers: string[] }>;
}

export class GetTrackingStatusUseCase {
  constructor(private readonly repo: TrackingConfigRepository) {}

  async execute(storeId: string): Promise<TrackingStatus> {
    const config = await this.repo.findByStoreId(storeId);
    if (!config) {
      return {
        configured: false,
        status: 'not_configured',
        gtmEnabled: false,
        metaCapiEnabled: false,
        serverSideEnabled: false,
        hashPii: false,
        eventMappingCount: 0,
        mappings: [],
      };
    }

    return {
      configured: true,
      status: config.status,
      gtmEnabled: config.isGtmEnabled(),
      metaCapiEnabled: config.isMetaCapiEnabled(),
      serverSideEnabled: config.serverSideEnabled,
      hashPii: config.hashPii,
      eventMappingCount: config.eventMappings.length,
      mappings: config.eventMappings.map(m => ({
        sourceEvent: m.sourceEvent,
        targetEvent: m.targetEvent,
        providers: m.providers,
      })),
    };
  }
}
