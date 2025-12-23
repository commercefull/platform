/**
 * GetFulfillment Use Case
 *
 * Retrieves a fulfillment with its items.
 */

import { Fulfillment } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';

export interface GetFulfillmentInput {
  fulfillmentId?: string;
  trackingNumber?: string;
}

export interface GetFulfillmentOutput {
  fulfillment: Fulfillment | null;
  items: FulfillmentItem[];
}

export class GetFulfillmentUseCase {
  constructor(private fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: GetFulfillmentInput): Promise<GetFulfillmentOutput> {
    if (!input.fulfillmentId && !input.trackingNumber) {
      throw new Error('Either fulfillmentId or trackingNumber must be provided');
    }

    let fulfillment: Fulfillment | null = null;

    if (input.fulfillmentId) {
      fulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);
    } else if (input.trackingNumber) {
      fulfillment = await this.fulfillmentRepository.findByTrackingNumber(input.trackingNumber);
    }

    if (!fulfillment) {
      return { fulfillment: null, items: [] };
    }

    const items = await this.fulfillmentRepository.findItemsByFulfillmentId(fulfillment.fulfillmentId);

    return { fulfillment, items };
  }
}
