import {
  SupportTicketNotFoundError, SupportMessageNotFoundError, SupportAgentNotFoundError,
  TicketAlreadyClosedError, TicketCannotBeClosedError, InvalidTicketStatusError,
  InvalidTicketPriorityError, MessageContentRequiredError, FailedToCreateTicketError,
  SupportValidationError,
} from './SupportErrors';

describe('SupportErrors', () => {
  it('SupportTicketNotFoundError', () => { expect(new SupportTicketNotFoundError('t1').statusCode).toBe(404); });
  it('SupportMessageNotFoundError', () => { expect(new SupportMessageNotFoundError('m1').statusCode).toBe(404); });
  it('SupportAgentNotFoundError', () => { expect(new SupportAgentNotFoundError('a1').statusCode).toBe(404); });
  it('TicketAlreadyClosedError', () => { expect(new TicketAlreadyClosedError('t1').statusCode).toBe(400); });
  it('TicketCannotBeClosedError', () => { expect(new TicketCannotBeClosedError('bad').statusCode).toBe(400); });
  it('InvalidTicketStatusError', () => { expect(new InvalidTicketStatusError('bad').statusCode).toBe(400); });
  it('InvalidTicketPriorityError', () => { expect(new InvalidTicketPriorityError('bad').statusCode).toBe(400); });
  it('MessageContentRequiredError', () => { expect(new MessageContentRequiredError().statusCode).toBe(400); });
  it('FailedToCreateTicketError', () => { expect(new FailedToCreateTicketError().statusCode).toBe(500); });
  it('SupportValidationError', () => { expect(new SupportValidationError('bad').statusCode).toBe(400); });
});
