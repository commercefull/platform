import { notificationConfigRepository } from '../wired';
import type { NotificationTemplateCreateParams, NotificationTemplateRepository } from '../../domain/repositories/NotificationTemplateRepository';

const notificationTemplateRepo: NotificationTemplateRepository = notificationConfigRepository.templates;

export class ManageNotificationTemplatesUseCase {
  async findAll(activeOnly?: boolean) {
    return notificationTemplateRepo.findAll(activeOnly);
  }
  async findByCategory(category: string, activeOnly?: boolean) {
    return notificationTemplateRepo.findByCategory(category, activeOnly);
  }
  async findById(id: string) {
    return notificationTemplateRepo.findById(id);
  }
  async count(activeOnly?: boolean) {
    return notificationTemplateRepo.count(activeOnly);
  }
  async create(params: NotificationTemplateCreateParams) {
    return notificationTemplateRepo.create(params);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return notificationTemplateRepo.update(id, updates);
  }
  async activate(id: string) {
    return notificationTemplateRepo.activate(id);
  }
  async deactivate(id: string) {
    return notificationTemplateRepo.deactivate(id);
  }
  async delete(id: string) {
    return notificationTemplateRepo.delete(id);
  }
  async clone(id: string, newCode: string, newName: string) {
    return notificationTemplateRepo.clone(id, newCode, newName);
  }
  async getPreview(id: string, data?: Record<string, unknown>) {
    return notificationTemplateRepo.getPreview(id, data);
  }
}
