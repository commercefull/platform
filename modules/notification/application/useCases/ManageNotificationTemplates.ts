import type { NotificationTemplateCreateParams, NotificationTemplateRepository } from '../../domain/repositories/NotificationTemplateRepository';
import { NotificationTemplateNotFoundError, NotificationValidationError } from '../../domain/errors/NotificationErrors';

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
  async getById(id: string) {
    const template = await this.notificationTemplateRepo.findById(id);
    if (!template) {
      throw new NotificationTemplateNotFoundError(id);
    }
    return template;
  }
  async findByType(type: string) {
    const all = await this.notificationTemplateRepo.findAll(false);
    return all.filter(t => t.type === type);
  }
  async count(activeOnly?: boolean) {
    return this.notificationTemplateRepo.count(activeOnly);
  }
  async create(params: NotificationTemplateCreateParams) {
    if (!params.code || !params.name || !params.type || !params.supportedChannels || !params.defaultChannel) {
      throw new NotificationValidationError('code, name, type, supportedChannels, and defaultChannel are required');
    }
    return this.notificationTemplateRepo.create(params);
  }
  async updateExisting(id: string, updates: Record<string, unknown>) {
    const existing = await this.getById(id);
    const updated = await this.notificationTemplateRepo.update(id, updates);
    return updated || existing;
  }
  async deleteExisting(id: string) {
    await this.getById(id);
    return this.notificationTemplateRepo.delete(id);
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
