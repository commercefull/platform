/**
 * GetIntegrationDetail Use Case
 *
 * Composed read for the integration detail surface: the integration itself,
 * its credentials, event subscriptions, and the most recent execution logs.
 * Shared so the admin view and any API/GraphQL consumer return the same shape.
 */

import type { ManageIntegrationsUseCase } from './ManageIntegrations';
import type { ManageSubscriptionsUseCase } from './ManageSubscriptions';
import type { ManageIntegrationLogsUseCase } from './ManageIntegrationLogs';

export class GetIntegrationDetailUseCase {
  constructor(
    private readonly manageIntegrations: ManageIntegrationsUseCase,
    private readonly manageSubscriptions: ManageSubscriptionsUseCase,
    private readonly manageIntegrationLogs: ManageIntegrationLogsUseCase,
  ) {}

  async execute(integrationId: string, options?: { logLimit?: number }) {
    const [integration, credentials, subscriptions, logsResult] = await Promise.all([
      this.manageIntegrations.getIntegration(integrationId),
      this.manageIntegrations.getCredentials(integrationId),
      this.manageSubscriptions.listSubscriptions(integrationId),
      this.manageIntegrationLogs.listLogs(integrationId, { limit: options?.logLimit ?? 20 }),
    ]);

    return {
      integration,
      credentials,
      subscriptions,
      logs: logsResult.data,
      logTotal: logsResult.total,
    };
  }
}
