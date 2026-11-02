import { queryOne, query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { CustomerPrice, CustomerPriceList, PricingAdjustmentType, PricingRuleStatus } from '../../domain/pricingRule';
import { FailedToCreatePricingError, PriceListNotFoundError, PriceNotFoundError } from '../../domain/errors/PricingErrors';
import type {
  CustomerPriceList as DbCustomerPriceList,
  CustomerPrice as DbCustomerPrice,
  PricingPriceList as DbPricingPriceList,
} from '../../../../libs/db/types';

/**
 * Customer Price Repository
 *
 * Uses camelCase for table and column names as per platform convention.
 * CustomerPriceList is an aggregate: pricingPriceList row + customerPriceList link rows.
 */
function rowToCustomerPrice(row: DbCustomerPrice): CustomerPrice {
  return {
    id: row.customerPriceId,
    priceListId: row.priceListId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    adjustmentType: row.adjustmentType as PricingAdjustmentType,
    adjustmentValue: Number(row.adjustmentValue),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToPriceList(row: DbPricingPriceList, links: DbCustomerPriceList[]): CustomerPriceList {
  const now = new Date();
  const status = !row.isActive
    ? PricingRuleStatus.INACTIVE
    : row.startDate && row.startDate > now
      ? PricingRuleStatus.SCHEDULED
      : row.endDate && row.endDate < now
        ? PricingRuleStatus.EXPIRED
        : PricingRuleStatus.ACTIVE;
  return {
    id: row.priceListId,
    priceListId: row.priceListId,
    name: row.name,
    description: row.description ?? undefined,
    customerIds: links.map(l => l.customerId).filter((v): v is string => v !== null),
    customerGroupIds: links.map(l => l.customerGroupId).filter((v): v is string => v !== null),
    priority: row.priority ?? 0,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    organizationId: row.organizationId ?? undefined,
  };
}

class CustomerPriceRepo {
  private readonly priceListTable = Table.PricingPriceList;
  private readonly customerPriceListTable = Table.CustomerPriceList;
  private readonly customerPriceTable = Table.CustomerPrice;

  private async findPriceListLinks(priceListIds: string[]): Promise<DbCustomerPriceList[]> {
    if (priceListIds.length === 0) return [];
    return (
      (await query<DbCustomerPriceList[]>(`SELECT * FROM "${this.customerPriceListTable}" WHERE "priceListId" = ANY($1)`, [
        priceListIds,
      ])) || []
    );
  }

  private async insertPriceListLinks(priceListId: string, customerIds?: string[], customerGroupIds?: string[]): Promise<void> {
    const now = new Date();
    for (const customerId of customerIds ?? []) {
      await query(
        `INSERT INTO "${this.customerPriceListTable}" ("priceListId", "customerId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $3)`,
        [priceListId, customerId, now],
      );
    }
    for (const customerGroupId of customerGroupIds ?? []) {
      await query(
        `INSERT INTO "${this.customerPriceListTable}" ("priceListId", "customerGroupId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $3)`,
        [priceListId, customerGroupId, now],
      );
    }
  }

  /**
   * Find a price list by ID
   */
  async findPriceListById(id: string): Promise<CustomerPriceList | null> {
    const row = await queryOne<DbPricingPriceList>(`SELECT * FROM "${this.priceListTable}" WHERE "priceListId" = $1`, [id]);
    if (!row) return null;
    const links = await this.findPriceListLinks([id]);
    return rowToPriceList(row, links);
  }

  /**
   * Find price lists by customer
   */
  async findPriceListsForCustomer(customerId: string, customerGroupIds?: string[]): Promise<CustomerPriceList[]> {
    const now = new Date();

    const conditions = [
      `pl."isActive" = true`,
      `(pl."startDate" IS NULL OR pl."startDate" <= $1)`,
      `(pl."endDate" IS NULL OR pl."endDate" >= $1)`,
    ];
    const params: unknown[] = [now, customerId];
    let linkCondition = `cpl."customerId" = $2`;

    if (customerGroupIds && customerGroupIds.length > 0) {
      params.push(customerGroupIds);
      linkCondition += ` OR cpl."customerGroupId" = ANY($3)`;
    }

    const sql = `
      SELECT DISTINCT pl.* FROM "${this.priceListTable}" pl
      JOIN "${this.customerPriceListTable}" cpl ON cpl."priceListId" = pl."priceListId"
      WHERE ${conditions.join(' AND ')} AND (${linkCondition})
      ORDER BY pl."priority" DESC, pl."createdAt" ASC
    `;

    const rows = (await query<DbPricingPriceList[]>(sql, params)) || [];
    const links = await this.findPriceListLinks(rows.map(r => r.priceListId));
    return rows.map(row =>
      rowToPriceList(
        row,
        links.filter(l => l.priceListId === row.priceListId),
      ),
    );
  }

  /**
   * Create a new price list
   */
  async createPriceList(priceList: Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPriceList> {
    const now = new Date();

    const sql = `
      INSERT INTO "${this.priceListTable}" (
        "name", "description", "priority", "isActive", "startDate", "endDate", "organizationId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      priceList.name,
      priceList.description || null,
      priceList.priority || 0,
      priceList.status ? priceList.status === PricingRuleStatus.ACTIVE : true,
      priceList.startDate || null,
      priceList.endDate || null,
      priceList.organizationId || null,
      now,
      now,
    ];

    const result = await queryOne<DbPricingPriceList>(sql, values);

    if (!result) {
      throw new FailedToCreatePricingError('Failed to create price list');
    }

    await this.insertPriceListLinks(result.priceListId, priceList.customerIds, priceList.customerGroupIds);
    const links = await this.findPriceListLinks([result.priceListId]);
    return rowToPriceList(result, links);
  }

  /**
   * Update a price list
   */
  async updatePriceList(
    id: string,
    priceList: Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<CustomerPriceList> {
    const now = new Date();

    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: unknown[] = [id, now];
    let paramIndex = 3;

    const columnMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      priority: 'priority',
      startDate: 'startDate',
      endDate: 'endDate',
      organizationId: 'organizationId',
    };
    if (priceList.status !== undefined) {
      setStatements.push(`"isActive" = $${paramIndex}`);
      values.push(priceList.status === PricingRuleStatus.ACTIVE);
      paramIndex++;
    }

    for (const [key, value] of Object.entries(priceList)) {
      if (value === undefined || !(key in columnMap)) continue;
      setStatements.push(`"${columnMap[key]}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    const sql = `
      UPDATE "${this.priceListTable}"
      SET ${setStatements.join(', ')}
      WHERE "priceListId" = $1
      RETURNING *
    `;

    const result = await queryOne<DbPricingPriceList>(sql, values);

    if (!result) {
      throw new PriceListNotFoundError(id);
    }

    if (priceList.customerIds !== undefined || priceList.customerGroupIds !== undefined) {
      await query(`DELETE FROM "${this.customerPriceListTable}" WHERE "priceListId" = $1`, [id]);
      await this.insertPriceListLinks(id, priceList.customerIds, priceList.customerGroupIds);
    }

    const links = await this.findPriceListLinks([id]);
    return rowToPriceList(result, links);
  }

  /**
   * Delete a price list
   */
  async deletePriceList(id: string): Promise<boolean> {
    await query(`DELETE FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`, [id]);
    await query(`DELETE FROM "${this.customerPriceListTable}" WHERE "priceListId" = $1`, [id]);

    const sql = `DELETE FROM "${this.priceListTable}" WHERE "priceListId" = $1`;
    const result = await query(sql, [id]);

    return result !== null;
  }

  /**
   * Find a specific customer price by ID
   */
  async findPriceById(id: string): Promise<CustomerPrice | null> {
    const sql = `SELECT * FROM "${this.customerPriceTable}" WHERE "customerPriceId" = $1`;
    const row = await queryOne<DbCustomerPrice>(sql, [id]);
    return row ? rowToCustomerPrice(row) : null;
  }

  /**
   * Find customer prices by price list ID
   */
  async findPricesByPriceListId(priceListId: string): Promise<CustomerPrice[]> {
    const sql = `SELECT * FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`;
    const rows = (await query<DbCustomerPrice[]>(sql, [priceListId])) || [];
    return rows.map(rowToCustomerPrice);
  }

  /**
   * Find customer prices by product ID
   */
  async findPricesForProduct(productId: string, variantId?: string, customerPriceLists?: string[]): Promise<CustomerPrice[]> {
    const conditions = [`"productId" = $1`];
    const params: unknown[] = [productId];

    if (variantId) {
      params.push(variantId);
      conditions.push(`("productVariantId" = $${params.length} OR "productVariantId" IS NULL)`);
    }

    if (customerPriceLists && customerPriceLists.length > 0) {
      const placeholders = customerPriceLists.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...customerPriceLists);
      conditions.push(`"priceListId" IN (${placeholders})`);
    }

    const sql = `
      SELECT * FROM "${this.customerPriceTable}"
      WHERE ${conditions.join(' AND ')}
    `;

    const rows = (await query<DbCustomerPrice[]>(sql, params)) || [];
    return rows.map(rowToCustomerPrice);
  }

  /**
   * Create a new customer price
   */
  async createPrice(customerPrice: Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPrice> {
    const sql = `
      INSERT INTO "${this.customerPriceTable}" (
        "priceListId", "productId", "productVariantId", "adjustmentType", "adjustmentValue"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      customerPrice.priceListId,
      customerPrice.productId,
      customerPrice.variantId || (customerPrice as CustomerPrice & { productVariantId?: string }).productVariantId || null,
      customerPrice.adjustmentType,
      customerPrice.adjustmentValue,
    ];

    const result = await queryOne<DbCustomerPrice>(sql, values);

    if (!result) {
      throw new FailedToCreatePricingError('Failed to create customer price');
    }

    return rowToCustomerPrice(result);
  }

  /**
   * Update a customer price
   */
  async updatePrice(id: string, customerPrice: Partial<Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerPrice> {
    const now = new Date();

    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: unknown[] = [id, now];
    let paramIndex = 3;

    const columnMap: Record<string, string> = {
      priceListId: 'priceListId',
      productId: 'productId',
      variantId: 'productVariantId',
      productVariantId: 'productVariantId',
      adjustmentType: 'adjustmentType',
      adjustmentValue: 'adjustmentValue',
    };
    for (const [key, value] of Object.entries(customerPrice)) {
      if (value === undefined || !(key in columnMap)) continue;
      setStatements.push(`"${columnMap[key]}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    const sql = `
      UPDATE "${this.customerPriceTable}"
      SET ${setStatements.join(', ')}
      WHERE "customerPriceId" = $1
      RETURNING *
    `;

    const result = await queryOne<DbCustomerPrice>(sql, values);

    if (!result) {
      throw new PriceNotFoundError(id);
    }

    return rowToCustomerPrice(result);
  }

  /**
   * Delete a customer price
   */
  async deletePrice(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.customerPriceTable}" WHERE "customerPriceId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  /**
   * Delete all prices for a price list
   */
  async deletePricesForPriceList(priceListId: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.customerPriceTable}" WHERE "priceListId" = $1`;
    const result = await query(sql, [priceListId]);
    return result !== null;
  }
}

export default new CustomerPriceRepo();
