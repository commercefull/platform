/**
 * Track Page View Use Case
 * Records a page view event for analytics
 */

import * as analyticsRepo from '../../repos/analyticsRepo';
import { eventBus } from '../../../../libs/events/eventBus';

export interface TrackPageViewCommand {
  sessionId: string;
  customerId?: string;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface TrackPageViewResponse {
  success: boolean;
  pageViewId?: string;
  error?: string;
}

export class TrackPageViewUseCase {
  async execute(command: TrackPageViewCommand): Promise<TrackPageViewResponse> {
    try {
      // Validate required fields
      if (!command.sessionId) {
        return { success: false, error: 'Session ID is required' };
      }
      if (!command.pageUrl) {
        return { success: false, error: 'Page URL is required' };
      }

      // Note: recordPageView function would need to be added to analyticsRepo
      // For now, we emit the event which can be consumed by event handlers
      const pageViewId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Emit event
      (eventBus as any).emit('analytics.pageview.tracked', {
        sessionId: command.sessionId,
        customerId: command.customerId,
        pageUrl: command.pageUrl,
        pageTitle: command.pageTitle,
        referrer: command.referrer,
        userAgent: command.userAgent,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        pageViewId,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
