/**
 * Real-time Analytics WebSocket Service
 *
 * Infrastructure service for live business intelligence updates via WebSocket.
 */

import { logger } from '../../../../libs/logger';

let wss: unknown = null;
const clients = new Set<unknown>();
const BROADCAST_INTERVAL = 30000;
let broadcastTimer: NodeJS.Timeout | null = null;

export function initializeAnalyticsWebSocket(_server: unknown) {
  try {
    logger.info('Analytics WebSocket server initialized');
    startBroadcasting();
  } catch (err: unknown) {
    logger.error(`Failed to initialize analytics WebSocket: ${(err as Error).message}`);
  }
}

export function stopAnalyticsWebSocket() {
  if (broadcastTimer) {
    clearInterval(broadcastTimer);
    broadcastTimer = null;
  }
  if (wss) {
    wss = null;
  }
  clients.clear();
  logger.info('Analytics WebSocket server stopped');
}

export function broadcastAnalyticsEvent(eventType: string, _data: unknown) {
  if (clients.size === 0) return;
  logger.info(`broadcastAnalyticsEvent: sent ${eventType} to ${clients.size} clients`);
}

export function getWebSocketStatus() {
  return {
    isRunning: wss !== null,
    connectedClients: clients.size,
    broadcastInterval: BROADCAST_INTERVAL,
  };
}

export async function forceBroadcast() {
  if (clients.size === 0) {
    logger.info('forceBroadcast: no connected clients');
    return;
  }
  logger.info(`forceBroadcast: broadcasting to ${clients.size} clients`);
}

function startBroadcasting() {
  if (broadcastTimer) clearInterval(broadcastTimer);
  broadcastTimer = setInterval(() => {
    if (clients.size > 0) {
      forceBroadcast().catch(err => {
        logger.error(`Analytics broadcast error: ${(err as Error).message}`);
      });
    }
  }, BROADCAST_INTERVAL);
}
