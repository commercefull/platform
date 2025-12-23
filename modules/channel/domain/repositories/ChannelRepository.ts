/**
 * Channel Repository Interface
 * 
 * Defines the contract for Channel persistence operations.
 */

import { Channel } from '../entities/Channel';
import { ChannelProduct } from '../entities/ChannelProduct';

export interface ChannelFilters {
  type?: string;
  ownerType?: string;
  ownerId?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ChannelProductFilters {
  channelId?: string;
  productId?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IChannelRepository {
  // Channel operations
  save(channel: Channel): Promise<Channel>;
  findById(channelId: string): Promise<Channel | null>;
  findByCode(code: string): Promise<Channel | null>;
  findAll(filters?: ChannelFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Channel>>;
  findByOwner(ownerType: string, ownerId: string): Promise<Channel[]>;
  findDefault(): Promise<Channel | null>;
  delete(channelId: string): Promise<boolean>;
  
  // Channel Product operations
  saveChannelProduct(channelProduct: ChannelProduct): Promise<ChannelProduct>;
  findChannelProduct(channelId: string, productId: string): Promise<ChannelProduct | null>;
  findChannelProducts(channelId: string, filters?: ChannelProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ChannelProduct>>;
  findProductChannels(productId: string): Promise<ChannelProduct[]>;
  removeChannelProduct(channelId: string, productId: string): Promise<boolean>;
  bulkAssignProducts(channelId: string, productIds: string[]): Promise<ChannelProduct[]>;
  bulkRemoveProducts(channelId: string, productIds: string[]): Promise<boolean>;
}
