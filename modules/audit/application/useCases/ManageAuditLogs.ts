import type { AuditRepository, AuditLogFilters } from '../../domain/repositories/AuditRepository';
import type { PaginationOptions } from 'libs/types/shared';

export class ManageAuditLogsUseCase {
  constructor(private readonly auditRepository: AuditRepository) {}

  async findAll(filters?: AuditLogFilters, pagination?: PaginationOptions) {
    return this.auditRepository.findAll(filters, pagination);
  }
  async findById(auditLogId: string) {
    return this.auditRepository.findById(auditLogId);
  }
  async findByCorrelationId(correlationId: string) {
    return this.auditRepository.findByCorrelationId(correlationId);
  }
  async verifyChain(fromId?: string, toId?: string) {
    return this.auditRepository.verifyChain(fromId, toId);
  }
  async countByAction() {
    return this.auditRepository.countByAction();
  }
  async countByActor() {
    return this.auditRepository.countByActor();
  }
}
