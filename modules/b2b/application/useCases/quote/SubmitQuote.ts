/**
 * Submit Quote Use Case
 * Submits a draft quote for approval
 */

import * as quoteRepo from '../../../repos/quoteRepo';
import * as companyRepo from '../../../repos/companyRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export interface SubmitQuoteCommand {
  quoteId: string;
  submittedBy?: string;
}

export interface SubmitQuoteResponse {
  success: boolean;
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
    submittedAt: Date;
  };
  error?: string;
}

export class SubmitQuoteUseCase {
  async execute(command: SubmitQuoteCommand): Promise<SubmitQuoteResponse> {
    try {
      const quote = await quoteRepo.getQuote(command.quoteId);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      if (quote.status !== 'draft') {
        return { success: false, error: 'Only draft quotes can be submitted' };
      }

      // Get company for event
      const company = quote.b2bCompanyId ? await companyRepo.getCompany(quote.b2bCompanyId) : null;

      // Update quote status to pending_review (closest to submitted in QuoteStatus)
      const updatedQuote = await quoteRepo.saveQuote({
        b2bQuoteId: quote.b2bQuoteId,
        status: 'pending_review',
      });

      // Emit event
      (eventBus as any).emit('b2b.quote.submitted', {
        quoteId: quote.b2bQuoteId,
        quoteNumber: quote.quoteNumber || '',
        companyId: quote.b2bCompanyId || '',
        companyName: company?.name || '',
        total: quote.grandTotal,
        submittedBy: command.submittedBy,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        quote: {
          id: updatedQuote.b2bQuoteId,
          quoteNumber: updatedQuote.quoteNumber || '',
          status: updatedQuote.status,
          submittedAt: new Date(),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
