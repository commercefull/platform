import { ChannelType } from './channelType';

/**
 * Enum for channel status
 */
export enum ChannelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * Helper function to convert ChannelStatus to boolean for database
 */
export function channelStatusToBoolean(status: ChannelStatus): boolean {
  return status === ChannelStatus.ACTIVE;
}

/**
 * Helper function to convert boolean to ChannelStatus
 */
export function booleanToChannelStatus(isActive: boolean): ChannelStatus {
  return isActive ? ChannelStatus.ACTIVE : ChannelStatus.INACTIVE;
}

/**
 * Interface for Channel entity
 */
export interface Channel {
  distributionChannelId: string;
  name: string;
  code: string;
  type: ChannelType;
  description?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for ChannelProduct entity (products assigned to channels)
 */
export interface ChannelProduct {
  distributionChannelProductId: string;
  distributionChannelId: string;
  productId: string;
  isActive: boolean;
  overrideSku?: string;
  overridePrice?: number;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}
