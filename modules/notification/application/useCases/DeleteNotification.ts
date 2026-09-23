 
/**
 * Delete Notification Use Case
 *
 * Deletes a single notification or all notifications for a user.
 */

import type { NotificationCommandRepository } from '../../domain/repositories/NotificationCommandRepository';

export interface DeleteNotificationInput {
  notificationId?: string;
  userId?: string;
  deleteAll?: boolean;
}

export interface DeleteNotificationOutput {
  deleted: boolean;
  deletedCount: number;
}

export class DeleteNotificationUseCase {
  constructor(private readonly notificationRepo: Pick<NotificationCommandRepository, 'delete' | 'deleteAllForUser'>) {}

  async execute(input: DeleteNotificationInput): Promise<DeleteNotificationOutput> {
    if (input.deleteAll && input.userId) {
      const count = await this.notificationRepo.deleteAllForUser(input.userId);
      return { deleted: true, deletedCount: count };
    }

    if (input.notificationId) {
      const success = await this.notificationRepo.delete(input.notificationId);
      return { deleted: success, deletedCount: success ? 1 : 0 };
    }

    return { deleted: false, deletedCount: 0 };
  }
}
