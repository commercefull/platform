/**
 * Support Repository
 * Handles CRUD operations for support tickets, messages, and agents
 */

import { query, queryOne } from '../../../../libs/db';
import { SupportTicketNotFoundError } from '../../domain/errors/SupportErrors';
import type {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketChannel,
} from '../../domain/entities/SupportTicket';
import type { SupportAgent, AgentRole } from '../../domain/repositories/SupportRepository';


export type {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketChannel,
  SenderType,
  SupportAgent,
} from '../../domain/repositories/SupportRepository';
// Types
// ============================================================================

export type { SupportTicket } from './supportTicketOpsQueries';
import type { SupportTicket } from './supportTicketOpsQueries';

import { getTicket, mapToTicket, updateAgentTicketCount } from './supportTicketOpsQueries';
import type { SupportAgent as DbSupportAgent, SupportTicket as DbSupportTicket } from '../../../../libs/db/types';

// ============================================================================
// Support Agents
// ============================================================================

export async function getAgent(supportAgentId: string): Promise<SupportAgent | null> {
  const row = await queryOne<DbSupportAgent>('SELECT * FROM "supportAgent" WHERE "supportAgentId" = $1', [supportAgentId]);
  return row ? mapToAgent(row) : null;
}

async function getAvailableAgent(_category?: string): Promise<SupportAgent | null> {
  const row = await queryOne<DbSupportAgent>(
    `SELECT * FROM "supportAgent" 
     WHERE "isActive" = true AND "isAvailable" = true 
     AND "currentTickets" < "maxTickets"
     ORDER BY "currentTickets" ASC, "satisfactionScore" DESC NULLS LAST
     LIMIT 1`,
  );
  return row ? mapToAgent(row) : null;
}


// ============================================================================
// Support Tickets
// ============================================================================

// ============================================================================
// Helpers
// ============================================================================

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "supportTicket" WHERE "ticketNumber" LIKE $1`, [
    `TKT${year}%`,
  ]);
  const count = parseInt(result?.count || '0') + 1;
  return `TKT${year}-${count.toString().padStart(6, '0')}`;
}

// Coercion helpers kept out of row mapping to keep complexity low.
function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
function intOr(value: unknown, fallbackValue: number): number {
  return parseInt(value as string) || fallbackValue;
}
function intOpt(value: unknown): number | undefined {
  return value ? parseInt(value as string) : undefined;
}
function numOpt(value: unknown): number | undefined {
  return value ? parseFloat(value as string) : undefined;
}
function dateOpt(value: unknown): Date | undefined {
  return value ? new Date(value as string) : undefined;
}

function mapToAgent(row: Record<string, unknown>): SupportAgent {
  return {
    supportAgentId: row.supportAgentId as string,
    email: row.email as string,
    firstName: row.firstName as string,
    lastName: row.lastName as string,
    displayName: opt(row.displayName as string | null),
    avatarUrl: opt(row.avatarUrl as string | null),
    role: row.role as AgentRole,
    department: opt(row.department as string | null),
    skills: opt(row.skills as string[] | null),
    languages: opt(row.languages as string[] | null),
    isActive: Boolean(row.isActive),
    isAvailable: Boolean(row.isAvailable),
    maxTickets: intOr(row.maxTickets, 20),
    currentTickets: intOr(row.currentTickets, 0),
    totalTicketsHandled: intOr(row.totalTicketsHandled, 0),
    averageResponseTimeMinutes: intOpt(row.averageResponseTimeMinutes),
    averageResolutionTimeMinutes: intOpt(row.averageResolutionTimeMinutes),
    satisfactionScore: numOpt(row.satisfactionScore),
    satisfactionCount: intOr(row.satisfactionCount, 0),
    timezone: (row.timezone as string) || 'UTC',
    workingHours: opt(row.workingHours as Record<string, unknown> | null),
    notificationPreferences: opt(row.notificationPreferences as Record<string, unknown> | null),
    metadata: opt(row.metadata as Record<string, unknown> | null),
    lastActiveAt: dateOpt(row.lastActiveAt),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}



export async function getAgentByEmail(email: string): Promise<SupportAgent | null> {
  const row = await queryOne<DbSupportAgent>('SELECT * FROM "supportAgent" WHERE "email" = $1', [email]);
  return row ? mapToAgent(row) : null;
}

export async function getAgents(filters?: { isActive?: boolean; isAvailable?: boolean; department?: string }): Promise<SupportAgent[]> {
  let whereClause = '1=1';
  const params: unknown[] = [];
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
    whereClause += ` AND "department" = $${paramIndex}`;
    params.push(filters.department);
  }

  const rows = await query<DbSupportAgent[]>(`SELECT * FROM "supportAgent" WHERE ${whereClause} ORDER BY "lastName", "firstName"`,
    params,
  );
  return (rows || []).map(mapToAgent);
}

export async function saveAgent(
  agent: Partial<SupportAgent> & { email: string; firstName: string; lastName: string },
): Promise<SupportAgent> {
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
        agent.firstName,
        agent.lastName,
        agent.displayName,
        agent.avatarUrl,
        agent.role || 'agent',
        agent.department,
        agent.skills,
        agent.languages,
        agent.isActive !== false,
        agent.isAvailable !== false,
        agent.maxTickets || 20,
        agent.timezone || 'UTC',
        agent.workingHours ? JSON.stringify(agent.workingHours) : null,
        agent.notificationPreferences ? JSON.stringify(agent.notificationPreferences) : null,
        agent.metadata ? JSON.stringify(agent.metadata) : null,
        now,
        agent.supportAgentId,
      ],
    );
    return (await getAgent(agent.supportAgentId))!;
  } else {
    const result = await queryOne<DbSupportAgent>(
      `INSERT INTO "supportAgent" (
        "email", "firstName", "lastName", "displayName", "avatarUrl", "role",
        "department", "skills", "languages", "isActive", "isAvailable", "maxTickets",
        "timezone", "workingHours", "notificationPreferences", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        agent.email,
        agent.firstName,
        agent.lastName,
        agent.displayName,
        agent.avatarUrl,
        agent.role || 'agent',
        agent.department,
        agent.skills,
        agent.languages,
        true,
        true,
        agent.maxTickets || 20,
        agent.timezone || 'UTC',
        agent.workingHours ? JSON.stringify(agent.workingHours) : null,
        agent.notificationPreferences ? JSON.stringify(agent.notificationPreferences) : null,
        agent.metadata ? JSON.stringify(agent.metadata) : null,
        now,
        now,
      ],
    );
    return mapToAgent(result!);
  }
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
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: SupportTicket[]; total: number }> {
  const { whereClause, params } = buildTicketFilters(filters);

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "supportTicket" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<DbSupportTicket[]>(`SELECT * FROM "supportTicket" WHERE ${whereClause}
     ORDER BY
       CASE "priority" WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
       "createdAt" DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToTicket),
    total: parseInt(countResult?.count || '0'),
  };
}

interface TicketFilters {
  customerId?: string;
  assignedAgentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  isEscalated?: boolean;
}

function buildTicketFilters(filters?: TicketFilters): { whereClause: string; params: unknown[] } {
  let whereClause = '1=1';
  const params: unknown[] = [];

  const clauses: Array<[keyof TicketFilters, string]> = [
    ['customerId', '"customerId"'],
    ['assignedAgentId', '"assignedAgentId"'],
    ['status', '"status"'],
    ['priority', '"priority"'],
    ['category', '"category"'],
    ['isEscalated', '"isEscalated"'],
  ];
  for (const [field, column] of clauses) {
    const value = filters?.[field];
    if (value !== undefined && value !== null && value !== '') {
      whereClause += ` AND ${column} = $${params.length + 1}`;
      params.push(value);
    }
  }

  return { whereClause, params };
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

  const result = await queryOne<DbSupportTicket>(
    `INSERT INTO "supportTicket" (
      "ticketNumber", "customerId", "orderId", "email", "name", "phone",
      "subject", "description", "status", "priority", "category", "channel",
      "assignedAgentId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      ticketNumber,
      ticket.customerId,
      ticket.orderId,
      ticket.email,
      ticket.name,
      ticket.phone,
      ticket.subject,
      ticket.description,
      ticket.priority || 'medium',
      ticket.category || 'other',
      ticket.channel || 'web',
      agent?.supportAgentId,
      now,
      now,
    ],
  );

  // Update agent ticket count
  if (agent) {
    await updateAgentTicketCount(agent.supportAgentId, 1);
  }

  return mapToTicket(result!);
}

export async function updateTicket(supportTicketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const ticket = await getTicket(supportTicketId);
  if (!ticket) throw new SupportTicketNotFoundError(supportTicketId);

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
    [updates.status, updates.priority, updates.category, updates.assignedAgentId, updates.tags, now, supportTicketId],
  );

  return (await getTicket(supportTicketId))!;
}

export {
  getTicket,
  resolveTicket,
  closeTicket,
  escalateTicket,
  submitFeedback,
  getMessages,
  addMessage,
  markMessagesRead,
  getAttachments,
} from './supportTicketOpsQueries';
