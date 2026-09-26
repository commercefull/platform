import type { ExecutionLogRepository } from '../../domain/repositories/AutomationRepository';

export class ListExecutionLogsUseCase {
  constructor(private readonly logRepo: ExecutionLogRepository) {}

  async findByRule(ruleId: string, limit?: number) {
    return this.logRepo.findByRule(ruleId, limit);
  }
}
