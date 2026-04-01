import { query, queryOne } from '../../../../libs/db';

export interface PaymentPlan {
  paymentPlanId: string;
  name: string;
  description?: string;
  installments: number;
  intervalDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findAll(): Promise<PaymentPlan[]> {
  return (
    (await query<PaymentPlan[]>(
      `SELECT * FROM "paymentPlan" ORDER BY "createdAt" DESC`,
      [],
    )) || []
  );
}

export async function findById(paymentPlanId: string): Promise<PaymentPlan | null> {
  return queryOne<PaymentPlan>(
    `SELECT * FROM "paymentPlan" WHERE "paymentPlanId" = $1`,
    [paymentPlanId],
  );
}

export async function create(
  params: Omit<PaymentPlan, 'paymentPlanId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentPlan | null> {
  const now = new Date();
  return queryOne<PaymentPlan>(
    `INSERT INTO "paymentPlan" (name, description, installments, "intervalDays", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.name, params.description || null, params.installments, params.intervalDays, params.isActive, now, now],
  );
}

export async function update(
  paymentPlanId: string,
  params: Partial<Omit<PaymentPlan, 'paymentPlanId' | 'createdAt' | 'updatedAt'>>,
): Promise<PaymentPlan | null> {
  return queryOne<PaymentPlan>(
    `UPDATE "paymentPlan" SET name = COALESCE($1, name), description = COALESCE($2, description),
     installments = COALESCE($3, installments), "intervalDays" = COALESCE($4, "intervalDays"),
     "isActive" = COALESCE($5, "isActive"), "updatedAt" = $6
     WHERE "paymentPlanId" = $7 RETURNING *`,
    [params.name || null, params.description || null, params.installments || null, params.intervalDays || null, params.isActive ?? null, new Date(), paymentPlanId],
  );
}

export default { findAll, findById, create, update };
