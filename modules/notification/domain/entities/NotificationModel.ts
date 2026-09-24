/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type NotificationRecord = {
  notificationId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  userType: string;
  type: string;
  title: string;
  content: string;
  channel: string;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  expiresAt: Date | null;
  actionUrl: string | null;
  actionLabel: string | null;
  imageUrl: string | null;
  priority: string | null;
  category: string | null;
  data: unknown | null;
  metadata: unknown | null;
  deletedAt: Date | null;
}

