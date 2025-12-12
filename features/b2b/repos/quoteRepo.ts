/**
 * Quote Repository
 * Handles CRUD operations for B2B quotes/RFQ
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type QuoteStatus = 'draft' | 'pending_review' | 'pending_approval' | 'sent' | 'viewed' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'cancelled';

export interface B2bQuote {
  b2bQuoteId: string;
  quoteNumber?: string;
  b2bCompanyId?: string;
  customerId?: string;
  b2bCompanyUserId?: string;
  salesRepId?: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountReason?: string;
  taxTotal: number;
  shippingTotal: number;
  handlingTotal: number;
  grandTotal: number;
  margin?: number;
  marginPercent?: number;
  validUntil?: Date;
  validityDays: number;
  billingAddressId?: string;
  shippingAddressId?: string;
  shippingMethod?: string;
  customerNotes?: string;
  internalNotes?: string;
  terms?: string;
  conditions?: string;
  paymentTerms?: string;
  paymentTermsDays?: number;
  convertedOrderId?: string;
  rejectionReason?: string;
  revisionNumber: number;
  previousVersionId?: string;
  attachments: string[];
  metadata?: Record<string, any>;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  convertedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface B2bQuoteItem {
  b2bQuoteItemId: string;
  b2bQuoteId: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  listPrice?: number;
  unitPrice: number;
  costPrice?: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
  taxRate: number;
  taxAmount: number;
  margin?: number;
  marginPercent?: number;
  isCustomItem: boolean;
  isPriceOverride: boolean;
  priceOverrideReason?: string;
  position: number;
  notes?: string;
  requestedDeliveryDate?: Date;
  leadTimeDays?: number;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Quote CRUD
// ============================================================================

export async function getQuote(quoteId: string): Promise<B2bQuote | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bQuote" WHERE "b2bQuoteId" = $1 AND "deletedAt" IS NULL',
    [quoteId]
  );
  return row ? mapToQuote(row) : null;
}

export async function getQuoteByNumber(quoteNumber: string): Promise<B2bQuote | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bQuote" WHERE "quoteNumber" = $1 AND "deletedAt" IS NULL',
    [quoteNumber]
  );
  return row ? mapToQuote(row) : null;
}

export async function getQuotes(
  filters?: { 
    companyId?: string; 
    customerId?: string; 
    salesRepId?: string;
    status?: QuoteStatus;
  },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: B2bQuote[]; total: number }> {
  let whereClause = '"deletedAt" IS NULL';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.companyId) {
    whereClause += ` AND "companyId" = $${paramIndex++}`;
    params.push(filters.companyId);
  }
  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.salesRepId) {
    whereClause += ` AND "salesRepId" = $${paramIndex++}`;
    params.push(filters.salesRepId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "b2bQuote" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "b2bQuote" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToQuote),
    total: parseInt(countResult?.count || '0')
  };
}

export async function saveQuote(quote: Partial<B2bQuote>): Promise<B2bQuote> {
  const now = new Date().toISOString();

  if (quote.b2bQuoteId) {
    await query(
      `UPDATE "b2bQuote" SET
        "b2bCompanyId" = $1, "customerId" = $2, "b2bCompanyUserId" = $3, "salesRepId" = $4,
        "status" = $5, "currency" = $6, "subtotal" = $7, "discountTotal" = $8,
        "discountType" = $9, "discountValue" = $10, "discountReason" = $11,
        "taxTotal" = $12, "shippingTotal" = $13, "handlingTotal" = $14, "grandTotal" = $15,
        "validUntil" = $16, "validityDays" = $17, "billingAddressId" = $18,
        "shippingAddressId" = $19, "shippingMethod" = $20, "customerNotes" = $21,
        "internalNotes" = $22, "terms" = $23, "conditions" = $24, "paymentTerms" = $25,
        "paymentTermsDays" = $26, "attachments" = $27, "metadata" = $28, "updatedAt" = $29
      WHERE "b2bQuoteId" = $30`,
      [
        quote.b2bCompanyId, quote.customerId, quote.b2bCompanyUserId, quote.salesRepId,
        quote.status || 'draft', quote.currency || 'USD', quote.subtotal || 0,
        quote.discountTotal || 0, quote.discountType, quote.discountValue,
        quote.discountReason, quote.taxTotal || 0, quote.shippingTotal || 0,
        quote.handlingTotal || 0, quote.grandTotal || 0,
        quote.validUntil?.toISOString(), quote.validityDays || 30,
        quote.billingAddressId, quote.shippingAddressId, quote.shippingMethod,
        quote.customerNotes, quote.internalNotes, quote.terms, quote.conditions,
        quote.paymentTerms, quote.paymentTermsDays,
        JSON.stringify(quote.attachments || []),
        quote.metadata ? JSON.stringify(quote.metadata) : null, now, quote.b2bQuoteId
      ]
    );
    return (await getQuote(quote.b2bQuoteId))!;
  } else {
    // Generate quote number
    const quoteNumber = await generateQuoteNumber();
    
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bQuote" (
        "quoteNumber", "b2bCompanyId", "customerId", "b2bCompanyUserId", "salesRepId",
        "status", "currency", "subtotal", "discountTotal", "discountType", "discountValue",
        "discountReason", "taxTotal", "shippingTotal", "handlingTotal", "grandTotal",
        "validUntil", "validityDays", "billingAddressId", "shippingAddressId",
        "shippingMethod", "customerNotes", "internalNotes", "terms", "conditions",
        "paymentTerms", "paymentTermsDays", "revisionNumber", "attachments", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING *`,
      [
        quoteNumber, quote.b2bCompanyId, quote.customerId, quote.b2bCompanyUserId,
        quote.salesRepId, 'draft', quote.currency || 'USD', 0, 0, null, null, null,
        0, 0, 0, 0, null, quote.validityDays || 30, quote.billingAddressId,
        quote.shippingAddressId, quote.shippingMethod, quote.customerNotes,
        quote.internalNotes, quote.terms, quote.conditions, quote.paymentTerms,
        quote.paymentTermsDays, 1, '[]', quote.metadata ? JSON.stringify(quote.metadata) : null,
        now, now
      ]
    );
    return mapToQuote(result!);
  }
}

export async function sendQuote(quoteId: string): Promise<void> {
  const now = new Date().toISOString();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  
  await query(
    `UPDATE "b2bQuote" SET 
      "status" = 'sent', "sentAt" = $1, "validUntil" = $2, "expiresAt" = $3, "updatedAt" = $4
     WHERE "b2bQuoteId" = $5`,
    [now, validUntil, validUntil, now, quoteId]
  );
}

export async function markQuoteViewed(quoteId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bQuote" SET "status" = 'viewed', "viewedAt" = $1, "updatedAt" = $1
     WHERE "b2bQuoteId" = $2 AND "viewedAt" IS NULL`,
    [now, quoteId]
  );
}

export async function acceptQuote(quoteId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bQuote" SET "status" = 'accepted', "acceptedAt" = $1, "updatedAt" = $1
     WHERE "b2bQuoteId" = $2`,
    [now, quoteId]
  );
}

export async function rejectQuote(quoteId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bQuote" SET "status" = 'rejected', "rejectedAt" = $1, "rejectionReason" = $2, "updatedAt" = $1
     WHERE "b2bQuoteId" = $3`,
    [now, reason, quoteId]
  );
}

export async function convertQuoteToOrder(quoteId: string, orderId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bQuote" SET "status" = 'converted', "convertedOrderId" = $1, "convertedAt" = $2, "updatedAt" = $2
     WHERE "b2bQuoteId" = $3`,
    [orderId, now, quoteId]
  );
}

export async function createQuoteRevision(quoteId: string): Promise<B2bQuote> {
  const original = await getQuote(quoteId);
  if (!original) throw new Error('Quote not found');

  const items = await getQuoteItems(quoteId);
  
  // Create new quote as revision
  const newQuote = await saveQuote({
    ...original,
    b2bQuoteId: undefined,
    status: 'draft',
    revisionNumber: original.revisionNumber + 1,
    previousVersionId: quoteId,
    sentAt: undefined,
    viewedAt: undefined,
    acceptedAt: undefined,
    rejectedAt: undefined,
    convertedAt: undefined
  });

  // Copy items
  for (const item of items) {
    await saveQuoteItem({
      ...item,
      b2bQuoteItemId: undefined,
      b2bQuoteId: newQuote.b2bQuoteId
    });
  }

  return newQuote;
}

export async function deleteQuote(quoteId: string): Promise<void> {
  await query(
    'UPDATE "b2bQuote" SET "deletedAt" = $1 WHERE "b2bQuoteId" = $2',
    [new Date().toISOString(), quoteId]
  );
}

// ============================================================================
// Quote Items
// ============================================================================

export async function getQuoteItem(quoteItemId: string): Promise<B2bQuoteItem | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bQuoteItem" WHERE "b2bQuoteItemId" = $1',
    [quoteItemId]
  );
  return row ? mapToQuoteItem(row) : null;
}

export async function getQuoteItems(quoteId: string): Promise<B2bQuoteItem[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "b2bQuoteItem" WHERE "b2bQuoteId" = $1 ORDER BY "position" ASC',
    [quoteId]
  );
  return (rows || []).map(mapToQuoteItem);
}

export async function saveQuoteItem(item: Partial<B2bQuoteItem> & { b2bQuoteId: string; name: string; unitPrice: number }): Promise<B2bQuoteItem> {
  const now = new Date().toISOString();
  const quantity = item.quantity || 1;
  const unitPrice = item.unitPrice;
  const discountAmount = item.discountAmount || 0;
  const lineTotal = (quantity * unitPrice) - discountAmount;
  const taxAmount = lineTotal * ((item.taxRate || 0) / 100);

  if (item.b2bQuoteItemId) {
    await query(
      `UPDATE "b2bQuoteItem" SET
        "productId" = $1, "productVariantId" = $2, "sku" = $3, "name" = $4,
        "description" = $5, "quantity" = $6, "unit" = $7, "listPrice" = $8,
        "unitPrice" = $9, "costPrice" = $10, "discountPercent" = $11,
        "discountAmount" = $12, "lineTotal" = $13, "taxRate" = $14, "taxAmount" = $15,
        "isCustomItem" = $16, "isPriceOverride" = $17, "priceOverrideReason" = $18,
        "position" = $19, "notes" = $20, "requestedDeliveryDate" = $21,
        "leadTimeDays" = $22, "customFields" = $23, "metadata" = $24, "updatedAt" = $25
      WHERE "b2bQuoteItemId" = $26`,
      [
        item.productId, item.productVariantId, item.sku, item.name, item.description,
        quantity, item.unit || 'each', item.listPrice, unitPrice, item.costPrice,
        item.discountPercent || 0, discountAmount, lineTotal, item.taxRate || 0,
        taxAmount, item.isCustomItem || false, item.isPriceOverride || false,
        item.priceOverrideReason, item.position || 0, item.notes,
        item.requestedDeliveryDate?.toISOString(), item.leadTimeDays,
        item.customFields ? JSON.stringify(item.customFields) : null,
        item.metadata ? JSON.stringify(item.metadata) : null, now, item.b2bQuoteItemId
      ]
    );
    
    await recalculateQuoteTotals(item.b2bQuoteId);
    return (await getQuoteItem(item.b2bQuoteItemId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bQuoteItem" (
        "b2bQuoteId", "productId", "productVariantId", "sku", "name", "description",
        "quantity", "unit", "listPrice", "unitPrice", "costPrice", "discountPercent",
        "discountAmount", "lineTotal", "taxRate", "taxAmount", "isCustomItem",
        "isPriceOverride", "priceOverrideReason", "position", "notes",
        "requestedDeliveryDate", "leadTimeDays", "customFields", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        item.b2bQuoteId, item.productId, item.productVariantId, item.sku, item.name,
        item.description, quantity, item.unit || 'each', item.listPrice, unitPrice,
        item.costPrice, item.discountPercent || 0, discountAmount, lineTotal,
        item.taxRate || 0, taxAmount, item.isCustomItem || false,
        item.isPriceOverride || false, item.priceOverrideReason, item.position || 0,
        item.notes, item.requestedDeliveryDate?.toISOString(), item.leadTimeDays,
        item.customFields ? JSON.stringify(item.customFields) : null,
        item.metadata ? JSON.stringify(item.metadata) : null, now, now
      ]
    );

    await recalculateQuoteTotals(item.b2bQuoteId);
    return mapToQuoteItem(result!);
  }
}

export async function deleteQuoteItem(quoteItemId: string): Promise<void> {
  const item = await getQuoteItem(quoteItemId);
  if (item) {
    await query('DELETE FROM "b2bQuoteItem" WHERE "b2bQuoteItemId" = $1', [quoteItemId]);
    await recalculateQuoteTotals(item.b2bQuoteId);
  }
}

async function recalculateQuoteTotals(quoteId: string): Promise<void> {
  const result = await queryOne<Record<string, any>>(
    `SELECT 
      COALESCE(SUM("lineTotal"), 0) as subtotal,
      COALESCE(SUM("taxAmount"), 0) as "taxTotal"
    FROM "b2bQuoteItem" WHERE "b2bQuoteId" = $1`,
    [quoteId]
  );

  const subtotal = parseFloat(result?.subtotal || '0');
  const taxTotal = parseFloat(result?.taxTotal || '0');
  
  // Get current quote for discount and shipping
  const quote = await getQuote(quoteId);
  const discountTotal = quote?.discountTotal || 0;
  const shippingTotal = quote?.shippingTotal || 0;
  const handlingTotal = quote?.handlingTotal || 0;
  
  const grandTotal = subtotal - discountTotal + taxTotal + shippingTotal + handlingTotal;

  await query(
    `UPDATE "b2bQuote" SET "subtotal" = $1, "taxTotal" = $2, "grandTotal" = $3, "updatedAt" = $4
     WHERE "b2bQuoteId" = $5`,
    [subtotal, taxTotal, grandTotal, new Date().toISOString(), quoteId]
  );
}

// ============================================================================
// Helpers
// ============================================================================

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "b2bQuote" WHERE "quoteNumber" LIKE $1`,
    [`Q${year}%`]
  );
  const count = parseInt(result?.count || '0') + 1;
  return `Q${year}-${count.toString().padStart(5, '0')}`;
}

function mapToQuote(row: Record<string, any>): B2bQuote {
  return {
    b2bQuoteId: row.b2bQuoteId,
    quoteNumber: row.quoteNumber,
    b2bCompanyId: row.b2bCompanyId,
    customerId: row.customerId,
    b2bCompanyUserId: row.b2bCompanyUserId,
    salesRepId: row.salesRepId,
    status: row.status,
    currency: row.currency || 'USD',
    subtotal: parseFloat(row.subtotal) || 0,
    discountTotal: parseFloat(row.discountTotal) || 0,
    discountType: row.discountType,
    discountValue: row.discountValue ? parseFloat(row.discountValue) : undefined,
    discountReason: row.discountReason,
    taxTotal: parseFloat(row.taxTotal) || 0,
    shippingTotal: parseFloat(row.shippingTotal) || 0,
    handlingTotal: parseFloat(row.handlingTotal) || 0,
    grandTotal: parseFloat(row.grandTotal) || 0,
    margin: row.margin ? parseFloat(row.margin) : undefined,
    marginPercent: row.marginPercent ? parseFloat(row.marginPercent) : undefined,
    validUntil: row.validUntil ? new Date(row.validUntil) : undefined,
    validityDays: parseInt(row.validityDays) || 30,
    billingAddressId: row.billingAddressId,
    shippingAddressId: row.shippingAddressId,
    shippingMethod: row.shippingMethod,
    customerNotes: row.customerNotes,
    internalNotes: row.internalNotes,
    terms: row.terms,
    conditions: row.conditions,
    paymentTerms: row.paymentTerms,
    paymentTermsDays: row.paymentTermsDays ? parseInt(row.paymentTermsDays) : undefined,
    convertedOrderId: row.convertedOrderId,
    rejectionReason: row.rejectionReason,
    revisionNumber: parseInt(row.revisionNumber) || 1,
    previousVersionId: row.previousVersionId,
    attachments: row.attachments || [],
    metadata: row.metadata,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    viewedAt: row.viewedAt ? new Date(row.viewedAt) : undefined,
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
    rejectedAt: row.rejectedAt ? new Date(row.rejectedAt) : undefined,
    convertedAt: row.convertedAt ? new Date(row.convertedAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
  };
}

function mapToQuoteItem(row: Record<string, any>): B2bQuoteItem {
  return {
    b2bQuoteItemId: row.b2bQuoteItemId,
    b2bQuoteId: row.b2bQuoteId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    sku: row.sku,
    name: row.name,
    description: row.description,
    quantity: parseInt(row.quantity) || 1,
    unit: row.unit || 'each',
    listPrice: row.listPrice ? parseFloat(row.listPrice) : undefined,
    unitPrice: parseFloat(row.unitPrice) || 0,
    costPrice: row.costPrice ? parseFloat(row.costPrice) : undefined,
    discountPercent: parseFloat(row.discountPercent) || 0,
    discountAmount: parseFloat(row.discountAmount) || 0,
    lineTotal: parseFloat(row.lineTotal) || 0,
    taxRate: parseFloat(row.taxRate) || 0,
    taxAmount: parseFloat(row.taxAmount) || 0,
    margin: row.margin ? parseFloat(row.margin) : undefined,
    marginPercent: row.marginPercent ? parseFloat(row.marginPercent) : undefined,
    isCustomItem: Boolean(row.isCustomItem),
    isPriceOverride: Boolean(row.isPriceOverride),
    priceOverrideReason: row.priceOverrideReason,
    position: parseInt(row.position) || 0,
    notes: row.notes,
    requestedDeliveryDate: row.requestedDeliveryDate ? new Date(row.requestedDeliveryDate) : undefined,
    leadTimeDays: row.leadTimeDays ? parseInt(row.leadTimeDays) : undefined,
    customFields: row.customFields,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
