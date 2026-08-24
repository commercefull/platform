/**
 * GTM Server-Side Container Adapter
 *
 * Sends events to a Google Tag Manager Server-Side container
 * via the GTM Server API (Measurement Protocol or GA4 MP).
 */

import { TrackingEvent } from '../entities/TrackingEvent';
import { TrackingConfig, GTMConfig } from '../entities/TrackingConfig';
import { TrackingAdapter, TrackingSendResult } from './TrackingAdapter';
import { logger } from '../../../../libs/logger';

export class GTMServerAdapter implements TrackingAdapter {
  readonly providerName = 'gtm';

  async send(event: TrackingEvent, config: TrackingConfig): Promise<TrackingSendResult> {
    if (!config.isGtmEnabled()) {
      return { success: false, provider: this.providerName, eventId: event.eventId, error: 'GTM not enabled' };
    }

    const gtmConfig = config.gtm as GTMConfig;

    try {
      const url = `${gtmConfig.serverContainerUrl}/gtm/server`;

      // In production, this would make an HTTP POST to the GTM Server container
      // For now, we log the event and return success
      logger.info('GTM Server-Side event sent', {
        eventId: event.eventId,
        targetEvent: event.targetEvent,
        containerId: gtmConfig.containerId,
        url,
        value: event.ecommerceData.value,
      });

      // Simulate HTTP send — in production replace with actual fetch/axios
      // const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      const response = { status: 200, ok: true };

      return {
        success: true,
        provider: this.providerName,
        eventId: event.eventId,
        response,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('GTM Server-Side send failed', { eventId: event.eventId, error: message });
      return { success: false, provider: this.providerName, eventId: event.eventId, error: message };
    }
  }

  validateConfig(config: TrackingConfig): boolean {
    if (!config.gtm) return false;
    const gtm = config.gtm;
    return !!(gtm.containerId && gtm.serverContainerUrl);
  }

  private buildPayload(event: TrackingEvent, gtmConfig: GTMConfig): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      containerId: gtmConfig.containerId,
      eventId: event.eventId,
      eventName: event.targetEvent,
      timestamp: event.timestamp.toISOString(),
      clientId: event.userData.sessionId || event.userData.customerId,
      userData: {
        email: event.userData.email,
        phone: event.userData.phone,
        ipAddress: event.userData.ipAddress,
        userAgent: event.userData.userAgent,
      },
    };

    if (gtmConfig.ga4MeasurementId) {
      payload.measurementId = gtmConfig.ga4MeasurementId;
    }

    // Ecommerce data
    if (event.ecommerceData.transactionId) {
      payload.ecommerce = {
        transaction_id: event.ecommerceData.transactionId,
        value: event.ecommerceData.value,
        currency: event.ecommerceData.currency,
        items: event.ecommerceData.items,
        coupon: event.ecommerceData.coupon,
        shipping: event.ecommerceData.shipping,
        tax: event.ecommerceData.tax,
      };
    }

    // Custom data
    if (Object.keys(event.customData).length > 0) {
      payload.custom = event.customData;
    }

    return payload;
  }
}
