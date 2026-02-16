/**
 * Process Packing Use Case
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class ProcessPackingCommand {
  constructor(
    public readonly fulfillmentId: string,
    public readonly completePackingProcess: boolean = false,
    public readonly weight?: number,
    public readonly dimensions?: { length: number; width: number; height: number },
  ) {}
}

export class ProcessPackingUseCase {
  constructor(private readonly repository: IFulfillmentRepository) {}

  async execute(command: ProcessPackingCommand): Promise<{ fulfillment: Fulfillment }> {
    const fulfillment = await this.repository.findById(command.fulfillmentId);
    if (!fulfillment) {
      throw new Error(`Fulfillment ${command.fulfillmentId} not found`);
    }

    fulfillment.startPacking();

    if (command.completePackingProcess) {
      fulfillment.completePacking(command.weight, command.dimensions);
    }

    const saved = await this.repository.save(fulfillment);

    const eventType = command.completePackingProcess ? 'fulfillment.packing_completed' : 'fulfillment.packing_started';
    eventBus.emit(eventType, {
      fulfillmentId: saved.fulfillmentId,
      orderId: saved.orderId,
    });

    return { fulfillment: saved };
  }
}
