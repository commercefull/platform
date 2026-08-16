import { DispatchFilters, StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';
import { PaginationOptions } from 'libs/types/shared';

export interface ListStoreDispatchesInput extends DispatchFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class ListStoreDispatchesUseCase {
  constructor(private readonly dispatchRepository: StoreDispatchRepository) {}

  async execute(input: ListStoreDispatchesInput): Promise<Record<string, unknown>> {
    const filters: DispatchFilters = {
      fromStoreId: input.fromStoreId,
      toStoreId: input.toStoreId,
      status: input.status,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    };

    const pagination: PaginationOptions = {
      limit: input.limit,
      offset: input.offset,
      orderBy: input.orderBy,
      orderDirection: input.orderDirection,
    };

    const result = await this.dispatchRepository.findAll(filters, pagination);

    return {
      dispatches: result.data.map(dispatch => dispatch.toJSON()),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
