import { ForbiddenError } from '../../../../libs/errors';
import type { NotificationPreferenceRepository } from '../../domain/repositories/NotificationPreferenceRepository';
import { NotificationPreferenceNotFoundError } from '../../domain/errors/NotificationErrors';

export class ManageNotificationPreferencesUseCase {
  constructor(private readonly preferenceRepo: NotificationPreferenceRepository) {}

  async findAll() {
    return this.preferenceRepo.findAll();
  }

  async findById(id: string) {
    return this.preferenceRepo.findById(id);
  }

  async getById(id: string) {
    const preference = await this.preferenceRepo.findById(id);
    if (!preference) {
      throw new NotificationPreferenceNotFoundError(id);
    }
    return preference;
  }

  async findByUser(userId: string, userType: string) {
    return this.preferenceRepo.findByUser(userId, userType);
  }

  async findByUserAndType(userId: string, userType: string, type: string) {
    return this.preferenceRepo.findByUserAndType(userId, userType, type);
  }

  async update(
    id: string,
    params: Parameters<NotificationPreferenceRepository['update']>[1],
  ) {
    const updated = await this.preferenceRepo.update(id, params);
    if (!updated) {
      throw new NotificationPreferenceNotFoundError(id);
    }
    return updated;
  }

  async deleteById(id: string) {
    const deleted = await this.preferenceRepo.deleteById(id);
    if (!deleted) {
      throw new NotificationPreferenceNotFoundError(id);
    }
    return { id };
  }

  async bulkUpsert(
    userId: string,
    userType: string,
    updates: Parameters<NotificationPreferenceRepository['bulkUpsert']>[2],
  ) {
    return this.preferenceRepo.bulkUpsert(userId, userType, updates);
  }

  async getOwnedById(id: string, userId: string) {
    const preference = await this.getById(id);
    if (preference.userId !== userId) {
      throw new ForbiddenError('Unauthorized');
    }
    return preference;
  }

  async updateOwned(id: string, userId: string, params: Parameters<NotificationPreferenceRepository['update']>[1]) {
    await this.getOwnedById(id, userId);
    return this.update(id, params);
  }

  async deleteOwned(id: string, userId: string) {
    await this.getOwnedById(id, userId);
    return this.deleteById(id);
  }
}
