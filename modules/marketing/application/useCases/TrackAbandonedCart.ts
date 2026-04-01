/**
 * TrackAbandonedCart Use Case
 *
 * Creates or updates a marketingAbandonedCart record for a basket.
 *
 * Validates: Requirements 6.5
 */

import * as abandonedCartRepo from '../../infrastructure/repositories/abandonedCartRepo';

// ============================================================================
// Command
// ============================================================================

export class TrackAbandonedCartCommand {
  constructor(
    public readonly basketId: string,
    public readonly cartValue: number,
    public readonly currency: string,
    public readonly customerId?: string,
    public readonly email?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface TrackAbandonedCartResponse {
  marketingAbandonedCartId: string;
  basketId: string;
  status: string;
  cartValue: number;
  currency: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class TrackAbandonedCartUseCase {
  constructor(private readonly cartRepo: typeof abandonedCartRepo = abandonedCartRepo) {}

  async execute(command: TrackAbandonedCartCommand): Promise<TrackAbandonedCartResponse> {
    if (!command.basketId) throw new Error('basketId is required');
    if (!command.customerId && !command.email) {
      throw new Error('Either customerId or email is required to track an abandoned cart');
    }

    const record = await this.cartRepo.create({
      basketId: command.basketId,
      customerId: command.customerId,
      email: command.email,
      cartValue: command.cartValue,
      currency: command.currency,
      status: 'abandoned',
    });

    if (!record) throw new Error('Failed to create abandoned cart record');

    return {
      marketingAbandonedCartId: record.marketingAbandonedCartId,
      basketId: record.basketId,
      status: record.status,
      cartValue: record.cartValue,
      currency: record.currency,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
