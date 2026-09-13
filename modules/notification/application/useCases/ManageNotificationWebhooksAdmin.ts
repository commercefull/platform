import { notificationConfigRepository } from '../wired';
import type { NotificationWebhookCreateParams, NotificationWebhookRepository } from '../../domain/repositories/NotificationWebhookRepository';

const notificationWebhookRepo: NotificationWebhookRepository = notificationConfigRepository.webhooks;

export class ManageNotificationWebhooksAdminUseCase {
  async findAll() {
    return notificationWebhookRepo.findAll();
  }
  async create(params: NotificationWebhookCreateParams) {
    return notificationWebhookRepo.create(params);
  }
  async deactivate(id: string) {
    return notificationWebhookRepo.deactivate(id);
  }
}
