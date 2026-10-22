/**
 * EvaluateMarketReadiness Use Case
 * Produces the 12-dimension launch readiness report for a market by
 * gathering cross-module facts via the facts port and running the pure
 * domain evaluator. Read-only — never mutates the market.
 */

import { MarketRepository } from '../../domain/repositories/MarketRepository';
import { MarketReadinessEvaluator, MarketReadinessReport } from '../../domain/services/MarketReadinessEvaluator';
import { MarketReadinessFactsPort } from '../ports/MarketReadinessFactsPort';
import { MarketNotFoundError } from '../../domain/errors/StoreErrors';

export class EvaluateMarketReadinessCommand {
  constructor(public readonly marketId: string) {}
}

export class EvaluateMarketReadinessUseCase {
  constructor(
    private readonly marketRepository: MarketRepository,
    private readonly factsPort: MarketReadinessFactsPort,
    private readonly evaluator: MarketReadinessEvaluator = new MarketReadinessEvaluator(),
  ) {}

  async execute(command: EvaluateMarketReadinessCommand): Promise<MarketReadinessReport> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);

    const facts = await this.factsPort.gatherFacts(market);
    return this.evaluator.evaluate(market, facts);
  }
}
