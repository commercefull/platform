/**
 * Promotion Repository Interface
 */

import { Promotion, PromotionStatus, PromotionType } from '../entities/Promotion';

export interface PromotionFilters {
  status?: PromotionStatus | PromotionStatus[];
  type?: PromotionType;
  merchantId?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PromotionRepository {
  findById(promotionId: string): Promise<Promotion | null>;
  findByCode(code: string): Promise<Promotion | null>;
  findAll(filters?: PromotionFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Promotion>>;
  findActive(pagination?: PaginationOptions): Promise<PaginatedResult<Promotion>>;
  save(promotion: Promotion): Promise<Promotion>;
  delete(promotionId: string): Promise<void>;
  count(filters?: PromotionFilters): Promise<number>;

  // Usage tracking
  recordUsage(promotionId: string, customerId: string, orderId: string, discountAmount: number): Promise<void>;
  getCustomerUsageCount(promotionId: string, customerId: string): Promise<number>;

  // Validation
  validateCode(
    code: string,
    subtotal: number,
    customerId?: string,
  ): Promise<{
    valid: boolean;
    promotion?: Promotion;
    discount?: number;
    message?: string;
  }>;
}
