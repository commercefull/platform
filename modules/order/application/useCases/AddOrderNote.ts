/**
 * AddOrderNote Use Case
 * Creates an internal order note
 *
 * Validates: Requirements 2.11
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderQueryRepository, OrderNote } from '../../domain/repositories/OrderQueryRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderRepo = orderDataRepository.commands;
const orderQueryRepo = orderDataRepository.queries;
import { OrderNotFoundError, NoteContentEmptyError } from '../../domain/errors/OrderErrors';

// ============================================================================
// Command
// ============================================================================

export class AddOrderNoteCommand {
  constructor(
    public readonly orderId: string,
    public readonly content: string,
    public readonly isCustomerVisible: boolean = false,
    public readonly createdBy?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface AddOrderNoteResponse {
  orderNoteId: string;
  orderId: string;
  content: string;
  isCustomerVisible: boolean;
  createdBy?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class AddOrderNoteUseCase {
  constructor(
    private readonly orders: OrderRepository = orderRepo,
    private readonly queryRepo: OrderQueryRepository = orderQueryRepo,
  ) {}

  async execute(command: AddOrderNoteCommand): Promise<AddOrderNoteResponse> {
    const order = await this.orders.findById(command.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (!command.content || command.content.trim().length === 0) {
      throw new NoteContentEmptyError();
    }

    const note: OrderNote = await this.queryRepo.createNote({
      orderId: command.orderId,
      content: command.content.trim(),
      isCustomerVisible: command.isCustomerVisible,
      createdBy: command.createdBy,
    });

    return {
      orderNoteId: note.orderNoteId,
      orderId: note.orderId,
      content: note.content,
      isCustomerVisible: note.isCustomerVisible,
      createdBy: note.createdBy,
      createdAt: note.createdAt,
    };
  }
}
