/**
 * MarkAsRead Use Case
 */

export interface MarkAsReadInput {
  notificationIds: string[];
  recipientId: string;
}

export interface MarkAsReadOutput {
  markedCount: number;
  markedAt: string;
}

export class MarkAsReadUseCase {
  constructor(private readonly notificationRepository: any) {}

  async execute(input: MarkAsReadInput): Promise<MarkAsReadOutput> {
    if (!input.notificationIds || input.notificationIds.length === 0) {
      throw new Error('At least one notification ID is required');
    }

    const now = new Date();
    let markedCount = 0;

    for (const notificationId of input.notificationIds) {
      const notification = await this.notificationRepository.findById(notificationId);
      
      // Verify ownership and not already read
      if (notification && notification.recipientId === input.recipientId && !notification.isRead) {
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
