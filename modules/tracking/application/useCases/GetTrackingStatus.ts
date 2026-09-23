import { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';


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
