import { query, queryOne } from '../../../../libs/db';
import { Quote, QuoteProps } from '../../domain/entities/Quote';
import type { QuoteRepository } from '../../domain/repositories/B2BRepository';

type QuoteRow = Omit<QuoteProps, 'currency'> & { currencyCode?: string };

function toProps(row: QuoteRow): QuoteProps {
  const { currencyCode, ...rest } = row;
  return { ...rest, currency: currencyCode ?? 'USD' } as QuoteProps;
}

export class QuoteRepositoryImpl implements QuoteRepository {
  async findById(quoteId: string): Promise<Quote | null> {
    const row = await queryOne<QuoteRow>(`SELECT * FROM "b2bQuote" WHERE "quoteId" = $1`, [quoteId]);
    return row ? Quote.reconstitute(toProps(row)) : null;
  }

  async findByQuoteNumber(quoteNumber: string): Promise<Quote | null> {
    const row = await queryOne<QuoteRow>(`SELECT * FROM "b2bQuote" WHERE "quoteNumber" = $1`, [quoteNumber]);
    return row ? Quote.reconstitute(toProps(row)) : null;
  }

  async findByCompanyId(companyId: string): Promise<Quote[]> {
    const rows = await query<QuoteRow[]>(`SELECT * FROM "b2bQuote" WHERE "companyId" = $1 ORDER BY "createdAt" DESC`, [companyId]);
    return (rows ?? []).map(r => Quote.reconstitute(toProps(r)));
  }

  async findByOrganizationId(organizationId: string): Promise<Quote[]> {
    const rows = await query<QuoteRow[]>(`SELECT * FROM "b2bQuote" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`, [
      organizationId,
    ]);
    return (rows ?? []).map(r => Quote.reconstitute(toProps(r)));
  }

  async findByStatus(status: string, organizationId: string): Promise<Quote[]> {
    const rows = await query<QuoteRow[]>(
      `SELECT * FROM "b2bQuote" WHERE "status" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
      [status, organizationId],
    );
    return (rows ?? []).map(r => Quote.reconstitute(toProps(r)));
  }

  async save(quote: Quote): Promise<void> {
    const json = quote.toJSON();
    await query(
      `INSERT INTO "b2bQuote" (
        "quoteId", "companyId", "organizationId", "quoteNumber", "status",
        "requestedBy", "lineItems", "subtotalCents", "discountTotalCents", "taxTotalCents",
        "totalCents", "currencyCode", "notes", "internalNotes", "validUntil",
        "sentAt", "viewedAt", "acceptedAt", "rejectedAt", "convertedOrderId",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      ON CONFLICT ("quoteId") DO UPDATE SET
        "status" = EXCLUDED."status",
        "lineItems" = EXCLUDED."lineItems",
        "subtotalCents" = EXCLUDED."subtotalCents",
        "discountTotalCents" = EXCLUDED."discountTotalCents",
        "taxTotalCents" = EXCLUDED."taxTotalCents",
        "totalCents" = EXCLUDED."totalCents",
        "notes" = EXCLUDED."notes",
        "internalNotes" = EXCLUDED."internalNotes",
        "sentAt" = EXCLUDED."sentAt",
        "viewedAt" = EXCLUDED."viewedAt",
        "acceptedAt" = EXCLUDED."acceptedAt",
        "rejectedAt" = EXCLUDED."rejectedAt",
        "convertedOrderId" = EXCLUDED."convertedOrderId",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.quoteId,
        json.companyId,
        json.organizationId,
        json.quoteNumber,
        json.status,
        json.requestedBy,
        JSON.stringify(json.lineItems),
        json.subtotalCents,
        json.discountTotalCents,
        json.taxTotalCents,
        json.totalCents,
        json.currency,
        json.notes ?? null,
        json.internalNotes ?? null,
        json.validUntil,
        json.sentAt ?? null,
        json.viewedAt ?? null,
        json.acceptedAt ?? null,
        json.rejectedAt ?? null,
        json.convertedOrderId ?? null,
        json.createdAt,
        json.updatedAt,
      ],
    );
  }

  async delete(quoteId: string): Promise<void> {
    await query(`DELETE FROM "b2bQuote" WHERE "quoteId" = $1`, [quoteId]);
  }
}
