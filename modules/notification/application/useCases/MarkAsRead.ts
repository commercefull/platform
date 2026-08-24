/**
 * MarkAsRead Use Case
 */

import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

export interface MarkAsReadInput {
  notificationIds: string[];
  recipientId: string;
}

export interface MarkAsReadOutput {
  markedCount: number;
  markedAt: string;
}

export interface MarkAsReadRepository {
  findById(notificationId: string): Promise<{ notificationId: string; userId?: string; recipientId?: string; isRead: boolean } | null>;
  markAsRead(notificationId: string, readAt?: Date): Promise<unknown>;
}

export class MarkAsReadUseCase {
  constructor(private readonly notificationRepository: MarkAsReadRepository) {}

  async execute(input: MarkAsReadInput): Promise<MarkAsReadOutput> {
    if (!input.notificationIds || input.notificationIds.length === 0) {
      throw new NotificationValidationError('At least one notification ID is required');
    }

    const now = new Date();
    let markedCount = 0;

    for (const notificationId of input.notificationIds) {
      const notification = await this.notificationRepository.findById(notificationId);

      // Verify ownership and not already read
      if (notification && (notification.recipientId === input.recipientId || notification.userId === input.recipientId) && !notification.isRead) {
        await this.notificationRepository.markAsRead(notificationId, now);
        markedCount++;
      }
    }

    return {
      markedCount,
      markedAt: now.toISOString(),
    };
  }
}
