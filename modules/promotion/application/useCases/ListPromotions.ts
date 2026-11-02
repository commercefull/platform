/**
 * List Promotions Use Case
 * Lists promotions with filtering and pagination
 */

import { PromotionRepository, type PromotionStatus } from '../../domain/repositories/PromotionRepository';

// Command
export class ListPromotionsCommand {
  constructor(
    public readonly filters?: {
      status?: string | string[];
      isActive?: boolean;
      organizationId?: string;
    },
    public readonly pagination?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    },
  ) {}
}

// Response
export interface ListPromotionsResponse {
  data: unknown[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Use Case
export class ListPromotionsUseCase {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(command: ListPromotionsCommand): Promise<ListPromotionsResponse> {
    const pagination = this.resolvePagination(command);
    const promotions = await this.promotionRepo.findAll(this.resolveFilters(command), pagination);

    // Calculate total (approximate for now)
    const total = promotions.length; // This is a simplified version

    return {
      data: promotions,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
      hasMore: promotions.length === pagination.limit,
    };
  }

  private resolveFilters(command: ListPromotionsCommand): {
    status?: PromotionStatus[] | PromotionStatus;
    isActive?: boolean;
    organizationId?: string;
  } {
    return {
      status: command.filters?.status as PromotionStatus[] | PromotionStatus | undefined,
      isActive: command.filters?.isActive,
      organizationId: command.filters?.organizationId,
    };
  }

  private resolvePagination(command: ListPromotionsCommand): {
    limit: number;
    offset: number;
    orderBy: string;
    direction: 'ASC' | 'DESC';
  } {
    const p = command.pagination;
    return {
      limit: p?.limit || 50,
      offset: p?.offset || 0,
      orderBy: p?.orderBy || 'createdAt',
      direction: p?.direction || 'DESC',
    };
  }
}
