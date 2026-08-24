/**
 * InitiateReturn Use Case
 *
 * Marks a fulfillment as returned.
 */

import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';

export interface InitiateReturnInput {
  fulfillmentId: string;
  reason?: string;
}

export interface InitiateReturnOutput {
  fulfillmentId: string;
  status: string;
  returnedAt: string;
}

export class InitiateReturnUseCase {
  constructor(private readonly fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: InitiateReturnInput): Promise<InitiateReturnOutput> {
    const fulfillment = await this.fulfillmentRepository.findById(input.fulfillmentId);
    if (!fulfillment) {
      throw new FulfillmentNotFoundError(input.fulfillmentId);
    }

    // If already returned, treat as idempotent
    if (fulfillment.status !== 'returned') {
      fulfillment.markReturned();
    }
    const saved = await this.fulfillmentRepository.save(fulfillment);

    return {
      fulfillmentId: saved.fulfillmentId,
      status: saved.status,
      returnedAt: saved.updatedAt.toISOString(),
    };
  }
}
