/**
 * InitiateReturn Use Case
 *
 * Marks a fulfillment as returned.
 */

import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';

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
      throw new Error(`Fulfillment not found: ${input.fulfillmentId}`);
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
