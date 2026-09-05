 
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Delete Notification Use Case
 *
 * Deletes a single notification or all notifications for a user.
 */

import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const notificationRepo = notificationDataRepository.notifications;

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
  async execute(input: DeleteNotificationInput): Promise<DeleteNotificationOutput> {
    if (input.deleteAll && input.userId) {
      const count = await notificationRepo.deleteAllForUser(input.userId);
      return { deleted: true, deletedCount: count };
    }

    if (input.notificationId) {
      const success = await notificationRepo.delete(input.notificationId);
      return { deleted: success, deletedCount: success ? 1 : 0 };
    }

    return { deleted: false, deletedCount: 0 };
  }
}

const deleteNotificationUseCase = new DeleteNotificationUseCase();
