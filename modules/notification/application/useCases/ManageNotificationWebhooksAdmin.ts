import type { NotificationWebhookCreateParams, NotificationWebhookRepository } from '../../domain/repositories/NotificationWebhookRepository';

export class ManageNotificationWebhooksAdminUseCase {
  constructor(private readonly notificationWebhookRepo: NotificationWebhookRepository) {}

  async findAll() {
    return this.notificationWebhookRepo.findAll();
  }
  async create(params: NotificationWebhookCreateParams) {
    return this.notificationWebhookRepo.create(params);
  }
  async deactivate(id: string) {
    return this.notificationWebhookRepo.deactivate(id);
  }
}
