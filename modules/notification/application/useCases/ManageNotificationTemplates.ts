import type { NotificationTemplateCreateParams, NotificationTemplateRepository } from '../../domain/repositories/NotificationTemplateRepository';

export class ManageNotificationTemplatesUseCase {
  constructor(private readonly notificationTemplateRepo: NotificationTemplateRepository) {}

  async findAll(activeOnly?: boolean) {
    return this.notificationTemplateRepo.findAll(activeOnly);
  }
  async findByCategory(category: string, activeOnly?: boolean) {
    return this.notificationTemplateRepo.findByCategory(category, activeOnly);
  }
  async findById(id: string) {
    return this.notificationTemplateRepo.findById(id);
  }
  async count(activeOnly?: boolean) {
    return this.notificationTemplateRepo.count(activeOnly);
  }
  async create(params: NotificationTemplateCreateParams) {
    return this.notificationTemplateRepo.create(params);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return this.notificationTemplateRepo.update(id, updates);
  }
  async activate(id: string) {
    return this.notificationTemplateRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.notificationTemplateRepo.deactivate(id);
  }
  async delete(id: string) {
    return this.notificationTemplateRepo.delete(id);
  }
  async clone(id: string, newCode: string, newName: string) {
    return this.notificationTemplateRepo.clone(id, newCode, newName);
  }
  async getPreview(id: string, data?: Record<string, unknown>) {
    return this.notificationTemplateRepo.getPreview(id, data);
  }
}
