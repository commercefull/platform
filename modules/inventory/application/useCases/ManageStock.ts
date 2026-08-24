/**
 * Manage Stock Use Cases
 */

import { generateUUID } from '../../../../libs/uuid';
import { withTransaction } from '../../../../libs/db';
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryItemNotFoundError, InsufficientStockError } from '../../domain/errors/InventoryErrors';

// ============================================================================
// Commands
// ============================================================================

export class RestockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly quantity: number,
    public readonly reference?: string,
    public readonly notes?: string,
    public readonly createdBy: string = 'system',
  ) {}
}

export class AdjustStockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly newQuantity: number,
    public readonly reason: string,
    public readonly createdBy: string = 'system',
  ) {}
}

export class ReserveStockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly quantity: number,
    public readonly orderId?: string,
    public readonly basketId?: string,
    public readonly expiresInMinutes: number = 15,
  ) {}
}

// ============================================================================
// Responses
// ============================================================================

export interface StockOperationResponse {
  inventoryId: string;
  sku: string;
  previousQuantity: number;
  newQuantity: number;
  availableQuantity: number;
  operation: string;
}

export interface ReserveStockResponse {
  reservationId: string;
  inventoryId: string;
  quantity: number;
  expiresAt: string;
}

// ============================================================================
// Use Cases
// ============================================================================

export class RestockUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(command: RestockCommand): Promise<StockOperationResponse> {
    const item = await this.inventoryRepository.findById(command.inventoryId);
    if (!item) throw new InventoryItemNotFoundError(command.inventoryId);

    const previousQuantity = item.quantity;
    item.restock(command.quantity);

    await withTransaction(async () => {
      await this.inventoryRepository.save(item);
      await this.inventoryRepository.recordTransaction({
        inventoryId: command.inventoryId,
        type: 'restock',
        quantity: command.quantity,
        reference: command.reference,
        notes: command.notes,
        createdBy: command.createdBy,
      });
    });

    return {
      inventoryId: item.inventoryId,
      sku: item.sku,
      previousQuantity,
      newQuantity: item.quantity,
      availableQuantity: item.availableQuantity,
      operation: 'restock',
    };
  }
}

export class AdjustStockUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(command: AdjustStockCommand): Promise<StockOperationResponse> {
    const item = await this.inventoryRepository.findById(command.inventoryId);
    if (!item) throw new InventoryItemNotFoundError(command.inventoryId);

    const previousQuantity = item.quantity;
    const difference = command.newQuantity - previousQuantity;
    item.adjust(command.newQuantity);

    await withTransaction(async () => {
      await this.inventoryRepository.save(item);
      await this.inventoryRepository.recordTransaction({
        inventoryId: command.inventoryId,
        type: 'adjustment',
        quantity: difference,
        notes: command.reason,
        createdBy: command.createdBy,
      });
    });

    return {
      inventoryId: item.inventoryId,
      sku: item.sku,
      previousQuantity,
      newQuantity: item.quantity,
      availableQuantity: item.availableQuantity,
      operation: 'adjustment',
    };
  }
}

export class ReserveStockUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(command: ReserveStockCommand): Promise<ReserveStockResponse> {
    const item = await this.inventoryRepository.findById(command.inventoryId);
    if (!item) throw new InventoryItemNotFoundError(command.inventoryId);

    if (command.quantity > item.availableQuantity) {
      throw new InsufficientStockError(item.sku || item.productId, command.quantity, item.availableQuantity);
    }

    const reservationId = generateUUID();
    const expiresAt = new Date(Date.now() + command.expiresInMinutes * 60 * 1000);

    item.reserve(command.quantity);

    await withTransaction(async () => {
      await this.inventoryRepository.save(item);

      await this.inventoryRepository.createReservation({
        reservationId,
        inventoryId: command.inventoryId,
        quantity: command.quantity,
        orderId: command.orderId,
        basketId: command.basketId,
        expiresAt,
      });
    });

    eventBus.emit('inventory.reserved', {
      reservationId,
      inventoryId: command.inventoryId,
      quantity: command.quantity,
    });

    return {
      reservationId,
      inventoryId: item.inventoryId,
      quantity: command.quantity,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
