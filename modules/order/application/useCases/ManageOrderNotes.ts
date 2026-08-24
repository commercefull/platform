import { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderQueryRepo = orderDataRepository.queries;

export class ManageOrderNotesUseCase {
  constructor(
    private readonly queryRepo: OrderQueryRepository = orderQueryRepo,
  ) {}

  async findByOrder(orderId: string) {
    return this.queryRepo.findNotesByOrder(orderId);
  }
  async softDelete(noteId: string) {
    return this.queryRepo.softDeleteNote(noteId);
  }
}
