/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type SupportMessage = {
  supportMessageId: string;
  supportTicketId: string;
  senderId: string | null;
  senderType: string;
  senderName: string | null;
  senderEmail: string | null;
  message: string;
  messageHtml: string | null;
  messageType: string | null;
  isInternal: boolean | null;
  isAutoReply: boolean | null;
  isRead: boolean | null;
  readAt: Date | null;
  readBy: string | null;
  metadata: unknown | null;
  createdAt: Date | null;
}

