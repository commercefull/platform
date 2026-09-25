/**
 * Merge Guest Basket On Login Use Case
 * Runs when a guest authenticates: adopts the anonymous session basket when the
 * customer has none, or merges it into the existing customer basket.
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { BasketResponse } from './GetOrCreateBasket';
import { MergeBasketsCommand, MergeBasketsUseCase } from './MergeBaskets';
import { AssignBasketToCustomerCommand, AssignBasketToCustomerUseCase } from './AssignBasketToCustomer';

// ============================================================================
// Command
// ============================================================================

export class MergeGuestBasketOnLoginCommand {
  constructor(
    public readonly customerId: string,
    public readonly sessionId?: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class MergeGuestBasketOnLoginUseCase {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly mergeBasketsUseCase: MergeBasketsUseCase,
    private readonly assignBasketToCustomerUseCase: AssignBasketToCustomerUseCase,
  ) {}

  async execute(command: MergeGuestBasketOnLoginCommand): Promise<BasketResponse | null> {
    if (!command.sessionId || !command.customerId) return null;

    const sessionBasket = await this.basketRepository.findBySessionId(command.sessionId);
    if (!sessionBasket) return null;

    // Already owned by this customer — nothing to do
    if (sessionBasket.customerId === command.customerId) return null;

    // Never merge a basket owned by a different customer (session hijack guard)
    if (sessionBasket.customerId && sessionBasket.customerId !== command.customerId) return null;

    const customerBasket = await this.basketRepository.findByCustomerId(command.customerId);

    // No existing customer basket — adopt the session basket
    if (!customerBasket || customerBasket.basketId === sessionBasket.basketId) {
      return this.assignBasketToCustomerUseCase.execute(
        new AssignBasketToCustomerCommand(sessionBasket.basketId, command.customerId),
      );
    }

    // Both exist — merge guest items into the customer basket
    return this.mergeBasketsUseCase.execute(
      new MergeBasketsCommand(sessionBasket.basketId, customerBasket.basketId),
    );
  }
}
