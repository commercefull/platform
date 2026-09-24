import { createCommentRepository } from '../../tests/testUtils';
import { AddTicketCommentUseCase } from './AddTicketComment';
import { SupportTicketNotFoundError, SupportValidationError } from '../../domain/errors/SupportErrors';

describe('AddTicketCommentUseCase', () => {
  let useCase: AddTicketCommentUseCase;
  let supportRepository: ReturnType<typeof createCommentRepository>;

  const validInput = { ticketId: 'tkt-1', authorId: 'cust-1', authorType: 'customer' as const, content: 'Any update?' };

  beforeEach(() => {
    supportRepository = createCommentRepository();
    supportRepository.findTicketById.mockResolvedValue({ ticketId: 'tkt-1', status: 'open' });
    supportRepository.createComment.mockImplementation(async data => ({
      commentId: data.commentId,
      ticketId: data.ticketId,
      authorType: data.authorType,
      isInternal: data.isInternal,
      createdAt: new Date(),
    }));
    useCase = new AddTicketCommentUseCase(supportRepository);
  });

  it('should persist the comment when the input is valid', async () => {
    const result = await useCase.execute(validInput);

    expect(result.ticketId).toBe('tkt-1');
    expect(result.authorType).toBe('customer');
    expect(result.isInternal).toBe(false);
    expect(supportRepository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 'tkt-1', authorId: 'cust-1', content: 'Any update?', isInternal: false }),
    );
  });

  it('should throw SupportValidationError when required fields are missing', async () => {
    await expect(useCase.execute({ ...validInput, ticketId: '' })).rejects.toThrow(SupportValidationError);
    await expect(useCase.execute({ ...validInput, content: '' })).rejects.toThrow(SupportValidationError);
    expect(supportRepository.createComment).not.toHaveBeenCalled();
  });

  it('should throw SupportTicketNotFoundError when the ticket does not exist', async () => {
    supportRepository.findTicketById.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(SupportTicketNotFoundError);
    expect(supportRepository.createComment).not.toHaveBeenCalled();
  });

  it('should throw SupportValidationError when a customer tries to add an internal comment', async () => {
    await expect(useCase.execute({ ...validInput, isInternal: true })).rejects.toThrow(SupportValidationError);
    expect(supportRepository.createComment).not.toHaveBeenCalled();
  });

  it('should allow internal comments when the author is an agent', async () => {
    const result = await useCase.execute({ ...validInput, authorType: 'agent', isInternal: true });

    expect(result.isInternal).toBe(true);
  });

  it('should reopen the ticket when a customer replies to a resolved ticket', async () => {
    supportRepository.findTicketById.mockResolvedValue({ ticketId: 'tkt-1', status: 'resolved' });

    await useCase.execute(validInput);

    expect(supportRepository.updateTicket).toHaveBeenCalledWith('tkt-1', { status: 'open' });
  });

  it('should not reopen the ticket when an agent replies to a resolved ticket', async () => {
    supportRepository.findTicketById.mockResolvedValue({ ticketId: 'tkt-1', status: 'resolved' });

    await useCase.execute({ ...validInput, authorType: 'agent' });

    expect(supportRepository.updateTicket).not.toHaveBeenCalledWith('tkt-1', { status: 'open' });
  });

  it('should update the last activity timestamp when a comment is added', async () => {
    await useCase.execute(validInput);

    expect(supportRepository.updateTicket).toHaveBeenCalledWith('tkt-1', { lastActivityAt: expect.any(Date) });
  });
});
