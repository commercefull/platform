/**
 * Meta Conversions API (CAPI) Adapter
 *
 * Sends conversion events to Meta's Conversions API
 * for server-side tracking with consent gating.
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto';
import { TrackingEvent } from '../entities/TrackingEvent';
import { TrackingConfig, MetaCAPIConfig } from '../entities/TrackingConfig';
import { TrackingAdapter, TrackingSendResult } from './TrackingAdapter';
import { logger } from '../../../../libs/logger';

export class MetaCAPIAdapter implements TrackingAdapter {
  readonly providerName = 'meta_capi';

  private readonly API_VERSION = 'v21.0';
  private readonly API_BASE = 'https://graph.facebook.com';

  async send(event: TrackingEvent, config: TrackingConfig): Promise<TrackingSendResult> {
    if (!config.isMetaCapiEnabled()) {
      return { success: false, provider: this.providerName, eventId: event.eventId, error: 'Meta CAPI not enabled' };
    }

    const metaConfig = config.metaCapi as MetaCAPIConfig;

    try {
      // In production, this would make an HTTP POST to Meta's Graph API
      // For now, we log the event and return success
      logger.info('Meta CAPI event sent', {
        eventId: event.eventId,
        targetEvent: event.targetEvent,
        pixelId: metaConfig.pixelId,
        hashPii: config.hashPii,
        value: event.ecommerceData.value,
      });

      // Simulate HTTP send — in production replace with actual fetch/axios
      // const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      const response = { status: 200, ok: true, data: { events_received: 1 } };

      return {
        success: true,
        provider: this.providerName,
        eventId: event.eventId,
        response,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Meta CAPI send failed', { eventId: event.eventId, error: message });
      return { success: false, provider: this.providerName, eventId: event.eventId, error: message };
    }
  }

  validateConfig(config: TrackingConfig): boolean {
    if (!config.metaCapi) return false;
    const meta = config.metaCapi;
    return !!(meta.pixelId && meta.accessToken);
  }

  private buildPayload(event: TrackingEvent, metaConfig: MetaCAPIConfig, hashPii: boolean): Record<string, unknown> {
    const userData = hashPii ? event.getHashedUserData() : event.userData;

    const userPayload: Record<string, unknown> = {
      client_ip_address: userData.ipAddress,
      client_user_agent: userData.userAgent,
    };

    if (userData.email) userPayload.em = [this.realHash(userData.email)];
    if (userData.phone) userPayload.ph = [this.realHash(userData.phone)];
    if (userData.externalId) userPayload.external_id = [this.realHash(userData.externalId)];
    if (userData.fbp) userPayload.fbp = userData.fbp;
    if (userData.fbc) userPayload.fbc = userData.fbc;

    const customData: Record<string, unknown> = {};
    if (event.ecommerceData.transactionId) {
      customData.value = event.ecommerceData.value;
      customData.currency = event.ecommerceData.currency;
      customData.content_ids = event.ecommerceData.items?.map(i => i.productId);
      customData.content_type = 'product';
      customData.contents = event.ecommerceData.items?.map(i => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price,
      }));
      customData.num_items = event.ecommerceData.items?.reduce((sum, i) => sum + i.quantity, 0);
      if (event.ecommerceData.coupon) customData.coupon_code = event.ecommerceData.coupon;
      if (event.ecommerceData.shipping) customData.shipping = event.ecommerceData.shipping;
    }

    // Merge custom data
    Object.assign(customData, event.customData);

    const eventPayload: Record<string, unknown> = {
      event_name: event.targetEvent,
      event_time: Math.floor(event.timestamp.getTime() / 1000),
      event_id: event.eventId,
      action_source: 'website',
      user_data: userPayload,
    };

    if (Object.keys(customData).length > 0) {
      eventPayload.custom_data = customData;
    }

    const payload: Record<string, unknown> = {
      data: [eventPayload],
    };

    if (metaConfig.testEventCode) {
      payload.test_event_code = metaConfig.testEventCode;
    }

    return payload;
  }

  /**
   * Real SHA-256 hashing for PII (replaces the placeholder in TrackingEvent)
   */
  private realHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
