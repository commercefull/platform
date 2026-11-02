import { EvaluateMarketReadinessUseCase, EvaluateMarketReadinessCommand } from './EvaluateMarketReadiness';
import { LaunchMarketUseCase, LaunchMarketCommand } from './LaunchMarket';
import { MarketNotFoundError, MarketNotReadyForLaunchError, MarketValidationError } from '../../domain/errors/StoreErrors';
import { createMarketRepository, createMarketReadinessFactsPort, createMarket } from '../../tests/testUtils';

describe('EvaluateMarketReadinessUseCase', () => {
  it('should produce the readiness report when the market exists', async () => {
    const marketRepository = createMarketRepository();
    const factsPort = createMarketReadinessFactsPort();
    marketRepository.findById.mockResolvedValue(createMarket());

    const report = await new EvaluateMarketReadinessUseCase(marketRepository, factsPort).execute(
      new EvaluateMarketReadinessCommand('market-1'),
    );

    expect(report.marketId).toBe('market-1');
    expect(report.dimensions).toHaveLength(12);
    expect(report.launchable).toBe(true);
    expect(factsPort.gatherFacts).toHaveBeenCalledTimes(1);
  });

  it('should report missing blocking dimensions when facts are absent', async () => {
    const marketRepository = createMarketRepository();
    const factsPort = createMarketReadinessFactsPort({
      hasTaxCoverage: false,
      taxJurisdictionsCovered: [],
      hasPaymentMethod: false,
      hasShippingCoverage: false,
    });
    marketRepository.findById.mockResolvedValue(createMarket());

    const report = await new EvaluateMarketReadinessUseCase(marketRepository, factsPort).execute(
      new EvaluateMarketReadinessCommand('market-1'),
    );

    expect(report.launchable).toBe(false);
    expect(report.missing).toEqual(expect.arrayContaining(['tax', 'payments', 'shipping']));
  });

  it('should throw when the market does not exist', async () => {
    const marketRepository = createMarketRepository();
    marketRepository.findById.mockResolvedValue(null);

    await expect(
      new EvaluateMarketReadinessUseCase(marketRepository, createMarketReadinessFactsPort()).execute(
        new EvaluateMarketReadinessCommand('missing'),
      ),
    ).rejects.toThrow(MarketNotFoundError);
  });
});

describe('LaunchMarketUseCase', () => {
  let marketRepository: ReturnType<typeof createMarketRepository>;

  beforeEach(() => {
    marketRepository = createMarketRepository();
  });

  it('should activate the market when all blocking dimensions are ready', async () => {
    const market = createMarket();
    marketRepository.findById.mockResolvedValue(market);

    const result = await new LaunchMarketUseCase(marketRepository, createMarketReadinessFactsPort()).execute(
      new LaunchMarketCommand('market-1'),
    );

    expect(result.market.status).toBe('active');
    expect(result.market.version).toBe(2);
    expect(result.readiness.launchable).toBe(true);
    expect(marketRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should reject launch when blocking dimensions are missing', async () => {
    marketRepository.findById.mockResolvedValue(createMarket());
    const factsPort = createMarketReadinessFactsPort({ hasPaymentMethod: false, enabledPaymentMethods: [] });

    await expect(new LaunchMarketUseCase(marketRepository, factsPort).execute(new LaunchMarketCommand('market-1'))).rejects.toThrow(
      MarketNotReadyForLaunchError,
    );
    expect(marketRepository.update).not.toHaveBeenCalled();
  });

  it('should reject launch of a disabled market', async () => {
    const market = createMarket();
    market.disable();
    marketRepository.findById.mockResolvedValue(market);

    await expect(
      new LaunchMarketUseCase(marketRepository, createMarketReadinessFactsPort()).execute(new LaunchMarketCommand('market-1')),
    ).rejects.toThrow(MarketValidationError);
  });

  it('should return the report without reactivating an already active market', async () => {
    const market = createMarket();
    market.activate();
    marketRepository.findById.mockResolvedValue(market);

    const result = await new LaunchMarketUseCase(marketRepository, createMarketReadinessFactsPort()).execute(
      new LaunchMarketCommand('market-1'),
    );

    expect(result.market.status).toBe('active');
    expect(marketRepository.update).not.toHaveBeenCalled();
  });
});
