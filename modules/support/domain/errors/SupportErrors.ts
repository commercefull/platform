import { AppError } from '../../../../libs/errors';

export class SupportTicketNotFoundError extends AppError {
  constructor(ticketId: string) {
    super(`Support ticket not found: ${ticketId}`, 404, { code: 'support.ticket_not_found' });
  }
}

export class SupportMessageNotFoundError extends AppError {
  constructor(messageId: string) {
    super(`Support message not found: ${messageId}`, 404, { code: 'support.message_not_found' });
  }
}

export class SupportAgentNotFoundError extends AppError {
  constructor(agentId: string) {
    super(`Support agent not found: ${agentId}`, 404, { code: 'support.agent_not_found' });
  }
}

export class TicketAlreadyClosedError extends AppError {
  constructor(ticketId: string) {
    super(`Ticket ${ticketId} is already closed`, 400, { code: 'support.already_closed' });
  }
}

export class TicketCannotBeClosedError extends AppError {
  constructor(status: string) {
    super(`Ticket cannot be closed in status: ${status}`, 400, { code: 'support.cannot_be_closed' });
  }
}

export class InvalidTicketStatusError extends AppError {
  constructor(status: string) {
    super(`Invalid ticket status: ${status}`, 400, { code: 'support.invalid_status' });
  }
}

export class InvalidTicketPriorityError extends AppError {
  constructor(priority: string) {
    super(`Invalid ticket priority: ${priority}`, 400, { code: 'support.invalid_priority' });
  }
}

export class MessageContentRequiredError extends AppError {
  constructor() {
    super('Message content is required', 400, { code: 'support.message_content_required' });
  }
}

export class FailedToCreateTicketError extends AppError {
  constructor() {
    super('Failed to create support ticket', 500, { code: 'support.ticket_creation_failed' });
  }
}

export class SupportValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'support.validation_error' });
  }
}
