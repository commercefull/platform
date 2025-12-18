/**
 * Support Repository
 * Handles CRUD operations for support tickets, messages, and agents
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  AGENT: Table.SupportAgent,
  TICKET: Table.SupportTicket,
  MESSAGE: Table.SupportMessage,
  ATTACHMENT: Table.SupportAttachment
};

// ============================================================================
// Types
// ============================================================================

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'shipping' | 'return' | 'product' | 'payment' | 'account' | 'technical' | 'other';
export type TicketChannel = 'web' | 'email' | 'phone' | 'chat' | 'social';
export type SenderType = 'customer' | 'agent' | 'system';
export type AgentRole = 'agent' | 'supervisor' | 'admin';

export interface SupportAgent {
  supportAgentId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  role: AgentRole;
  department?: string;
  skills?: string[];
  languages?: string[];
  isActive: boolean;
  isAvailable: boolean;
  maxTickets: number;
  currentTickets: number;
  totalTicketsHandled: number;
  averageResponseTimeMinutes?: number;
  averageResolutionTimeMinutes?: number;
  satisfactionScore?: number;
  satisfactionCount: number;
  timezone: string;
  workingHours?: Record<string, any>;
  notificationPreferences?: Record<string, any>;
  metadata?: Record<string, any>;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  supportTicketId: string;
  ticketNumber: string;
  customerId?: string;
  orderId?: string;
  email: string;
  name?: string;
  phone?: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  subcategory?: string;
  channel: TicketChannel;
  assignedAgentId?: string;
  lastMessageBy?: string;
  lastMessageByType?: SenderType;
  lastMessageAt?: Date;
  firstResponseAt?: Date;
  responseTimeMinutes?: number;
  resolvedAt?: Date;
  resolutionTimeMinutes?: number;
  resolutionType?: string;
  resolutionNotes?: string;
  customerSatisfaction?: number;
  customerFeedback?: string;
  feedbackRequested: boolean;
  feedbackRequestedAt?: Date;
  tags?: string[];
  isEscalated: boolean;
  escalatedTo?: string;
  escalatedAt?: Date;
  escalationReason?: string;
  isSpam: boolean;
  reopenCount: number;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  dueAt?: Date;
}

export interface SupportMessage {
  supportMessageId: string;
  supportTicketId: string;
  senderId?: string;
  senderType: SenderType;
  senderName?: string;
  senderEmail?: string;
  message: string;
  messageHtml?: string;
  messageType: string;
  isInternal: boolean;
  isAutoReply: boolean;
  isRead: boolean;
  readAt?: Date;
  readBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SupportAttachment {
  supportAttachmentId: string;
  supportTicketId: string;
  supportMessageId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  uploadedByType?: string;
  isPublic: boolean;
  isScanned: boolean;
  isSafe: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// Support Agents
// ============================================================================

export async function getAgent(supportAgentId: string): Promise<SupportAgent | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "supportAgent" WHERE "supportAgentId" = $1',
    [supportAgentId]
  );
  return row ? mapToAgent(row) : null;
}

export async function getAgentByEmail(email: string): Promise<SupportAgent | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "supportAgent" WHERE "email" = $1',
    [email]
  );
  return row ? mapToAgent(row) : null;
}

export async function getAgents(filters?: { 
  isActive?: boolean; 
  isAvailable?: boolean;
  department?: string;
}): Promise<SupportAgent[]> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }
  if (filters?.isAvailable !== undefined) {
    whereClause += ` AND "isAvailable" = $${paramIndex++}`;
    params.push(filters.isAvailable);
  }
  if (filters?.department) {
    whereClause += ` AND "department" = $${paramIndex++}`;
    params.push(filters.department);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "supportAgent" WHERE ${whereClause} ORDER BY "lastName", "firstName"`,
    params
  );
  return (rows || []).map(mapToAgent);
}

export async function getAvailableAgent(category?: string): Promise<SupportAgent | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "supportAgent" 
     WHERE "isActive" = true AND "isAvailable" = true 
     AND "currentTickets" < "maxTickets"
     ORDER BY "currentTickets" ASC, "satisfactionScore" DESC NULLS LAST
     LIMIT 1`
  );
  return row ? mapToAgent(row) : null;
}

export async function saveAgent(agent: Partial<SupportAgent> & { email: string; firstName: string; lastName: string }): Promise<SupportAgent> {
  const now = new Date().toISOString();

  if (agent.supportAgentId) {
    await query(
      `UPDATE "supportAgent" SET
        "firstName" = $1, "lastName" = $2, "displayName" = $3, "avatarUrl" = $4,
        "role" = $5, "department" = $6, "skills" = $7, "languages" = $8,
        "isActive" = $9, "isAvailable" = $10, "maxTickets" = $11,
        "timezone" = $12, "workingHours" = $13, "notificationPreferences" = $14,
        "metadata" = $15, "updatedAt" = $16
      WHERE "supportAgentId" = $17`,
      [
        agent.firstName, agent.lastName, agent.displayName, agent.avatarUrl,
        agent.role || 'agent', agent.department, agent.skills, agent.languages,
        agent.isActive !== false, agent.isAvailable !== false, agent.maxTickets || 20,
        agent.timezone || 'UTC',
        agent.workingHours ? JSON.stringify(agent.workingHours) : null,
        agent.notificationPreferences ? JSON.stringify(agent.notificationPreferences) : null,
        agent.metadata ? JSON.stringify(agent.metadata) : null,
        now, agent.supportAgentId
      ]
    );
    return (await getAgent(agent.supportAgentId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "supportAgent" (
        "email", "firstName", "lastName", "displayName", "avatarUrl", "role",
        "department", "skills", "languages", "isActive", "isAvailable", "maxTickets",
        "timezone", "workingHours", "notificationPreferences", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        agent.email, agent.firstName, agent.lastName, agent.displayName, agent.avatarUrl,
        agent.role || 'agent', agent.department, agent.skills, agent.languages,
        true, true, agent.maxTickets || 20, agent.timezone || 'UTC',
        agent.workingHours ? JSON.stringify(agent.workingHours) : null,
        agent.notificationPreferences ? JSON.stringify(agent.notificationPreferences) : null,
        agent.metadata ? JSON.stringify(agent.metadata) : null, now, now
      ]
    );
    return mapToAgent(result!);
  }
}

export async function updateAgentTicketCount(supportAgentId: string, delta: number): Promise<void> {
  await query(
    `UPDATE "supportAgent" SET "currentTickets" = GREATEST(0, "currentTickets" + $1), "updatedAt" = $2
     WHERE "supportAgentId" = $3`,
    [delta, new Date().toISOString(), supportAgentId]
  );
}

// ============================================================================
// Support Tickets
// ============================================================================

export async function getTicket(supportTicketId: string): Promise<SupportTicket | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "supportTicket" WHERE "supportTicketId" = $1',
    [supportTicketId]
  );
  return row ? mapToTicket(row) : null;
}

export async function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "supportTicket" WHERE "ticketNumber" = $1',
    [ticketNumber]
  );
  return row ? mapToTicket(row) : null;
}

export async function getTickets(
  filters?: {
    customerId?: string;
    assignedAgentId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    isEscalated?: boolean;
  },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: SupportTicket[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.assignedAgentId) {
    whereClause += ` AND "assignedAgentId" = $${paramIndex++}`;
    params.push(filters.assignedAgentId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.priority) {
    whereClause += ` AND "priority" = $${paramIndex++}`;
    params.push(filters.priority);
  }
  if (filters?.category) {
    whereClause += ` AND "category" = $${paramIndex++}`;
    params.push(filters.category);
  }
  if (filters?.isEscalated !== undefined) {
    whereClause += ` AND "isEscalated" = $${paramIndex++}`;
    params.push(filters.isEscalated);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "supportTicket" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "supportTicket" WHERE ${whereClause} 
     ORDER BY 
       CASE "priority" WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
       "createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToTicket),
    total: parseInt(countResult?.count || '0')
  };
}

export async function createTicket(ticket: {
  customerId?: string;
  orderId?: string;
  email: string;
  name?: string;
  phone?: string;
  subject: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  channel?: TicketChannel;
}): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const ticketNumber = await generateTicketNumber();

  // Auto-assign to available agent
  const agent = await getAvailableAgent(ticket.category);

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "supportTicket" (
      "ticketNumber", "customerId", "orderId", "email", "name", "phone",
      "subject", "description", "status", "priority", "category", "channel",
      "assignedAgentId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      ticketNumber, ticket.customerId, ticket.orderId, ticket.email, ticket.name,
      ticket.phone, ticket.subject, ticket.description, ticket.priority || 'medium',
      ticket.category || 'other', ticket.channel || 'web',
      agent?.supportAgentId, now, now
    ]
  );

  // Update agent ticket count
  if (agent) {
    await updateAgentTicketCount(agent.supportAgentId, 1);
  }

  return mapToTicket(result!);
}

export async function updateTicket(
  supportTicketId: string,
  updates: Partial<SupportTicket>
): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const ticket = await getTicket(supportTicketId);
  if (!ticket) throw new Error('Ticket not found');

  // Handle agent reassignment
  if (updates.assignedAgentId && updates.assignedAgentId !== ticket.assignedAgentId) {
    if (ticket.assignedAgentId) {
      await updateAgentTicketCount(ticket.assignedAgentId, -1);
    }
    await updateAgentTicketCount(updates.assignedAgentId, 1);
  }

  await query(
    `UPDATE "supportTicket" SET
      "status" = COALESCE($1, "status"),
      "priority" = COALESCE($2, "priority"),
      "category" = COALESCE($3, "category"),
      "assignedAgentId" = COALESCE($4, "assignedAgentId"),
      "tags" = COALESCE($5, "tags"),
      "updatedAt" = $6
    WHERE "supportTicketId" = $7`,
    [
      updates.status, updates.priority, updates.category,
      updates.assignedAgentId, updates.tags, now, supportTicketId
    ]
  );

  return (await getTicket(supportTicketId))!;
}

export async function resolveTicket(
  supportTicketId: string,
  resolutionType: string,
  resolutionNotes?: string
): Promise<void> {
  const now = new Date();
  const ticket = await getTicket(supportTicketId);
  if (!ticket) throw new Error('Ticket not found');

  const resolutionTimeMinutes = Math.floor(
    (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
  );

  await query(
    `UPDATE "supportTicket" SET 
      "status" = 'resolved', "resolvedAt" = $1, "resolutionTimeMinutes" = $2,
      "resolutionType" = $3, "resolutionNotes" = $4, "updatedAt" = $1
     WHERE "supportTicketId" = $5`,
    [now.toISOString(), resolutionTimeMinutes, resolutionType, resolutionNotes, supportTicketId]
  );

  // Update agent stats
  if (ticket.assignedAgentId) {
    await updateAgentTicketCount(ticket.assignedAgentId, -1);
    await query(
      `UPDATE "supportAgent" SET 
        "totalTicketsHandled" = "totalTicketsHandled" + 1,
        "updatedAt" = $1
       WHERE "supportAgentId" = $2`,
      [now.toISOString(), ticket.assignedAgentId]
    );
  }
}

export async function closeTicket(supportTicketId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportTicket" SET "status" = 'closed', "closedAt" = $1, "updatedAt" = $1
     WHERE "supportTicketId" = $2`,
    [now, supportTicketId]
  );
}

export async function escalateTicket(
  supportTicketId: string,
  escalatedTo: string,
  reason: string
): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportTicket" SET 
      "isEscalated" = true, "escalatedTo" = $1, "escalatedAt" = $2,
      "escalationReason" = $3, "priority" = 'urgent', "updatedAt" = $2
     WHERE "supportTicketId" = $4`,
    [escalatedTo, now, reason, supportTicketId]
  );
}

export async function submitFeedback(
  supportTicketId: string,
  satisfaction: number,
  feedback?: string
): Promise<void> {
  const now = new Date().toISOString();
  const ticket = await getTicket(supportTicketId);
  
  await query(
    `UPDATE "supportTicket" SET 
      "customerSatisfaction" = $1, "customerFeedback" = $2, "updatedAt" = $3
     WHERE "supportTicketId" = $4`,
    [satisfaction, feedback, now, supportTicketId]
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
      [satisfaction, now, ticket.assignedAgentId]
    );
  }
}

// ============================================================================
// Support Messages
// ============================================================================

export async function getMessage(supportMessageId: string): Promise<SupportMessage | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "supportMessage" WHERE "supportMessageId" = $1',
    [supportMessageId]
  );
  return row ? mapToMessage(row) : null;
}

export async function getMessages(supportTicketId: string, includeInternal: boolean = false): Promise<SupportMessage[]> {
  let whereClause = '"supportTicketId" = $1';
  if (!includeInternal) {
    whereClause += ' AND "isInternal" = false';
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "supportMessage" WHERE ${whereClause} ORDER BY "createdAt" ASC`,
    [supportTicketId]
  );
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
  if (!ticket) throw new Error('Ticket not found');

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "supportMessage" (
      "supportTicketId", "senderId", "senderType", "senderName", "senderEmail",
      "message", "messageHtml", "messageType", "isInternal", "isAutoReply", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      message.supportTicketId, message.senderId, message.senderType,
      message.senderName, message.senderEmail, message.message, message.messageHtml,
      message.messageType || 'reply', message.isInternal || false,
      message.isAutoReply || false, now.toISOString()
    ]
  );

  // Update ticket
  const updateFields: any = {
    lastMessageBy: message.senderId,
    lastMessageByType: message.senderType,
    lastMessageAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // Track first response time for agent replies
  if (message.senderType === 'agent' && !ticket.firstResponseAt) {
    const responseTimeMinutes = Math.floor(
      (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
    );
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
      updateFields.lastMessageBy, updateFields.lastMessageByType, updateFields.lastMessageAt,
      updateFields.firstResponseAt, updateFields.responseTimeMinutes,
      updateFields.status, updateFields.updatedAt, message.supportTicketId
    ]
  );

  return mapToMessage(result!);
}

export async function markMessagesRead(supportTicketId: string, readBy: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportMessage" SET "isRead" = true, "readAt" = $1, "readBy" = $2
     WHERE "supportTicketId" = $3 AND "isRead" = false`,
    [now, readBy, supportTicketId]
  );
}

// ============================================================================
// Attachments
// ============================================================================

export async function addAttachment(attachment: {
  supportTicketId: string;
  supportMessageId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  uploadedByType?: string;
}): Promise<SupportAttachment> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "supportAttachment" (
      "supportTicketId", "supportMessageId", "fileName", "originalName",
      "mimeType", "fileSize", "storageUrl", "thumbnailUrl",
      "uploadedBy", "uploadedByType", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      attachment.supportTicketId, attachment.supportMessageId, attachment.fileName,
      attachment.originalName, attachment.mimeType, attachment.fileSize,
      attachment.storageUrl, attachment.thumbnailUrl, attachment.uploadedBy,
      attachment.uploadedByType, now
    ]
  );

  return mapToAttachment(result!);
}

export async function getAttachments(supportTicketId: string): Promise<SupportAttachment[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "supportAttachment" WHERE "supportTicketId" = $1 ORDER BY "createdAt" ASC',
    [supportTicketId]
  );
  return (rows || []).map(mapToAttachment);
}

// ============================================================================
// Helpers
// ============================================================================

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "supportTicket" WHERE "ticketNumber" LIKE $1`,
    [`TKT${year}%`]
  );
  const count = parseInt(result?.count || '0') + 1;
  return `TKT${year}-${count.toString().padStart(6, '0')}`;
}

function mapToAgent(row: Record<string, any>): SupportAgent {
  return {
    supportAgentId: row.supportAgentId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    role: row.role,
    department: row.department,
    skills: row.skills,
    languages: row.languages,
    isActive: Boolean(row.isActive),
    isAvailable: Boolean(row.isAvailable),
    maxTickets: parseInt(row.maxTickets) || 20,
    currentTickets: parseInt(row.currentTickets) || 0,
    totalTicketsHandled: parseInt(row.totalTicketsHandled) || 0,
    averageResponseTimeMinutes: row.averageResponseTimeMinutes ? parseInt(row.averageResponseTimeMinutes) : undefined,
    averageResolutionTimeMinutes: row.averageResolutionTimeMinutes ? parseInt(row.averageResolutionTimeMinutes) : undefined,
    satisfactionScore: row.satisfactionScore ? parseFloat(row.satisfactionScore) : undefined,
    satisfactionCount: parseInt(row.satisfactionCount) || 0,
    timezone: row.timezone || 'UTC',
    workingHours: row.workingHours,
    notificationPreferences: row.notificationPreferences,
    metadata: row.metadata,
    lastActiveAt: row.lastActiveAt ? new Date(row.lastActiveAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToTicket(row: Record<string, any>): SupportTicket {
  return {
    supportTicketId: row.supportTicketId,
    ticketNumber: row.ticketNumber,
    customerId: row.customerId,
    orderId: row.orderId,
    email: row.email,
    name: row.name,
    phone: row.phone,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    subcategory: row.subcategory,
    channel: row.channel,
    assignedAgentId: row.assignedAgentId,
    lastMessageBy: row.lastMessageBy,
    lastMessageByType: row.lastMessageByType,
    lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined,
    firstResponseAt: row.firstResponseAt ? new Date(row.firstResponseAt) : undefined,
    responseTimeMinutes: row.responseTimeMinutes ? parseInt(row.responseTimeMinutes) : undefined,
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined,
    resolutionTimeMinutes: row.resolutionTimeMinutes ? parseInt(row.resolutionTimeMinutes) : undefined,
    resolutionType: row.resolutionType,
    resolutionNotes: row.resolutionNotes,
    customerSatisfaction: row.customerSatisfaction ? parseInt(row.customerSatisfaction) : undefined,
    customerFeedback: row.customerFeedback,
    feedbackRequested: Boolean(row.feedbackRequested),
    feedbackRequestedAt: row.feedbackRequestedAt ? new Date(row.feedbackRequestedAt) : undefined,
    tags: row.tags,
    isEscalated: Boolean(row.isEscalated),
    escalatedTo: row.escalatedTo,
    escalatedAt: row.escalatedAt ? new Date(row.escalatedAt) : undefined,
    escalationReason: row.escalationReason,
    isSpam: Boolean(row.isSpam),
    reopenCount: parseInt(row.reopenCount) || 0,
    customFields: row.customFields,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    closedAt: row.closedAt ? new Date(row.closedAt) : undefined,
    dueAt: row.dueAt ? new Date(row.dueAt) : undefined
  };
}

function mapToMessage(row: Record<string, any>): SupportMessage {
  return {
    supportMessageId: row.supportMessageId,
    supportTicketId: row.supportTicketId,
    senderId: row.senderId,
    senderType: row.senderType,
    senderName: row.senderName,
    senderEmail: row.senderEmail,
    message: row.message,
    messageHtml: row.messageHtml,
    messageType: row.messageType,
    isInternal: Boolean(row.isInternal),
    isAutoReply: Boolean(row.isAutoReply),
    isRead: Boolean(row.isRead),
    readAt: row.readAt ? new Date(row.readAt) : undefined,
    readBy: row.readBy,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt)
  };
}

function mapToAttachment(row: Record<string, any>): SupportAttachment {
  return {
    supportAttachmentId: row.supportAttachmentId,
    supportTicketId: row.supportTicketId,
    supportMessageId: row.supportMessageId,
    fileName: row.fileName,
    originalName: row.originalName,
    mimeType: row.mimeType,
    fileSize: parseInt(row.fileSize) || 0,
    storageUrl: row.storageUrl,
    thumbnailUrl: row.thumbnailUrl,
    uploadedBy: row.uploadedBy,
    uploadedByType: row.uploadedByType,
    isPublic: Boolean(row.isPublic),
    isScanned: Boolean(row.isScanned),
    isSafe: Boolean(row.isSafe),
    metadata: row.metadata,
    createdAt: new Date(row.createdAt)
  };
}
