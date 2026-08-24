jest.mock('../../infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    queries: {
      findNotesByOrder: jest.fn().mockResolvedValue([{ noteId: 'n1', orderId: 'o1', content: 'Test note' }]),
      softDeleteNote: jest.fn().mockResolvedValue(undefined),
    },
    commands: {},
  },
}));

import { ManageOrderNotesUseCase } from './ManageOrderNotes';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const mockRepo = orderDataRepository as unknown as { queries: Record<string, jest.Mock> };

describe('ManageOrderNotesUseCase', () => {
  let useCase: ManageOrderNotesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageOrderNotesUseCase();
  });

  it('should find notes by order', async () => {
    const result = await useCase.findByOrder('o1');
    expect(result).toHaveLength(1);
    expect(mockRepo.queries.findNotesByOrder).toHaveBeenCalledWith('o1');
  });

  it('should soft delete note', async () => {
    await useCase.softDelete('n1');
    expect(mockRepo.queries.softDeleteNote).toHaveBeenCalledWith('n1');
  });
});
