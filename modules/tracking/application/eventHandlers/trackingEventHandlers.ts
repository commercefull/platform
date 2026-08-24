/**
 * Tracking Event Handler Registration
 *
 * Subscribes to relevant platform events from the event bus,
 * checks consent, and routes to tracking adapters via ProcessTrackingEventUseCase.
 *
 * Called from registerAllEventHandlers() at boot.
 */

import { eventBus, EventPayload, EventType } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';
import { TrackingConfigRepositoryImpl } from '../../infrastructure/repositories/TrackingConfigRepositoryImpl';
import { ProcessTrackingEventUseCase } from '../../application/useCases/Tracking';
import { TrackingEcommerceData } from '../../domain/entities/TrackingEvent';
import { getDefaultEventMappings } from '../../domain/services/defaultEventMappings';
import { GdprCookieConsentRepository } from '../../../gdpr/domain/repositories/GdprRepository';

const trackingRepo = new TrackingConfigRepositoryImpl();
const processEventUseCase = new ProcessTrackingEventUseCase(trackingRepo);

// We need consent checking — use the GDPR cookie consent repository
// This is injected lazily to avoid circular dependencies
let consentRepo: GdprCookieConsentRepository | null = null;

export function setConsentRepository(repo: GdprCookieConsentRepository): void {
  consentRepo = repo;
}

/**
 * Check if consent is granted for a given category for a session
 */
async function checkConsent(
  sessionId: string | undefined,
  category: 'analytics' | 'marketing' | 'thirdParty',
): Promise<boolean> {
  if (!consentRepo || !sessionId) return false;

  try {
    const consent = await consentRepo.findBySessionId(sessionId);
    if (!consent || consent.isExpired()) return false;
    return consent.isAllowed(category);
  } catch {
    return false;
  }
}

/**
 * Extract tracking data from an event payload
 */
function extractTrackingData(payload: EventPayload): {
  storeId?: string;
  sessionId?: string;
  customerId?: string;
  email?: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
  ecommerceData?: Record<string, unknown>;
} {
  const data = (payload.data || {}) as Record<string, unknown>;

  return {
    storeId: data.storeId as string,
    sessionId: data.sessionId as string,
    customerId: data.customerId as string,
    email: data.email as string,
    phone: data.phone as string,
    ipAddress: data.ipAddress as string,
    userAgent: data.userAgent as string,
    ecommerceData: data.ecommerceData as Record<string, unknown> | undefined,
  };
}

/**
 * Register all tracking event handlers on the event bus
 */
export function registerTrackingEventHandlers(): void {
  const trackedEvents = getDefaultEventMappings().map(m => m.sourceEvent);

  for (const eventType of trackedEvents) {
    eventBus.registerHandler(eventType as EventType, async (payload: EventPayload) => {
      try {
        const extracted = extractTrackingData(payload);
        if (!extracted.storeId) {
          logger.debug('Tracking event skipped — no storeId', { type: payload.type });
          return;
        }

        // Check consent
        const consentCategory = getDefaultEventMappings().find(
          m => m.sourceEvent === payload.type,
        )?.consentCategory || 'marketing';

        const consentGranted = await checkConsent(extracted.sessionId, consentCategory);

        // Process the tracking event
        await processEventUseCase.execute({
          storeId: extracted.storeId,
          sourceEvent: payload.type,
          userData: {
            sessionId: extracted.sessionId,
            customerId: extracted.customerId,
            email: extracted.email,
            phone: extracted.phone,
            ipAddress: extracted.ipAddress,
            userAgent: extracted.userAgent,
          },
          ecommerceData: extracted.ecommerceData as TrackingEcommerceData | undefined,
          customData: (payload.data as Record<string, unknown>) || {},
          consentGranted,
          correlationId: payload.correlationId,
        });
      } catch (err) {
        // Tracking errors should never break the main flow
        logger.error('Tracking event handler error', {
          type: payload.type,
          error: (err as Error).message,
        });
      }
    });
  }

  logger.info('Tracking event handlers registered', { count: trackedEvents.length });
}
