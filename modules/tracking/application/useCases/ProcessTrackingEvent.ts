import { generateUUID } from '../../../../libs/uuid';
import { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';
import { TrackingEvent, TrackingUserData, TrackingEcommerceData } from '../../domain/entities/TrackingEvent';
import { TrackingAdapter, TrackingSendResult } from '../../domain/services/TrackingAdapter';
import { GTMServerAdapter } from '../../domain/services/GTMServerAdapter';
import { MetaCAPIAdapter } from '../../domain/services/MetaCAPIAdapter';
import { TrackingConfigNotFoundError, TrackingEventNotMappedError } from '../../domain/errors/TrackingErrors';
import { logger } from '../../../../libs/logger';


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
