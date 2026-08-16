import { PaginatedResult, PaginationOptions } from 'libs/types/shared';
import { StoreDispatch, DispatchStatus } from '../entities/StoreDispatch';

export interface DispatchFilters {
  fromStoreId?: string;
  toStoreId?: string;
  status?: DispatchStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface StoreDispatchRepository {
  findById(dispatchId: string): Promise<StoreDispatch | null>;
  findByNumber(dispatchNumber: string): Promise<StoreDispatch | null>;
  findAll(filters?: DispatchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<StoreDispatch>>;
  save(dispatch: StoreDispatch): Promise<StoreDispatch>;
  delete(dispatchId: string): Promise<void>;
}
