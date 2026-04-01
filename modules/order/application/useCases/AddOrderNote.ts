/**
 * AddOrderNote Use Case
 * Creates an internal order note
 *
 * Validates: Requirements 2.11
 */

import orderRepo from '../../infrastructure/repositories/orderRepo';
import orderNoteRepo, { OrderNote } from '../../infrastructure/repositories/orderNoteRepo';

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
    private readonly orders: typeof orderRepo = orderRepo,
    private readonly noteRepo: typeof orderNoteRepo = orderNoteRepo,
  ) {}

  async execute(command: AddOrderNoteCommand): Promise<AddOrderNoteResponse> {
    const order = await this.orders.findById(command.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!command.content || command.content.trim().length === 0) {
      throw new Error('Note content cannot be empty');
    }

    const note: OrderNote = await this.noteRepo.create({
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
