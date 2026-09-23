import { Quote, QuoteLineItem } from '../../domain/entities/Quote';
import { QuoteRepository } from '../../domain/repositories/B2BRepository';
import { QuoteNotFoundError, QuoteExpiredError } from '../../domain/errors/B2BErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class ManageQuoteUseCase {
  constructor(private quoteRepo: QuoteRepository) {}

  async create(input: {
    companyId: string;
    organizationId: string;
    requestedBy: string;
    currency?: string;
    validUntilDays?: number;
    notes?: string;
  }): Promise<Quote> {
    const quote = Quote.create(input);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.created', { quoteId: quote.quoteId, companyId: quote.companyId, quoteNumber: quote.quoteNumber });
    return quote;
  }

  async get(quoteId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) throw new QuoteNotFoundError(quoteId);
    return quote;
  }

  async getByQuoteNumber(quoteNumber: string): Promise<Quote> {
    const quote = await this.quoteRepo.findByQuoteNumber(quoteNumber);
    if (!quote) throw new QuoteNotFoundError(quoteNumber);
    return quote;
  }

  async listByCompany(companyId: string): Promise<Quote[]> {
    return this.quoteRepo.findByCompanyId(companyId);
  }

  async listByOrganization(organizationId: string): Promise<Quote[]> {
    return this.quoteRepo.findByOrganizationId(organizationId);
  }

  async listByStatus(status: string, organizationId: string): Promise<Quote[]> {
    return this.quoteRepo.findByStatus(status, organizationId);
  }

  async addLineItem(quoteId: string, item: Omit<QuoteLineItem, 'lineItemId'>): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.addLineItem(item);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async updateLineItem(quoteId: string, lineItemId: string, updates: Partial<Omit<QuoteLineItem, 'lineItemId'>>): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.updateLineItem(lineItemId, updates);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async removeLineItem(quoteId: string, lineItemId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.removeLineItem(lineItemId);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async send(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.send();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.sent', { quoteId: quote.quoteId, companyId: quote.companyId, quoteNumber: quote.quoteNumber });
    return quote;
  }

  async markViewed(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.markViewed();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.viewed', { quoteId: quote.quoteId });
    return quote;
  }

  async accept(quoteId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    if (quote.isExpired) throw new QuoteExpiredError(quoteId);
    quote.accept();
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.accepted', { quoteId: quote.quoteId, companyId: quote.companyId, total: quote.total });
    return quote;
  }

  async reject(quoteId: string, reason?: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.reject(reason);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.rejected', { quoteId: quote.quoteId, reason });
    return quote;
  }

  async convert(quoteId: string, orderId: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.convert(orderId);
    await this.quoteRepo.save(quote);
    await eventBus.emit('quote.converted', { quoteId: quote.quoteId, orderId });
    return quote;
  }

  async setNotes(quoteId: string, notes: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.setNotes(notes);
    await this.quoteRepo.save(quote);
    return quote;
  }

  async setInternalNotes(quoteId: string, notes: string): Promise<Quote> {
    const quote = await this.get(quoteId);
    quote.setInternalNotes(notes);
    await this.quoteRepo.save(quote);
    return quote;
  }
}

