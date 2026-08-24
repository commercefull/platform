import { Quote } from './Quote';

describe('Quote Entity', () => {
  describe('create', () => {
    it('should create a quote with default values', () => {
      const quote = Quote.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        requestedBy: 'user-1',
      });
      expect(quote.quoteId).toBeDefined();
      expect(quote.quoteNumber).toMatch(/^QT-\d{4}-\d{2}-/);
      expect(quote.status).toBe('draft');
      expect(quote.currency).toBe('USD');
      expect(quote.total).toBe(0);
      expect(quote.lineItems).toEqual([]);
    });

    it('should set validUntil based on days', () => {
      const quote = Quote.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        requestedBy: 'user-1',
        validUntilDays: 60,
      });
      const diff = (quote.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diff).toBeGreaterThan(59);
      expect(diff).toBeLessThan(61);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const props = {
        quoteId: 'q-1',
        companyId: 'comp-1',
        organizationId: 'org-1',
        quoteNumber: 'QT-2024-01-ABC123',
        status: 'sent' as const,
        requestedBy: 'user-1',
        lineItems: [],
        subtotal: 100,
        discountTotal: 0,
        taxTotal: 0,
        total: 100,
        currency: 'EUR',
        validUntil: new Date('2025-12-31'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const quote = Quote.reconstitute(props);
      expect(quote.quoteId).toBe('q-1');
      expect(quote.status).toBe('sent');
      expect(quote.currency).toBe('EUR');
    });
  });

  describe('line items', () => {
    it('should add a line item and recalculate', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({
        productId: 'p-1',
        sku: 'SKU-001',
        name: 'Widget',
        quantity: 10,
        unitPrice: 50,
      });
      expect(quote.lineItemCount).toBe(1);
      expect(quote.subtotal).toBe(500);
      expect(quote.total).toBe(500);
    });

    it('should calculate discount and tax', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({
        productId: 'p-1',
        sku: 'SKU-001',
        name: 'Widget',
        quantity: 10,
        unitPrice: 100,
        discountPercent: 10,
        taxRate: 5,
      });
      expect(quote.subtotal).toBe(1000);
      expect(quote.discountTotal).toBe(100);
      expect(quote.taxTotal).toBe(45);
      expect(quote.total).toBe(945);
    });

    it('should update a line item', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 5, unitPrice: 100 });
      const itemId = quote.lineItems[0].lineItemId;
      quote.updateLineItem(itemId, { quantity: 10 });
      expect(quote.lineItems[0].quantity).toBe(10);
      expect(quote.subtotal).toBe(1000);
    });

    it('should remove a line item', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 5, unitPrice: 100 });
      const itemId = quote.lineItems[0].lineItemId;
      quote.removeLineItem(itemId);
      expect(quote.lineItemCount).toBe(0);
      expect(quote.total).toBe(0);
    });

    it('should not add items to non-draft quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      expect(() => quote.addLineItem({ productId: 'p-2', sku: 'SKU-002', name: 'Gadget', quantity: 1, unitPrice: 20 }))
        .toThrow('Cannot add line items to a quote in status: sent');
    });
  });

  describe('workflow', () => {
    it('should send a draft quote with items', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      expect(quote.status).toBe('sent');
      expect(quote.sentAt).toBeDefined();
    });

    it('should not send an empty quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      expect(() => quote.send()).toThrow('Cannot send an empty quote');
    });

    it('should mark as viewed', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      quote.markViewed();
      expect(quote.status).toBe('viewed');
    });

    it('should accept a sent quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1', validUntilDays: 30 });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      quote.accept();
      expect(quote.status).toBe('accepted');
      expect(quote.acceptedAt).toBeDefined();
    });

    it('should reject a sent quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      quote.reject('Too expensive');
      expect(quote.status).toBe('rejected');
      expect(quote.rejectedAt).toBeDefined();
    });

    it('should convert an accepted quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      quote.accept();
      quote.convert('order-123');
      expect(quote.status).toBe('converted');
      expect(quote.convertedOrderId).toBe('order-123');
    });

    it('should not accept a draft quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      expect(() => quote.accept()).toThrow('Cannot accept quote in status: draft');
    });

    it('should not convert a non-accepted quote', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      expect(() => quote.convert('order-1')).toThrow('Cannot convert quote in status: sent');
    });
  });

  describe('isExpired', () => {
    it('should detect expired quotes', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1', validUntilDays: -1 });
      expect(quote.isExpired).toBe(true);
    });

    it('should not be expired if accepted', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1', validUntilDays: 30 });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      quote.send();
      quote.accept();
      expect(quote.isExpired).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return all props with line items', () => {
      const quote = Quote.create({ companyId: 'comp-1', organizationId: 'org-1', requestedBy: 'u-1' });
      quote.addLineItem({ productId: 'p-1', sku: 'SKU-001', name: 'Widget', quantity: 1, unitPrice: 10 });
      const json = quote.toJSON();
      expect(json.quoteId).toBeDefined();
      expect(Array.isArray(json.lineItems)).toBe(true);
      expect((json.lineItems as unknown[]).length).toBe(1);
    });
  });
});
