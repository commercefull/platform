import '../../tests/testUtils';
import { ManageQuoteUseCase } from './ManageQuote';
import { QuoteNotFoundError, QuoteExpiredError } from '../../domain/errors/B2BErrors';
import type { QuoteRepository } from '../../domain/repositories/B2BRepository';
import { createQuote, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageQuoteUseCase', () => {
  let repo: jest.Mocked<QuoteRepository>;
  let useCase: ManageQuoteUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<QuoteRepository>();
    repo.findById.mockResolvedValue(createQuote());
    useCase = new ManageQuoteUseCase(repo);
  });

  it('should create a draft quote and emit quote.created', async () => {
    const result = await useCase.create({ companyId: 'co-1', organizationId: 'org-1', requestedBy: 'u-1' });

    expect(result.status).toBe('draft');
    expect(emitMock).toHaveBeenCalledWith('quote.created', expect.objectContaining({ quoteNumber: result.quoteNumber }));
  });

  it('should throw QuoteNotFoundError when the quote does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(QuoteNotFoundError);
  });

  it('should accept a sent quote and emit quote.accepted', async () => {
    const quote = createQuote();
    quote.addLineItem({ productId: 'p-1', sku: 'S-1', name: 'Item', quantity: 1, unitPriceCents: 10 });
    quote.send();
    repo.findById.mockResolvedValue(quote);

    const result = await useCase.accept('q-1');

    expect(result.status).toBe('accepted');
    expect(emitMock).toHaveBeenCalledWith('quote.accepted', expect.objectContaining({ quoteId: quote.quoteId }));
  });

  it('should throw QuoteExpiredError when accepting an expired quote', async () => {
    const quote = createQuote({ validUntilDays: 0 });
    jest.spyOn(quote, 'isExpired', 'get').mockReturnValue(true);
    repo.findById.mockResolvedValue(quote);

    await expect(useCase.accept('q-1')).rejects.toThrow(QuoteExpiredError);
  });

  it('should reject a quote and emit quote.rejected with the reason', async () => {
    const quote = createQuote();
    quote.addLineItem({ productId: 'p-1', sku: 'S-1', name: 'Item', quantity: 1, unitPriceCents: 10 });
    quote.send();
    repo.findById.mockResolvedValue(quote);

    await useCase.reject('q-1', 'too expensive');

    expect(emitMock).toHaveBeenCalledWith('quote.rejected', expect.objectContaining({ reason: 'too expensive' }));
  });
});
