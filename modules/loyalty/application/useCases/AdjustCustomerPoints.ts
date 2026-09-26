/**
 * AdjustCustomerPoints Use Case
 *
 * Admin manual points adjustment. When a tierId is supplied and the
 * customer has no points record yet, the record is initialized against
 * that tier before the adjustment is applied.
 */

import { LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';

export interface CustomerPointsRecord {
  customerId: string;
  loyaltyPointsId?: string;
}

export interface AdjustCustomerPointsPort {
  findCustomerPoints(customerId: string): Promise<CustomerPointsRecord | null>;
  initializeCustomerPoints(customerId: string, tierId: string): Promise<unknown>;
  /** Points delta signed; action is fixed to manual adjustment by the adapter. */
  adjustCustomerPoints(customerId: string, points: number, reason: string): Promise<CustomerPointsRecord>;
}

export interface AdjustCustomerPointsInput {
  customerId: string;
  points?: string | number;
  reason?: string;
  tierId?: string;
}

export class AdjustCustomerPointsUseCase {
  constructor(private readonly loyalty: AdjustCustomerPointsPort) {}

  async execute(input: AdjustCustomerPointsInput): Promise<CustomerPointsRecord> {
    if (input.points === undefined) {
      throw new LoyaltyValidationError('Points adjustment amountCents is required');
    }

    // If tierId provided and customer has no points, initialize first
    if (input.tierId) {
      const existing = await this.loyalty.findCustomerPoints(input.customerId);
      if (!existing) {
        await this.loyalty.initializeCustomerPoints(input.customerId, input.tierId);
      }
    }

    const pointsDelta = typeof input.points === 'string' ? parseInt(input.points) : input.points;

    return this.loyalty.adjustCustomerPoints(
      input.customerId,
      pointsDelta,
      input.reason || 'Manual adjustment by admin',
    );
  }
}
