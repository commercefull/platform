import { CcpaDataSubjectRequest, CcpaRequestType, CcpaRequestStatus } from '../entities/CcpaDataSubjectRequest';
import { PaginatedResult, PaginationOptions } from '../../../../libs/types/shared';

export interface CcpaDsrFilters {
  organizationId?: string;
  customerId?: string;
  requestType?: CcpaRequestType;
  status?: CcpaRequestStatus;
  isOverdue?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface CcpaDsrRepository {
  findById(ccpaDsrId: string): Promise<CcpaDataSubjectRequest | null>;
  findByCustomer(customerId: string): Promise<CcpaDataSubjectRequest[]>;
  findByOrganization(organizationId: string, filters?: CcpaDsrFilters, pagination?: PaginationOptions): Promise<PaginatedResult<CcpaDataSubjectRequest>>;
  findOverdue(): Promise<CcpaDataSubjectRequest[]>;
  findPending(pagination?: PaginationOptions): Promise<PaginatedResult<CcpaDataSubjectRequest>>;
  save(dsr: CcpaDataSubjectRequest): Promise<CcpaDataSubjectRequest>;
  delete(ccpaDsrId: string): Promise<void>;
  findAll(filters?: CcpaDsrFilters, pagination?: PaginationOptions): Promise<PaginatedResult<CcpaDataSubjectRequest>>;
}
