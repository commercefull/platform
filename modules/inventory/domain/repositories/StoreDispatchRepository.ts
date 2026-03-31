import { StoreDispatch, DispatchStatus } from '../entities/StoreDispatch';

export interface DispatchFilters {
  fromStoreId?: string;
  toStoreId?: string;
  status?: DispatchStatus;
  dateFrom?: Date;
  dateTo?: Date;
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

export interface StoreDispatchRepository {
  findById(dispatchId: string): Promise<StoreDispatch | null>;
  findByNumber(dispatchNumber: string): Promise<StoreDispatch | null>;
  findAll(filters?: DispatchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<StoreDispatch>>;
  save(dispatch: StoreDispatch): Promise<StoreDispatch>;
  delete(dispatchId: string): Promise<void>;
}
