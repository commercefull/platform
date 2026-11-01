import { ManageMarketsUseCase, CreateMarketCommand, UpdateMarketCommand, GetMarketCommand, ListMarketsCommand, DeleteMarketCommand, SetMarketStatusCommand } from './ManageMarkets';
import { MarketCodeAlreadyExistsError, MarketNotFoundError, MarketValidationError } from '../../domain/errors/StoreErrors';
import { createMarketRepository, createMarket } from '../../tests/testUtils';

describe('ManageMarketsUseCase', () => {
  let marketRepository: ReturnType<typeof createMarketRepository>;
  let useCase: ManageMarketsUseCase;

  beforeEach(() => {
    marketRepository = createMarketRepository();
    useCase = new ManageMarketsUseCase(marketRepository);
  });

  describe('create', () => {
    it('should create and persist a market when the code is unique', async () => {
      marketRepository.findByCode.mockResolvedValue(null);

      const result = await useCase.create(
        new CreateMarketCommand('org-1', {
          code: 'eu',
          name: 'European Union',
          countryCodes: ['de', 'fr'],
          defaultCurrencyCode: 'eur',
          defaultLocaleCode: 'en-GB',
        }),
      );

      expect(result.code).toBe('EU');
      expect(result.defaultCurrencyCode).toBe('EUR');
      expect(result.countryCodes).toEqual(['DE', 'FR']);
      expect(result.status).toBe('draft');
      expect(result.version).toBe(1);
      expect(marketRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should reject duplicate codes within the organization', async () => {
      marketRepository.findByCode.mockResolvedValue(createMarket());

      await expect(
        useCase.create(new CreateMarketCommand('org-1', { code: 'EU', name: 'Dupe' })),
      ).rejects.toThrow(MarketCodeAlreadyExistsError);
    });

    it('should reject a blank market code', async () => {
      await expect(useCase.create(new CreateMarketCommand('org-1', { code: '  ', name: 'No code' }))).rejects.toThrow(
        MarketValidationError,
      );
    });
  });

  describe('update', () => {
    it('should apply configuration updates and bump the version', async () => {
      const market = createMarket();
      marketRepository.findById.mockResolvedValue(market);

      const result = await useCase.update(
        new UpdateMarketCommand('market-1', { name: 'EU Updated', supportedLocaleCodes: ['en-GB', 'de-DE', 'fr-FR'] }),
      );

      expect(result.name).toBe('EU Updated');
      expect(result.supportedLocaleCodes).toEqual(['en-GB', 'de-DE', 'fr-FR']);
      expect(result.version).toBe(2);
      expect(marketRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should reject updates to a missing market', async () => {
      marketRepository.findById.mockResolvedValue(null);
      await expect(useCase.update(new UpdateMarketCommand('missing', { name: 'x' }))).rejects.toThrow(MarketNotFoundError);
    });

    it('should reject renaming to a code owned by another market', async () => {
      marketRepository.findById.mockResolvedValue(createMarket());
      marketRepository.findByCode.mockResolvedValue(createMarket({ marketId: 'other-market' }));

      await expect(useCase.update(new UpdateMarketCommand('market-1', { code: 'US' }))).rejects.toThrow(
        MarketCodeAlreadyExistsError,
      );
    });
  });

  describe('get / list / delete / disable', () => {
    it('should return the market response when it exists', async () => {
      marketRepository.findById.mockResolvedValue(createMarket());
      const result = await useCase.get(new GetMarketCommand('market-1'));
      expect(result.marketId).toBe('market-1');
      expect(result.code).toBe('EU');
    });

    it('should throw when getting a missing market', async () => {
      marketRepository.findById.mockResolvedValue(null);
      await expect(useCase.get(new GetMarketCommand('missing'))).rejects.toThrow(MarketNotFoundError);
    });

    it('should list markets matching the filter', async () => {
      marketRepository.list.mockResolvedValue([createMarket(), createMarket({ marketId: 'm2', code: 'US' })]);
      const result = await useCase.list(new ListMarketsCommand({ organizationId: 'org-1' }));
      expect(marketRepository.list).toHaveBeenCalledWith({ organizationId: 'org-1' });
      expect(result).toHaveLength(2);
    });

    it('should soft-delete a draft market', async () => {
      marketRepository.findById.mockResolvedValue(createMarket());
      await useCase.delete(new DeleteMarketCommand('market-1'));
      expect(marketRepository.delete).toHaveBeenCalledWith('market-1');
    });

    it('should refuse to delete an active market', async () => {
      const market = createMarket();
      market.activate();
      marketRepository.findById.mockResolvedValue(market);
      await expect(useCase.delete(new DeleteMarketCommand('market-1'))).rejects.toThrow(MarketValidationError);
      expect(marketRepository.delete).not.toHaveBeenCalled();
    });

    it('should disable a market', async () => {
      const market = createMarket();
      market.activate();
      marketRepository.findById.mockResolvedValue(market);
      const result = await useCase.disable(new SetMarketStatusCommand('market-1', 'disable'));
      expect(result.status).toBe('disabled');
    });
  });
});
