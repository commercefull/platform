/**
 * Payment Terms Repository
 * 
 * Manages B2B payment terms (Net 30, Net 60, etc.).
 */

import { query, queryOne } from '../../../libs/db';
import { PaymentTerms } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `pt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreatePaymentTermsParams {
  organizationId: string;
  name: string;
  code: string;
  days: number;
  discountPercentage?: number;
  discountDays?: number;
  isDefault?: boolean;
}

export async function create(params: CreatePaymentTermsParams): Promise<PaymentTerms> {
  const paymentTermsId = generateId();
  const now = new Date();

  // If setting as default, unset other defaults
  if (params.isDefault) {
    await query(
      'UPDATE "paymentTerms" SET "isDefault" = false WHERE "organizationId" = $1',
      [params.organizationId]
    );
  }

  const sql = `
    INSERT INTO "paymentTerms" (
      "paymentTermsId", "organizationId", "name", "code", "days",
      "discountPercentage", "discountDays", "isDefault", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await query<{ rows: PaymentTerms[] }>(sql, [
    paymentTermsId,
    params.organizationId,
    params.name,
    params.code,
    params.days,
    params.discountPercentage || null,
    params.discountDays || null,
    params.isDefault || false,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(paymentTermsId: string): Promise<PaymentTerms | null> {
  return queryOne<PaymentTerms>(
    'SELECT * FROM "paymentTerms" WHERE "paymentTermsId" = $1',
    [paymentTermsId]
  );
}

export async function findByCode(code: string): Promise<PaymentTerms | null> {
  return queryOne<PaymentTerms>(
    'SELECT * FROM "paymentTerms" WHERE "code" = $1',
    [code]
  );
}

export async function findByOrganization(organizationId: string): Promise<PaymentTerms[]> {
  const result = await query<{ rows: PaymentTerms[] }>(
    'SELECT * FROM "paymentTerms" WHERE "organizationId" = $1 ORDER BY "days" ASC',
    [organizationId]
  );
  return result?.rows ?? [];
}

export async function findDefault(organizationId: string): Promise<PaymentTerms | null> {
  return queryOne<PaymentTerms>(
    'SELECT * FROM "paymentTerms" WHERE "organizationId" = $1 AND "isDefault" = true',
    [organizationId]
  );
}

export async function setDefault(paymentTermsId: string): Promise<boolean> {
  const terms = await findById(paymentTermsId);
  if (!terms) return false;

  // Unset other defaults
  await query(
    'UPDATE "paymentTerms" SET "isDefault" = false WHERE "organizationId" = $1',
    [terms.organizationId]
  );

  // Set this one as default
  const result = await query<{ rowCount: number }>(
    'UPDATE "paymentTerms" SET "isDefault" = true, "updatedAt" = $1 WHERE "paymentTermsId" = $2',
    [new Date(), paymentTermsId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function calculateDueDate(
  paymentTermsId: string,
  invoiceDate: Date
): Promise<{ dueDate: Date; discountDate?: Date; discountPercentage?: number }> {
  const terms = await findById(paymentTermsId);
  if (!terms) {
    throw new Error(`Payment terms not found: ${paymentTermsId}`);
  }

  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + terms.days);

  const result: { dueDate: Date; discountDate?: Date; discountPercentage?: number } = { dueDate };

  if (terms.discountPercentage && terms.discountDays) {
    const discountDate = new Date(invoiceDate);
    discountDate.setDate(discountDate.getDate() + terms.discountDays);
    result.discountDate = discountDate;
    result.discountPercentage = terms.discountPercentage;
  }

  return result;
}

export default {
  create,
  findById,
  findByCode,
  findByOrganization,
  findDefault,
  setDefault,
  calculateDueDate,
};
