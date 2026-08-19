/**
 * List Promotions Use Case
 * Lists promotions with filtering and pagination
 */

import { PromotionRepo, PromotionStatus } from '../../infrastructure/repositories/promotionRepo';

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
  constructor(private readonly promotionRepo: PromotionRepo) {}

  async execute(command: ListPromotionsCommand): Promise<ListPromotionsResponse> {
    const promotions = await this.promotionRepo.findAll(
      {
        status: command.filters?.status as PromotionStatus[] | PromotionStatus | undefined,
        isActive: command.filters?.isActive,
        organizationId: command.filters?.organizationId,
      },
      {
        limit: command.pagination?.limit || 50,
        offset: command.pagination?.offset || 0,
        orderBy: command.pagination?.orderBy || 'createdAt',
        direction: command.pagination?.direction || 'DESC',
      },
    );

    // Calculate total (approximate for now)
    const total = promotions.length; // This is a simplified version

    return {
      data: promotions,
      total,
      limit: command.pagination?.limit || 50,
      offset: command.pagination?.offset || 0,
      hasMore: promotions.length === (command.pagination?.limit || 50),
    };
  }
}
