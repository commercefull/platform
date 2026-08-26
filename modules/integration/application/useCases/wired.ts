import { IntegrationRepositoryImpl } from '../../infrastructure/repositories/IntegrationRepositoryImpl';
import { IntegrationCredentialRepositoryImpl } from '../../infrastructure/repositories/IntegrationCredentialRepositoryImpl';
import { IntegrationSubscriptionRepositoryImpl } from '../../infrastructure/repositories/IntegrationSubscriptionRepositoryImpl';
import { IntegrationLogRepositoryImpl } from '../../infrastructure/repositories/IntegrationLogRepositoryImpl';
import { ManageIntegrationsUseCase, ManageSubscriptionsUseCase, ManageIntegrationLogsUseCase } from './Integration';

const integrationRepo = new IntegrationRepositoryImpl();
const credentialRepo = new IntegrationCredentialRepositoryImpl();
const subscriptionRepo = new IntegrationSubscriptionRepositoryImpl();
const logRepo = new IntegrationLogRepositoryImpl();

export const manageIntegrations = new ManageIntegrationsUseCase(integrationRepo, credentialRepo);
export const manageSubscriptions = new ManageSubscriptionsUseCase(subscriptionRepo, integrationRepo);
export const manageIntegrationLogs = new ManageIntegrationLogsUseCase(logRepo);

export { integrationRepo, credentialRepo, subscriptionRepo, logRepo };
