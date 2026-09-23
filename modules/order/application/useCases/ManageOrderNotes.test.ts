import { lazyMock, createOrderNote } from '../../tests/testUtils';
import { ManageOrderNotesUseCase } from './ManageOrderNotes';
import type { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';

describe('ManageOrderNotesUseCase', () => {
  let useCase: ManageOrderNotesUseCase;
  let queryRepo: jest.Mocked<OrderQueryRepository>;

  beforeEach(() => {
    queryRepo = lazyMock<OrderQueryRepository>();
    useCase = new ManageOrderNotesUseCase(queryRepo);
  });

  it('should find notes by order', async () => {
    queryRepo.findNotesByOrder.mockResolvedValue([createOrderNote({ content: 'Test note' })]);

    const result = await useCase.findByOrder('o1');

    expect(result).toHaveLength(1);
    expect(queryRepo.findNotesByOrder).toHaveBeenCalledWith('o1');
  });

  it('should soft delete a note', async () => {
    await useCase.softDelete('n1');

    expect(queryRepo.softDeleteNote).toHaveBeenCalledWith('n1');
  });
});
