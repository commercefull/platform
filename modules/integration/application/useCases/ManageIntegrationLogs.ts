import type { IntegrationLogRepository } from '../../domain/repositories/IntegrationRepository';
import { IntegrationLog } from '../../domain/entities/IntegrationLog';

export class ManageIntegrationLogsUseCase {
  constructor(private logRepo: IntegrationLogRepository) {}

  async listLogs(
    integrationId: string,
    filters?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ data: IntegrationLog[]; total: number }> {
    return this.logRepo.findByIntegration(integrationId, filters as never);
  }

  async getLog(logId: string): Promise<IntegrationLog | null> {
    return this.logRepo.findById(logId);
  }

  async deleteLogs(integrationId: string): Promise<boolean> {
    return this.logRepo.deleteByIntegration(integrationId);
  }
}
