/**
 * Create Quote Use Case
 * Creates a new B2B quote for a company
 */

import * as quoteRepo from '../../../repos/quoteRepo';
import * as companyRepo from '../../../repos/companyRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export interface CreateQuoteCommand {
  companyId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  currency?: string;
  validDays?: number;
  notes?: string;
  internalNotes?: string;
  createdBy?: string;
}

export interface CreateQuoteResponse {
  success: boolean;
  quote?: {
    id: string;
    quoteNumber: string;
    companyId: string;
    status: string;
    subtotal: number;
    total: number;
    itemCount: number;
    validUntil: Date;
    createdAt: Date;
  };
  error?: string;
}

export class CreateQuoteUseCase {
  async execute(command: CreateQuoteCommand): Promise<CreateQuoteResponse> {
    try {
      // Validate company exists and is active
      const company = await companyRepo.getCompany(command.companyId);
      if (!company) {
        return { success: false, error: 'Company not found' };
      }
      if (company.status !== 'active') {
        return { success: false, error: 'Company is not active' };
      }

      // Validate items
      if (!command.items || command.items.length === 0) {
        return { success: false, error: 'At least one item is required' };
      }

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      for (const item of command.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        if (item.discount) {
          totalDiscount += item.discount;
        }
      }
      const total = subtotal - totalDiscount;

      // Calculate valid until date
      const validDays = command.validDays || 30;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      // Create the quote
      const quote = await quoteRepo.saveQuote({
        b2bCompanyId: command.companyId,
        customerId: command.customerId,
        status: 'draft',
        subtotal,
        discountTotal: totalDiscount,
        taxTotal: 0,
        shippingTotal: 0,
        handlingTotal: 0,
        grandTotal: total,
        currency: command.currency || 'USD',
        validUntil,
        validityDays: command.validDays || 30,
        customerNotes: command.notes,
        internalNotes: command.internalNotes,
        revisionNumber: 1,
        attachments: []
      });

      // Add items to the quote
      for (let i = 0; i < command.items.length; i++) {
        const item = command.items[i];
        const lineTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
        await quoteRepo.saveQuoteItem({
          b2bQuoteId: quote.b2bQuoteId,
          productId: item.productId,
          productVariantId: item.variantId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unit: 'each',
          unitPrice: item.unitPrice,
          discountPercent: 0,
          discountAmount: item.discount || 0,
          lineTotal,
          taxRate: 0,
          taxAmount: 0,
          isCustomItem: false,
          isPriceOverride: false,
          position: i
        });
      }

      // Emit event
      (eventBus as any).emit('b2b.quote.created', {
        quoteId: quote.b2bQuoteId,
        quoteNumber: quote.quoteNumber || '',
        companyId: quote.b2bCompanyId || command.companyId,
        companyName: company.name,
        total: quote.grandTotal,
        currency: quote.currency,
        itemCount: command.items.length,
        createdBy: command.createdBy,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        quote: {
          id: quote.b2bQuoteId,
          quoteNumber: quote.quoteNumber || '',
          companyId: quote.b2bCompanyId || command.companyId,
          status: quote.status,
          subtotal: quote.subtotal,
          total: quote.grandTotal,
          itemCount: command.items.length,
          validUntil: quote.validUntil || validUntil,
          createdAt: quote.createdAt
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
