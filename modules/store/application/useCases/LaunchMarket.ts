/**
 * LaunchMarket Use Case
 * Gates market activation on the readiness evaluation: a market can only go
 * active when every blocking readiness dimension is satisfied. On success
 * the market is activated and its version bumped (orders snapshot
 * `marketVersion` at checkout time).
 */

import { MarketRepository } from '../../domain/repositories/MarketRepository';
import { MarketReadinessEvaluator } from '../../domain/services/MarketReadinessEvaluator';
import { MarketReadinessFactsPort } from '../ports/MarketReadinessFactsPort';
import { MarketNotFoundError, MarketNotReadyForLaunchError, MarketValidationError } from '../../domain/errors/StoreErrors';
import type { MarketResponse } from './ManageMarkets';
import type { MarketReadinessReport } from '../../domain/services/MarketReadinessEvaluator';
import { ManageMarketsUseCase, GetMarketCommand } from './ManageMarkets';

export class LaunchMarketCommand {
  constructor(public readonly marketId: string) {}
}

export interface LaunchMarketResponse {
  market: MarketResponse;
  readiness: MarketReadinessReport;
}

export class LaunchMarketUseCase {
  constructor(
    private readonly marketRepository: MarketRepository,
    private readonly factsPort: MarketReadinessFactsPort,
    private readonly evaluator: MarketReadinessEvaluator = new MarketReadinessEvaluator(),
  ) {}

  async execute(command: LaunchMarketCommand): Promise<LaunchMarketResponse> {
    const market = await this.marketRepository.findById(command.marketId);
    if (!market) throw new MarketNotFoundError(command.marketId);
    if (market.status === 'disabled') {
      throw new MarketValidationError('Disabled markets cannot be launched — update the market configuration first.');
    }
    if (market.isActive) {
      const readiness = await this.evaluateReadiness(market.marketId);
      return { market: await this.marketResponse(market.marketId), readiness };
    }

    const facts = await this.factsPort.gatherFacts(market);
    const readiness = this.evaluator.evaluate(market, facts);
    if (!readiness.launchable) {
      throw new MarketNotReadyForLaunchError(market.marketId, readiness.missing);
    }

    market.activate();
    await this.marketRepository.update(market);

    return { market: await this.marketResponse(market.marketId), readiness };
  }

  private async evaluateReadiness(marketId: string): Promise<MarketReadinessReport> {
    const market = await this.marketRepository.findById(marketId);
    if (!market) throw new MarketNotFoundError(marketId);
    const facts = await this.factsPort.gatherFacts(market);
    return this.evaluator.evaluate(market, facts);
  }

  private async marketResponse(marketId: string): Promise<MarketResponse> {
    return new ManageMarketsUseCase(this.marketRepository).get(new GetMarketCommand(marketId));
  }
}
