import '../../tests/testUtils';
import { ManageIntegrationLogsUseCase } from './ManageIntegrationLogs';
import type { IntegrationLogRepository } from '../../domain/repositories/IntegrationRepository';
import { createIntegrationLog, lazyMock } from '../../tests/testUtils';

describe('ManageIntegrationLogsUseCase', () => {
  it('should delegate listing to the repository with filters', async () => {
    const logRepo = lazyMock<IntegrationLogRepository>();
    logRepo.findByIntegration.mockResolvedValue({ data: [createIntegrationLog()], total: 1 });

    const result = await new ManageIntegrationLogsUseCase(logRepo).listLogs('int-1', { limit: 10 });

    expect(result.total).toBe(1);
    expect(logRepo.findByIntegration).toHaveBeenCalledWith('int-1', { limit: 10 });
  });
});
