import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';

const notificationWebhookRepo = notificationConfigRepository.webhooks;

export class ManageNotificationWebhooksAdminUseCase {
  async findAll() {
    return notificationWebhookRepo.findAll();
  }
  async create(params: Parameters<typeof notificationWebhookRepo.create>[0]) {
    return notificationWebhookRepo.create(params);
  }
  async deactivate(id: string) {
    return notificationWebhookRepo.deactivate(id);
  }
}
