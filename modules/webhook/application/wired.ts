import WebhookRepo from '../infrastructure/repositories/WebhookRepository';
import { ListWebhooksUseCase } from './useCases/ListWebhooks';
import { RegisterWebhookUseCase } from './useCases/RegisterWebhook';
import { UnregisterWebhookUseCase } from './useCases/UnregisterWebhook';
import { ManageWebhooksUseCase } from './useCases/ManageWebhooks';

export const listWebhooksUseCase = new ListWebhooksUseCase(WebhookRepo);
export const registerWebhookUseCase = new RegisterWebhookUseCase(WebhookRepo);
export const unregisterWebhookUseCase = new UnregisterWebhookUseCase(WebhookRepo);
export const manageWebhooksUseCase = new ManageWebhooksUseCase(WebhookRepo);
