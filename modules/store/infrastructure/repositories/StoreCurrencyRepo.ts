/**
 * StoreCurrency Repository Implementation
 * PostgreSQL persistence for store currency membership.
 */

import { query, queryOne, withTransaction, type TxClient } from '../../../../libs/db';
import { StoreCurrency, type StoreCurrencyProps } from '../../domain/entities/StoreCurrency';
import type { StoreCurrencyRepository } from '../../domain/repositories/StoreCurrencyRepository';
import { StoreValidationError } from '../../domain/errors/StoreErrors';

interface StoreCurrencyRow {
  storeCurrencyId: string;
  storeId: string;
  currencyId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  code?: string;
}

export class StoreCurrencyRepo implements StoreCurrencyRepository {
  async findByStore(storeId: string): Promise<StoreCurrency[]> {
    const rows = await query<StoreCurrencyRow[]>(
      `SELECT sc.*, c.code FROM "storeCurrency" sc
       JOIN currency c ON c."currencyId" = sc."currencyId"
       WHERE sc."storeId" = $1
       ORDER BY sc."isDefault" DESC, c.code ASC`,
      [storeId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findActiveByStore(storeId: string): Promise<StoreCurrency[]> {
    const rows = await query<StoreCurrencyRow[]>(
      `SELECT sc.*, c.code FROM "storeCurrency" sc
       JOIN currency c ON c."currencyId" = sc."currencyId"
       WHERE sc."storeId" = $1 AND sc."isActive" = true AND c."isActive" = true
       ORDER BY sc."isDefault" DESC, c.code ASC`,
      [storeId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findDefault(storeId: string): Promise<StoreCurrency | null> {
    const row = await queryOne<StoreCurrencyRow>(
      `SELECT sc.*, c.code FROM "storeCurrency" sc
       JOIN currency c ON c."currencyId" = sc."currencyId"
       WHERE sc."storeId" = $1 AND sc."isDefault" = true`,
      [storeId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async getSupportedCodes(storeId: string): Promise<string[]> {
    const rows = await query<{ code: string }[]>(
      `SELECT c.code FROM "storeCurrency" sc
       JOIN currency c ON c."currencyId" = sc."currencyId"
       WHERE sc."storeId" = $1 AND sc."isActive" = true AND c."isActive" = true
       ORDER BY c.code`,
      [storeId],
    );
    return (rows || []).map(row => row.code);
  }

  async getDefaultCode(storeId: string): Promise<string | null> {
    const row = await queryOne<{ code: string }>(
      `SELECT c.code FROM "storeCurrency" sc
       JOIN currency c ON c."currencyId" = sc."currencyId"
       WHERE sc."storeId" = $1 AND sc."isDefault" = true`,
      [storeId],
    );
    return row?.code ?? null;
  }

  async add(storeId: string, currencyCode: string, options?: { isDefault?: boolean }): Promise<StoreCurrency> {
    const currencyId = await this.lookupCurrencyId(currencyCode);
    const row = await queryOne<StoreCurrencyRow>(
      `INSERT INTO "storeCurrency" ("storeId", "currencyId", "isDefault", "isActive")
       VALUES ($1, $2, $3, true)
       ON CONFLICT ("storeId", "currencyId") DO UPDATE SET "isActive" = true, "updatedAt" = now()
       RETURNING *`,
      [storeId, currencyId, options?.isDefault ?? false],
    );
    if (options?.isDefault) {
      await this.setDefault(storeId, currencyCode);
    }
    return this.mapToEntity({ ...row!, code: currencyCode });
  }

  async remove(storeId: string, currencyCode: string): Promise<void> {
    const currencyId = await this.lookupCurrencyId(currencyCode);
    await query(`DELETE FROM "storeCurrency" WHERE "storeId" = $1 AND "currencyId" = $2`, [storeId, currencyId]);
  }

  async setDefault(storeId: string, currencyCode: string): Promise<void> {
    const currencyId = await this.lookupCurrencyId(currencyCode);
    await withTransaction(async tx => {
      const updated = await tx.query<{ storeCurrencyId: string }[]>(
        `UPDATE "storeCurrency" SET "isDefault" = true, "updatedAt" = now()
         WHERE "storeId" = $1 AND "currencyId" = $2
         RETURNING "storeCurrencyId"`,
        [storeId, currencyId],
      );
      if (!updated?.length) {
        throw new StoreValidationError(`Currency '${currencyCode}' is not supported by store '${storeId}'`);
      }
      await tx.query(`UPDATE "storeCurrency" SET "isDefault" = false, "updatedAt" = now() WHERE "storeId" = $1 AND "currencyId" <> $2`, [
        storeId,
        currencyId,
      ]);
    });
  }

  async replaceAll(storeId: string, currencyCodes: string[], defaultCode?: string): Promise<void> {
    if (!currencyCodes.length) {
      throw new StoreValidationError('A store must support at least one currency');
    }
    const defaultCurrency = defaultCode ?? currencyCodes[0];
    if (!currencyCodes.includes(defaultCurrency)) {
      throw new StoreValidationError(`Default currency '${defaultCurrency}' must be one of the supported currencies`);
    }

    await withTransaction(async tx => {
      await tx.query(`DELETE FROM "storeCurrency" WHERE "storeId" = $1`, [storeId]);
      for (const code of currencyCodes) {
        const currencyId = await this.lookupCurrencyId(code, tx);
        await tx.query(
          `INSERT INTO "storeCurrency" ("storeId", "currencyId", "isDefault", "isActive")
           VALUES ($1, $2, $3, true)`,
          [storeId, currencyId, code === defaultCurrency],
        );
      }
    });
  }

  private async lookupCurrencyId(currencyCode: string, tx?: TxClient): Promise<string> {
    const sql = `SELECT "currencyId" FROM currency WHERE code = $1`;
    const row = tx
      ? await tx.queryOne<{ currencyId: string }>(sql, [currencyCode])
      : await queryOne<{ currencyId: string }>(sql, [currencyCode]);
    if (!row) {
      throw new StoreValidationError(`Unknown currency code '${currencyCode}'`);
    }
    return row.currencyId;
  }

  private mapToEntity(row: StoreCurrencyRow): StoreCurrency {
    const props: StoreCurrencyProps = {
      storeCurrencyId: row.storeCurrencyId,
      storeId: row.storeId,
      currencyId: row.currencyId,
      currencyCode: row.code,
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
    return StoreCurrency.reconstitute(props);
  }
}

export default new StoreCurrencyRepo();
