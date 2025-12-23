/**
 * ProcessPicking Use Case
 *
 * Handles the picking process for a fulfillment.
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { emitFulfillmentPickingStarted } from '../../domain/events/FulfillmentEvents';

export interface PickItemInput {
  fulfillmentItemId: string;
  quantityPicked: number;
  serialNumbers?: string[];
  lotNumbers?: string[];
}

export interface ProcessPickingInput {
  fulfillmentId: string;
  items: PickItemInput[];
  completePickingProcess?: boolean;
}

export interface ProcessPickingOutput {
  fulfillment: Fulfillment;
  items: FulfillmentItem[];
}

export class ProcessPickingUseCase {
  constructor(private fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: ProcessPickingInput): Promise<ProcessPickingOutput> {
    // Get fulfillment
    const fulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);
    if (!fulfillment) {
      throw new Error(`Fulfillment not found: ${input.fulfillmentId}`);
    }

    // Get items
    const items = await this.fulfillmentRepository.findItemsByFulfillmentId(input.fulfillmentId);
    if (items.length === 0) {
      throw new Error(`No items found for fulfillment: ${input.fulfillmentId}`);
    }

    // Start picking if not already started
    if (fulfillment.status === 'assigned' || fulfillment.status === 'pending') {
      fulfillment.startPicking();
      await this.fulfillmentRepository.save(fulfillment);

      emitFulfillmentPickingStarted({
        fulfillmentId: fulfillment.fulfillmentId,
        orderId: fulfillment.orderId,
      });
    }

    // Process each picked item
    const updatedItems: FulfillmentItem[] = [];
    for (const pickInput of input.items) {
      const item = items.find(i => i.fulfillmentItemId === pickInput.fulfillmentItemId);
      if (!item) {
        throw new Error(`Fulfillment item not found: ${pickInput.fulfillmentItemId}`);
      }

      item.pick(pickInput.quantityPicked, pickInput.serialNumbers, pickInput.lotNumbers);
      const savedItem = await this.fulfillmentRepository.saveItem(item);
      updatedItems.push(savedItem);
    }

    // Check if all items are picked and complete picking process
    const allItemsPicked = items.every(item => item.isPicked);
    if (allItemsPicked || input.completePickingProcess) {
      fulfillment.completePicking();
      await this.fulfillmentRepository.save(fulfillment);
    }

    // Get latest fulfillment state
    const updatedFulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);

    return {
      fulfillment: updatedFulfillment!,
      items: updatedItems,
    };
  }
}
