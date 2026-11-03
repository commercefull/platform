import { query, queryOne } from '../../../../libs/db';
import type { EnabledPaymentMethod, PaymentGatewayConfigRepository } from '../../domain/repositories/PaymentGatewayConfigRepository';
import type { PaymentGateway as DbPaymentGateway, PaymentMethodConfig as DbPaymentMethodConfig } from '../../../../libs/db/types';

class PaymentGatewayConfigRepo implements PaymentGatewayConfigRepository {
  async getEnabledPaymentMethods(organizationId: string, currency?: string): Promise<EnabledPaymentMethod[]> {
    const conditions = ['"isEnabled" = true', '"deletedAt" IS NULL'];
    const params: unknown[] = [];

    if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
      conditions.push(`"organizationId" = $${params.length + 1}`);
      params.push(organizationId);
    }

    if (currency) {
      conditions.push(`("supportedCurrencies" IS NULL OR $${params.length + 1} = ANY("supportedCurrencies"))`);
      params.push(currency);
    }

    const sql = `SELECT * FROM "paymentMethodConfig" WHERE ${conditions.join(' AND ')} ORDER BY "displayOrder" ASC`;

    const rows = await query<DbPaymentMethodConfig[]>(sql, params);
    return (rows || []).map(row => ({
      paymentMethodConfigId: row.paymentMethodConfigId,
      paymentMethod: row.paymentMethod,
      displayName: row.displayName || row.paymentMethod,
      description: row.description || undefined,
      icon: row.icon || undefined,
      processingFeeCents: row.processingFeeCents ? Number(row.processingFeeCents) : undefined,
    }));
  }

  async getDefaultGateway(organizationId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null> {
    const orgGateway =
      organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)
        ? await queryOne<DbPaymentGateway>(
            'SELECT * FROM "paymentGateway" WHERE "organizationId" = $1 AND "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL',
            [organizationId],
          )
        : null;

    const row =
      orgGateway ??
      (await queryOne<DbPaymentGateway>(
        'SELECT * FROM "paymentGateway" WHERE "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1',
      )) ??
      (await queryOne<DbPaymentGateway>(
        'SELECT * FROM "paymentGateway" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1',
      ));

    if (!row) return null;
    return { gatewayId: row.paymentGatewayId, provider: row.provider, isTestMode: Boolean(row.isTestMode) };
  }
}

export default new PaymentGatewayConfigRepo();
