import { query, queryOne } from '../../../../libs/db';

export interface MerchantVerificationDocument {
  merchantVerificationDocumentId: string;
  merchantId: string;
  documentType: string;
  fileUrl: string;
  status: string;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<MerchantVerificationDocument[]> {
  return (await query<MerchantVerificationDocument[]>(
    `SELECT * FROM "merchantVerificationDocument" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC`,
    [merchantId],
  )) || [];
}

export async function create(params: Omit<MerchantVerificationDocument, 'merchantVerificationDocumentId' | 'createdAt' | 'updatedAt'>): Promise<MerchantVerificationDocument | null> {
  const now = new Date();
  return queryOne<MerchantVerificationDocument>(
    `INSERT INTO "merchantVerificationDocument" ("merchantId", "documentType", "fileUrl", status, "reviewedAt", "reviewNote", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [params.merchantId, params.documentType, params.fileUrl, params.status || 'pending', params.reviewedAt || null, params.reviewNote || null, now, now],
  );
}

export async function updateStatus(merchantVerificationDocumentId: string, status: string, reviewNote?: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE "merchantVerificationDocument" SET status = $1, "reviewedAt" = $2, "reviewNote" = $3, "updatedAt" = $4 WHERE "merchantVerificationDocumentId" = $5`,
    [status, now, reviewNote || null, now, merchantVerificationDocumentId],
  );
}

export default { findByMerchant, create, updateStatus };
