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
import { getDefaultEventMappings } from '../../domain/services/defaultEventMappings';
import { TrackingConfigNotFoundError, TrackingConfigAlreadyExistsError } from '../../domain/errors/TrackingErrors';


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
