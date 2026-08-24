import { AddTicketCommentUseCase } from './AddTicketComment';
import { SupportTicketNotFoundError, SupportValidationError } from '../../domain/errors/SupportErrors';

describe('AddTicketCommentUseCase', () => {
  let useCase: AddTicketCommentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTicketById: jest.fn().mockResolvedValue({ ticketId: 'tkt-1', status: 'open' }),
      createComment: jest.fn().mockResolvedValue({ commentId: 'cmt-1', ticketId: 'tkt-1', authorType: 'customer', isInternal: false, createdAt: new Date() }),
      updateTicket: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AddTicketCommentUseCase(mockRepo as never);
  });

  it('should add a comment successfully (happy path)', async () => {
    const result = await useCase.execute({ ticketId: 'tkt-1', authorId: 'cust-1', authorType: 'customer', content: 'Thanks' });

    expect(result.commentId).toBe('cmt-1');
    expect(result.isInternal).toBe(false);
  });

  it('should throw SupportValidationError when required fields missing', async () => {
    await expect(useCase.execute({ ticketId: '', authorId: 'a', authorType: 'customer', content: 'c' })).rejects.toThrow(SupportValidationError);
    await expect(useCase.execute({ ticketId: 't', authorId: '', authorType: 'customer', content: 'c' })).rejects.toThrow(SupportValidationError);
    await expect(useCase.execute({ ticketId: 't', authorId: 'a', authorType: 'customer', content: '' })).rejects.toThrow(SupportValidationError);
  });

  it('should throw SupportTicketNotFoundError when ticket does not exist', async () => {
    mockRepo.findTicketById.mockResolvedValue(null);

    await expect(useCase.execute({ ticketId: 'missing', authorId: 'a', authorType: 'customer', content: 'c' })).rejects.toThrow(SupportTicketNotFoundError);
  });

  it('should throw SupportValidationError when customer tries to add internal comment', async () => {
    await expect(useCase.execute({ ticketId: 'tkt-1', authorId: 'cust-1', authorType: 'customer', content: 'c', isInternal: true })).rejects.toThrow(SupportValidationError);
  });

  it('should reopen ticket when customer replies to resolved ticket', async () => {
    mockRepo.findTicketById.mockResolvedValue({ ticketId: 'tkt-1', status: 'resolved' });

    await useCase.execute({ ticketId: 'tkt-1', authorId: 'cust-1', authorType: 'customer', content: 'Still broken' });

    expect(mockRepo.updateTicket).toHaveBeenCalledWith('tkt-1', expect.objectContaining({ status: 'open' }));
  });
});
