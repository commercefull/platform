/**
 * Ticket operations, messages and attachments — extracted from supportRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import { SupportTicketNotFoundError } from '../../domain/errors/SupportErrors';
import type {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketChannel,
  SenderType,
  SupportTicketProps,
} from '../../domain/entities/SupportTicket';
import type {
  SupportAttachment as DbSupportAttachment,
  SupportMessage as DbSupportMessage,
  SupportTicket as DbSupportTicket,
} from '../../../../libs/db/types';

export type SupportTicket = SupportTicketProps;
type SupportMessage = DbSupportMessage;
type SupportAttachment = DbSupportAttachment;

export async function getTicket(supportTicketId: string): Promise<SupportTicket | null> {
  const row = await queryOne<DbSupportTicket>('SELECT * FROM "supportTicket" WHERE "supportTicketId" = $1', [supportTicketId]);
  return row ? mapToTicket(row) : null;
}

export function mapToTicket(row: Record<string, unknown>): SupportTicket {
  return {
    supportTicketId: row.supportTicketId as string,
    ticketNumber: row.ticketNumber as string,
    customerId: row.customerId as string | undefined,
    orderId: row.orderId as string | undefined,
    email: row.email as string,
    name: row.name as string | undefined,
    phone: row.phone as string | undefined,
    subject: row.subject as string,
    description: row.description as string | undefined,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    category: row.category as TicketCategory,
    subcategory: row.subcategory as string | undefined,
    channel: row.channel as TicketChannel,
    assignedAgentId: row.assignedAgentId as string | undefined,
    lastMessageBy: row.lastMessageBy as string | undefined,
    lastMessageByType: row.lastMessageByType as SenderType | undefined,
    lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt as string) : undefined,
    firstResponseAt: row.firstResponseAt ? new Date(row.firstResponseAt as string) : undefined,
    responseTimeMinutes: row.responseTimeMinutes ? parseInt(row.responseTimeMinutes as string) : undefined,
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt as string) : undefined,
    resolutionTimeMinutes: row.resolutionTimeMinutes ? parseInt(row.resolutionTimeMinutes as string) : undefined,
    resolutionType: row.resolutionType as string | undefined,
    resolutionNotes: row.resolutionNotes as string | undefined,
    customerSatisfaction: row.customerSatisfaction ? parseInt(row.customerSatisfaction as string) : undefined,
    customerFeedback: row.customerFeedback as string | undefined,
    feedbackRequested: Boolean(row.feedbackRequested),
    feedbackRequestedAt: row.feedbackRequestedAt ? new Date(row.feedbackRequestedAt as string) : undefined,
    tags: row.tags as string[] | undefined,
    isEscalated: Boolean(row.isEscalated),
    escalatedTo: row.escalatedTo as string | undefined,
    escalatedAt: row.escalatedAt ? new Date(row.escalatedAt as string) : undefined,
    escalationReason: row.escalationReason as string | undefined,
    isSpam: Boolean(row.isSpam),
    reopenCount: parseInt(row.reopenCount as string) || 0,
    customFields: row.customFields as Record<string, unknown> | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
    closedAt: row.closedAt ? new Date(row.closedAt as string) : undefined,
    dueAt: row.dueAt ? new Date(row.dueAt as string) : undefined,
  };
}

function mapToMessage(row: Record<string, unknown>): SupportMessage {
  return {
    supportMessageId: row.supportMessageId as string,
    supportTicketId: row.supportTicketId as string,
    senderId: row.senderId as string,
    senderType: row.senderType as SenderType,
    senderName: row.senderName as string,
    senderEmail: row.senderEmail as string,
    message: row.message as string,
    messageHtml: row.messageHtml as string | null,
    messageType: row.messageType as string,
    isInternal: Boolean(row.isInternal),
    isAutoReply: Boolean(row.isAutoReply),
    isRead: Boolean(row.isRead),
    readAt: row.readAt ? new Date(row.readAt as string) : null,
    readBy: row.readBy as string | null,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: new Date(row.createdAt as string),
  };
}

function mapToAttachment(row: Record<string, unknown>): SupportAttachment {
  return {
    supportAttachmentId: row.supportAttachmentId as string,
    supportTicketId: row.supportTicketId as string,
    supportMessageId: row.supportMessageId as string | null,
    fileName: row.fileName as string,
    originalName: row.originalName as string,
    mimeType: row.mimeType as string,
    fileSize: parseInt(row.fileSize as string) || 0,
    storageUrl: row.storageUrl as string,
    thumbnailUrl: row.thumbnailUrl as string | null,
    uploadedBy: row.uploadedBy as string | null,
    uploadedByType: row.uploadedByType as string | null,
    isPublic: Boolean(row.isPublic),
    isScanned: Boolean(row.isScanned),
    isSafe: Boolean(row.isSafe),
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: new Date(row.createdAt as string),
  };
}

export async function resolveTicket(supportTicketId: string, resolutionType: string, resolutionNotes?: string): Promise<void> {
  const now = new Date();
  const ticket = await getTicket(supportTicketId);
  if (!ticket) throw new SupportTicketNotFoundError(supportTicketId);

  const resolutionTimeMinutes = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (1000 * 60));

  await query(
    `UPDATE "supportTicket" SET 
      "status" = 'resolved', "resolvedAt" = $1, "resolutionTimeMinutes" = $2,
      "resolutionType" = $3, "resolutionNotes" = $4, "updatedAt" = $1
     WHERE "supportTicketId" = $5`,
    [now.toISOString(), resolutionTimeMinutes, resolutionType, resolutionNotes, supportTicketId],
  );

  // Update agent stats
  if (ticket.assignedAgentId) {
    await updateAgentTicketCount(ticket.assignedAgentId, -1);
    await query(
      `UPDATE "supportAgent" SET 
        "totalTicketsHandled" = "totalTicketsHandled" + 1,
        "updatedAt" = $1
       WHERE "supportAgentId" = $2`,
      [now.toISOString(), ticket.assignedAgentId],
    );
  }
}

export async function closeTicket(supportTicketId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportTicket" SET "status" = 'closed', "closedAt" = $1, "updatedAt" = $1
     WHERE "supportTicketId" = $2`,
    [now, supportTicketId],
  );
}

export async function escalateTicket(supportTicketId: string, escalatedTo: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportTicket" SET 
      "isEscalated" = true, "escalatedTo" = $1, "escalatedAt" = $2,
      "escalationReason" = $3, "priority" = 'urgent', "updatedAt" = $2
     WHERE "supportTicketId" = $4`,
    [escalatedTo, now, reason, supportTicketId],
  );
}

export async function submitFeedback(supportTicketId: string, satisfaction: number, feedback?: string): Promise<void> {
  const now = new Date().toISOString();
  const ticket = await getTicket(supportTicketId);

  await query(
    `UPDATE "supportTicket" SET 
      "customerSatisfaction" = $1, "customerFeedback" = $2, "updatedAt" = $3
     WHERE "supportTicketId" = $4`,
    [satisfaction, feedback, now, supportTicketId],
  );

  // Update agent satisfaction score
  if (ticket?.assignedAgentId) {
    await query(
      `UPDATE "supportAgent" SET 
        "satisfactionScore" = (
          COALESCE("satisfactionScore" * "satisfactionCount", 0) + $1
        ) / ("satisfactionCount" + 1),
        "satisfactionCount" = "satisfactionCount" + 1,
        "updatedAt" = $2
       WHERE "supportAgentId" = $3`,
      [satisfaction, now, ticket.assignedAgentId],
    );
  }
}

export async function getMessages(supportTicketId: string, includeInternal: boolean = false): Promise<SupportMessage[]> {
  let whereClause = '"supportTicketId" = $1';
  if (!includeInternal) {
    whereClause += ' AND "isInternal" = false';
  }

  const rows = await query<DbSupportMessage[]>(`SELECT * FROM "supportMessage" WHERE ${whereClause} ORDER BY "createdAt" ASC`, [
    supportTicketId,
  ]);
  return (rows || []).map(mapToMessage);
}

export async function addMessage(message: {
  supportTicketId: string;
  senderId?: string;
  senderType: SenderType;
  senderName?: string;
  senderEmail?: string;
  message: string;
  messageHtml?: string;
  messageType?: string;
  isInternal?: boolean;
  isAutoReply?: boolean;
}): Promise<SupportMessage> {
  const now = new Date();
  const ticket = await getTicket(message.supportTicketId);
  if (!ticket) throw new SupportTicketNotFoundError(message.supportTicketId);

  const result = await queryOne<DbSupportMessage>(
    `INSERT INTO "supportMessage" (
      "supportTicketId", "senderId", "senderType", "senderName", "senderEmail",
      "message", "messageHtml", "messageType", "isInternal", "isAutoReply", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      message.supportTicketId,
      message.senderId,
      message.senderType,
      message.senderName,
      message.senderEmail,
      message.message,
      message.messageHtml,
      message.messageType || 'reply',
      message.isInternal || false,
      message.isAutoReply || false,
      now.toISOString(),
    ],
  );

  // Update ticket
  const updateFields: {
    lastMessageBy: string | undefined;
    lastMessageByType: string | undefined;
    lastMessageAt: string;
    updatedAt: string;
    firstResponseAt?: string;
    responseTimeMinutes?: number;
    status?: string;
  } = {
    lastMessageBy: message.senderId,
    lastMessageByType: message.senderType,
    lastMessageAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Track first response time for agent replies
  if (message.senderType === 'agent' && !ticket.firstResponseAt) {
    const responseTimeMinutes = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (1000 * 60));
    updateFields.firstResponseAt = now.toISOString();
    updateFields.responseTimeMinutes = responseTimeMinutes;
  }

  // Update status based on sender
  if (message.senderType === 'agent' && ticket.status === 'open') {
    updateFields.status = 'in_progress';
  } else if (message.senderType === 'customer' && ticket.status === 'waiting_customer') {
    updateFields.status = 'open';
  }

  await query(
    `UPDATE "supportTicket" SET 
      "lastMessageBy" = $1, "lastMessageByType" = $2, "lastMessageAt" = $3,
      "firstResponseAt" = COALESCE($4, "firstResponseAt"),
      "responseTimeMinutes" = COALESCE($5, "responseTimeMinutes"),
      "status" = COALESCE($6, "status"), "updatedAt" = $7
     WHERE "supportTicketId" = $8`,
    [
      updateFields.lastMessageBy,
      updateFields.lastMessageByType,
      updateFields.lastMessageAt,
      updateFields.firstResponseAt,
      updateFields.responseTimeMinutes,
      updateFields.status,
      updateFields.updatedAt,
      message.supportTicketId,
    ],
  );

  return mapToMessage(result!);
}

export async function markMessagesRead(supportTicketId: string, readBy: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportMessage" SET "isRead" = true, "readAt" = $1, "readBy" = $2
     WHERE "supportTicketId" = $3 AND "isRead" = false`,
    [now, readBy, supportTicketId],
  );
}

export async function getAttachments(supportTicketId: string): Promise<SupportAttachment[]> {
  const rows = await query<DbSupportAttachment[]>(
    'SELECT * FROM "supportAttachment" WHERE "supportTicketId" = $1 ORDER BY "createdAt" ASC',
    [supportTicketId],
  );
  return (rows || []).map(mapToAttachment);
}

export async function updateAgentTicketCount(supportAgentId: string, delta: number): Promise<void> {
  await query(
    `UPDATE "supportAgent" SET "currentTickets" = GREATEST(0, "currentTickets" + $1), "updatedAt" = $2
     WHERE "supportAgentId" = $3`,
    [delta, new Date().toISOString(), supportAgentId],
  );
}
