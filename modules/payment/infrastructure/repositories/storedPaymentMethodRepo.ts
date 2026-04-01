import { query, queryOne } from '../../../../libs/db';

export interface StoredPaymentMethod {
  storedPaymentMethodId: string;
  customerId: string;
  merchantId: string;
  type: string;
  provider: string;
  providerToken: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export async function findByCustomer(customerId: string): Promise<StoredPaymentMethod[]> {
  return (
    (await query<StoredPaymentMethod[]>(
      `SELECT * FROM "storedPaymentMethod" WHERE "customerId" = $1 AND "deletedAt" IS NULL ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [customerId],
    )) || []
  );
}

export async function findById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
  return queryOne<StoredPaymentMethod>(
    `SELECT * FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1 AND "deletedAt" IS NULL`,
    [storedPaymentMethodId],
  );
}

export async function create(
  params: Omit<StoredPaymentMethod, 'storedPaymentMethodId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
): Promise<StoredPaymentMethod | null> {
  const now = new Date();
  return queryOne<StoredPaymentMethod>(
    `INSERT INTO "storedPaymentMethod" ("customerId", "merchantId", type, provider, "providerToken", last4, brand, "expiryMonth", "expiryYear", "isDefault", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      params.customerId,
      params.merchantId,
      params.type,
      params.provider,
      params.providerToken,
      params.last4 || null,
      params.brand || null,
      params.expiryMonth || null,
      params.expiryYear || null,
      params.isDefault,
      now,
      now,
    ],
  );
}

export async function setDefault(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null> {
  const now = new Date();
  await query(
    `UPDATE "storedPaymentMethod" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "deletedAt" IS NULL`,
    [now, customerId],
  );
  return queryOne<StoredPaymentMethod>(
    `UPDATE "storedPaymentMethod" SET "isDefault" = true, "updatedAt" = $1 WHERE "storedPaymentMethodId" = $2 RETURNING *`,
    [now, storedPaymentMethodId],
  );
}

export async function softDelete(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
  return queryOne<StoredPaymentMethod>(
    `UPDATE "storedPaymentMethod" SET "deletedAt" = $1, "updatedAt" = $1 WHERE "storedPaymentMethodId" = $2 RETURNING *`,
    [new Date(), storedPaymentMethodId],
  );
}

export default { findByCustomer, findById, create, setDefault, softDelete };
