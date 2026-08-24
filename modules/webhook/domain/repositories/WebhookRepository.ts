/**
 * Webhook Repository Interface (Domain Contract)
 */

import { WebhookEndpointProps } from '../entities/WebhookEndpoint';
import { WebhookDeliveryProps, DeliveryStatus } from '../entities/WebhookDelivery';
import { PaginationOptions } from 'libs/types/shared';

export interface WebhookEndpointFilters {
  organizationId?: string;
  isActive?: boolean;
  eventType?: string;
}

export interface WebhookDeliveryFilters {
  webhookEndpointId?: string;
  eventType?: string;
  status?: DeliveryStatus;
  since?: Date;
}

export interface WebhookRepositoryInterface {
  // Endpoint operations
  createEndpoint(props: Omit<WebhookEndpointProps, 'createdAt' | 'updatedAt'>): Promise<WebhookEndpointProps>;
  findEndpointById(id: string): Promise<WebhookEndpointProps | null>;
  findEndpointsByEvent(eventType: string): Promise<WebhookEndpointProps[]>;
  findEndpoints(filters?: WebhookEndpointFilters, pagination?: PaginationOptions): Promise<{ data: WebhookEndpointProps[]; total: number }>;
  updateEndpoint(id: string, updates: Partial<WebhookEndpointProps>): Promise<WebhookEndpointProps | null>;
  deleteEndpoint(id: string): Promise<boolean>;

  // Delivery operations
  createDelivery(props: Omit<WebhookDeliveryProps, 'createdAt' | 'updatedAt'>): Promise<WebhookDeliveryProps>;
  findDeliveryById(id: string): Promise<WebhookDeliveryProps | null>;
  findDeliveries(
    filters?: WebhookDeliveryFilters,
    pagination?: PaginationOptions,
  ): Promise<{ data: WebhookDeliveryProps[]; total: number }>;
  updateDelivery(id: string, updates: Partial<WebhookDeliveryProps>): Promise<WebhookDeliveryProps | null>;
  findPendingRetries(): Promise<WebhookDeliveryProps[]>;

  /**
   * Claim pending retry deliveries using FOR UPDATE SKIP LOCKED.
   * Multi-node safe — prevents double-processing across workers.
   * Marks claimed rows with lockedBy/lockedAt.
   */
  claimPendingRetries(nodeId: string, batchSize: number): Promise<WebhookDeliveryProps[]>;

  /**
   * Release the lock on a delivery (clear lockedBy/lockedAt).
   * Called after processing completes (success or failure).
   */
  releaseDeliveryLock(id: string): Promise<void>;
}
