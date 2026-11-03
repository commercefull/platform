/**
 * VAT Registration Repository
 * Handles CRUD operations for merchant VAT registrations
 */

import { query, queryOne } from '../../../../libs/db';
import type { TaxVatRegistration as DbTaxVatRegistration, TaxVatValidationLog as DbTaxVatValidationLog } from '../../../../libs/db/types';

// ============================================================================
// Table Constants
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export type VatRegistrationType = 'standard' | 'oss' | 'ioss' | 'moss' | 'non_union' | 'distance_selling';

export type VatRegistration = DbTaxVatRegistration;

export type VatValidationLog = DbTaxVatValidationLog;

// ============================================================================
// VAT Registration CRUD
// ============================================================================

export async function getVatRegistration(vatRegistrationId: string): Promise<VatRegistration | null> {
  const row = await queryOne<DbTaxVatRegistration>('SELECT * FROM "taxVatRegistration" WHERE "vatRegistrationId" = $1', [
    vatRegistrationId,
  ]);
  return row ? mapToVatRegistration(row) : null;
}

export async function getVatRegistrationsByMerchant(organizationId: string): Promise<VatRegistration[]> {
  const rows = await query<DbTaxVatRegistration[]>(
    'SELECT * FROM "taxVatRegistration" WHERE "organizationId" = $1 ORDER BY "countryCode" ASC',
    [organizationId],
  );
  return (rows || []).map(mapToVatRegistration);
}

export async function getVatRegistrationByCountry(organizationId: string, countryCode: string): Promise<VatRegistration | null> {
  const row = await queryOne<DbTaxVatRegistration>(
    'SELECT * FROM "taxVatRegistration" WHERE "organizationId" = $1 AND "countryCode" = $2 AND "isActive" = true',
    [organizationId, countryCode],
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function getActiveOssRegistration(organizationId: string): Promise<VatRegistration | null> {
  const row = await queryOne<DbTaxVatRegistration>(
    `SELECT * FROM "taxVatRegistration" 
     WHERE "organizationId" = $1 AND "registrationType" = 'oss' AND "isActive" = true`,
    [organizationId],
  );
  return row ? mapToVatRegistration(row) : null;
}

// `||`-style defaulting kept out of the save params to keep complexity low.
function fallback<T, D>(value: T | undefined | null, defaultValue: D): T | D {
  return value || defaultValue;
}
function isoOpt(value: Date | string | null | undefined): string | undefined {
  return value instanceof Date ? value.toISOString() : (value ?? undefined);
}

function vatUpdateValues(data: Partial<VatRegistration> & { organizationId: string; countryCode: string; vatNumber: string }): unknown[] {
  return [
    data.vatNumber,
    data.tradingName,
    data.legalName,
    fallback(data.registrationType, 'standard'),
    fallback(data.isVerified, false),
    isoOpt(data.verifiedAt),
    data.verificationSource,
    isoOpt(data.registrationDate),
    isoOpt(data.deregistrationDate),
    isoOpt(data.effectiveFrom),
    isoOpt(data.effectiveUntil),
    data.annualThresholdCents,
    fallback(data.thresholdCurrency, 'EUR'),
    data.currentYearSalesCents,
    fallback(data.thresholdExceeded, false),
    data.isActive !== false,
    data.notes,
    data.certificateUrl,
  ];
}

export async function saveVatRegistration(
  data: Partial<VatRegistration> & {
    organizationId: string;
    countryCode: string;
    vatNumber: string;
  },
): Promise<VatRegistration> {
  const now = new Date().toISOString();

  if (data.vatRegistrationId) {
    // Update existing
    await query(
      `UPDATE "taxVatRegistration" SET
        "vatNumber" = $1, "tradingName" = $2, "legalName" = $3, "registrationType" = $4,
        "isVerified" = $5, "verifiedAt" = $6, "verificationSource" = $7,
        "registrationDate" = $8, "deregistrationDate" = $9, "effectiveFrom" = $10, "effectiveUntil" = $11,
        "annualThresholdCents" = $12, "thresholdCurrency" = $13, "currentYearSalesCents" = $14, "thresholdExceeded" = $15,
        "isActive" = $16, "notes" = $17, "certificateUrl" = $18, "updatedAt" = $19
      WHERE "vatRegistrationId" = $20`,
      [...vatUpdateValues(data), now, data.vatRegistrationId],
    );
    return (await getVatRegistration(data.vatRegistrationId))!;
  } else {
    // Insert new
    const result = await queryOne<DbTaxVatRegistration>(
      `INSERT INTO "taxVatRegistration" (
        "organizationId", "countryCode", "vatNumber", "tradingName", "legalName", "registrationType",
        "isVerified", "registrationDate", "effectiveFrom",
        "annualThresholdCents", "thresholdCurrency", "currentYearSalesCents", "thresholdExceeded",
        "isActive", "notes", "certificateUrl", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.organizationId,
        data.countryCode,
        data.vatNumber,
        data.tradingName,
        data.legalName,
        fallback(data.registrationType, 'standard'),
        false,
        data.registrationDate?.toISOString(),
        data.effectiveFrom?.toISOString(),
        data.annualThresholdCents,
        fallback(data.thresholdCurrency, 'EUR'),
        fallback(data.currentYearSalesCents, 0),
        false,
        true,
        data.notes,
        data.certificateUrl,
        now,
        now,
      ],
    );
    return mapToVatRegistration(result!);
  }
}

export async function deleteVatRegistration(vatRegistrationId: string): Promise<void> {
  await query('DELETE FROM "taxVatRegistration" WHERE "vatRegistrationId" = $1', [vatRegistrationId]);
}

export async function deactivateVatRegistration(vatRegistrationId: string): Promise<void> {
  await query(
    `UPDATE "taxVatRegistration" SET "isActive" = false, "deregistrationDate" = $1, "updatedAt" = $1
     WHERE "vatRegistrationId" = $2`,
    [new Date().toISOString(), vatRegistrationId],
  );
}

// ============================================================================
// VAT Validation
// ============================================================================

export async function logVatValidation(data: Omit<VatValidationLog, 'vatValidationLogId' | 'createdAt'>): Promise<VatValidationLog> {
  const now = new Date().toISOString();

  const result = await queryOne<DbTaxVatValidationLog>(
    `INSERT INTO "taxVatValidationLog" (
      "customerId", "organizationId", "orderId", "vatNumber", "countryCode", "vatNumberFormatted",
      "isValid", "validationStatus", "validationSource", "requestId", "response",
      "companyName", "companyAddress", "companyCity", "companyPostalCode",
      "validatedAt", "responseTimeMs", "expiresAt", "reverseChargeApplicable",
      "ipAddress", "context", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      data.customerId,
      data.organizationId,
      data.orderId,
      data.vatNumber,
      data.countryCode,
      data.vatNumberFormatted,
      data.isValid,
      data.validationStatus,
      data.validationSource,
      data.requestId,
      data.response ? JSON.stringify(data.response) : null,
      data.companyName,
      data.companyAddress,
      data.companyCity,
      data.companyPostalCode,
      data.validatedAt.toISOString(),
      data.responseTimeMs,
      data.expiresAt?.toISOString(),
      data.reverseChargeApplicable || false,
      data.ipAddress,
      data.context,
      now,
    ],
  );

  return mapToVatValidationLog(result!);
}

export async function getRecentValidation(
  vatNumber: string,
  countryCode: string,
  maxAgeHours: number = 24,
): Promise<VatValidationLog | null> {
  const row = await queryOne<DbTaxVatValidationLog>(
    `SELECT * FROM "taxVatValidationLog" 
     WHERE "vatNumber" = $1 AND "countryCode" = $2 
     AND "validatedAt" > NOW() - INTERVAL '${maxAgeHours} hours'
     AND "isValid" IS NOT NULL
     ORDER BY "validatedAt" DESC LIMIT 1`,
    [vatNumber, countryCode],
  );
  return row ? mapToVatValidationLog(row) : null;
}

export async function getValidationHistory(vatNumber: string, limit: number = 10): Promise<VatValidationLog[]> {
  const rows = await query<DbTaxVatValidationLog[]>(
    `SELECT * FROM "taxVatValidationLog" 
     WHERE "vatNumber" = $1
     ORDER BY "validatedAt" DESC LIMIT $2`,
    [vatNumber, limit],
  );
  return (rows || []).map(mapToVatValidationLog);
}

// VAT helpers live in domain — re-exported for existing importers.
export { extractCountryFromVat, formatVatNumber, validateVatNumberFormat } from '../../domain/vatFormat';

// ============================================================================
// Helpers
// ============================================================================

function mapToVatRegistration(row: Record<string, unknown>): VatRegistration {
  return {
    vatRegistrationId: row.vatRegistrationId as string,
    organizationId: row.organizationId as string,
    countryCode: row.countryCode as string,
    vatNumber: row.vatNumber as string,
    tradingName: row.tradingName as string | null,
    legalName: row.legalName as string | null,
    registrationType: row.registrationType as VatRegistrationType,
    isVerified: Boolean(row.isVerified),
    verifiedAt: row.verifiedAt ? new Date(row.verifiedAt as string) : null,
    verificationSource: row.verificationSource as string | null,
    verificationRequestId: row.verificationRequestId as string | null,
    verificationResponse: row.verificationResponse as Record<string, unknown> | null,
    registrationDate: row.registrationDate ? new Date(row.registrationDate as string) : null,
    deregistrationDate: row.deregistrationDate ? new Date(row.deregistrationDate as string) : null,
    effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom as string) : null,
    effectiveUntil: row.effectiveUntil ? new Date(row.effectiveUntil as string) : null,
    annualThresholdCents: row.annualThresholdCents ? parseFloat(row.annualThresholdCents as string) : null,
    thresholdCurrency: row.thresholdCurrency as string | null,
    currentYearSalesCents: row.currentYearSalesCents ? parseFloat(row.currentYearSalesCents as string) : null,
    thresholdExceeded: Boolean(row.thresholdExceeded),
    isActive: Boolean(row.isActive),
    notes: row.notes as string | null,
    certificateUrl: row.certificateUrl as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function mapToVatValidationLog(row: Record<string, unknown>): VatValidationLog {
  return {
    vatValidationLogId: row.vatValidationLogId as string,
    customerId: row.customerId as string | null,
    organizationId: row.organizationId as string | null,
    orderId: row.orderId as string | null,
    vatNumber: row.vatNumber as string,
    countryCode: row.countryCode as string,
    vatNumberFormatted: row.vatNumberFormatted as string | null,
    isValid: row.isValid as boolean | null,
    validationStatus: row.validationStatus as VatValidationLog['validationStatus'],
    validationSource: row.validationSource as VatValidationLog['validationSource'],
    requestId: row.requestId as string | null,
    response: row.response as Record<string, unknown> | null,
    companyName: row.companyName as string | null,
    companyAddress: row.companyAddress as string | null,
    companyCity: row.companyCity as string | null,
    companyPostalCode: row.companyPostalCode as string | null,
    validatedAt: new Date(row.validatedAt as string),
    responseTimeMs: row.responseTimeMs as number | null,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : null,
    reverseChargeApplicable: Boolean(row.reverseChargeApplicable),
    ipAddress: row.ipAddress as string | null,
    context: row.context as string | null,
    createdAt: new Date(row.createdAt as string),
  };
}
