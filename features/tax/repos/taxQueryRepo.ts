import { query, queryOne } from '../../../libs/db';
import { 
  TaxZone, TaxRate, TaxCategory, CustomerTaxExemption,
  TaxSettings, AddressInput, TaxCalculationResult,
  TaxBreakdownItem, LineItemTax
} from '../taxTypes';

/**
 * Repository for tax-related read operations only
 * Following the Command Query Responsibility Segregation (CQRS) pattern
 */
export class TaxQueryRepo {
  // Tax Rate query methods
  async findTaxRateById(id: string): Promise<TaxRate | null> {
    return await queryOne<TaxRate>(
      `SELECT 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice", 
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_rate" 
      WHERE "id" = $1`,
      [id]
    );
  }

  async findAllTaxRates(
    status: TaxRate['isActive'] = true,
    country?: string,
    region?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxRate[]> {
    const params: any[] = [status];
    
    let sql = `
      SELECT 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice", 
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_rate" 
      WHERE "is_active" = $1
    `;
    
    if (country) {
      sql += ` AND "tax_zone_id" IN (
        SELECT "id" FROM "public"."tax_zone" 
        WHERE "countries" @> ARRAY[$${params.length + 1}]::varchar(2)[]
      )`;
      params.push(country);
    }
    
    if (region) {
      sql += ' AND "region" = $' + (params.length + 1);
      params.push(region);
    }
    
    sql += ' ORDER BY "priority" DESC, "name" ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    return await query<TaxRate[]>(sql, params) || [];
  }

  async findTaxRatesByCategory(categoryId: string): Promise<TaxRate[]> {
    return await query<TaxRate[]>(
      `SELECT 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice",
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_rate" 
      WHERE "tax_category_id" = $1 
      AND "is_active" = TRUE`,
      [categoryId]
    ) || [];
  }

  // Tax Category query methods
  async findTaxCategoryById(id: string): Promise<TaxCategory | null> {
    return await queryOne<TaxCategory>(
      `SELECT 
        id,
        name,
        description,
        code,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_category" 
      WHERE "id" = $1`,
      [id]
    );
  }

  async findTaxCategoryByCode(code: string): Promise<TaxCategory | null> {
    return await queryOne<TaxCategory>(
      `SELECT 
        id,
        name,
        description,
        code,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_category" 
      WHERE "code" = $1`,
      [code]
    );
  }

  async findAllTaxCategories(
    status: TaxCategory['isActive'] = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaxCategory[]> {
    return await query<TaxCategory[]>(
      `SELECT 
        id,
        name,
        description,
        code,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_category" 
      WHERE "is_active" = $1 
      ORDER BY "name" ASC 
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    ) || [];
  }

  // Tax Exemption query methods
  async findTaxExemptionsByCustomerId(customerId: string): Promise<CustomerTaxExemption[]> {
    return await query<CustomerTaxExemption[]>(
      `SELECT 
        id,
        customer_id AS "customerId",
        tax_zone_id AS "taxZoneId",
        type,
        status,
        name,
        exemption_number AS "exemptionNumber",
        business_name AS "businessName",
        exemption_reason AS "exemptionReason",
        document_url AS "documentUrl",
        start_date AS "startDate",
        expiry_date AS "expiryDate",
        is_verified AS "isVerified",
        verified_by AS "verifiedBy",
        verified_at AS "verifiedAt",
        notes,
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."customer_tax_exemption" 
      WHERE "customer_id" = $1 
      ORDER BY "created_at" DESC`,
      [customerId]
    ) || [];
  }

  // Tax Zone query methods
  async findTaxZoneById(id: string): Promise<TaxZone | null> {
    return await queryOne<TaxZone>(
      `SELECT 
        id,
        name,
        code,
        description,
        is_default AS "isDefault",
        countries,
        states,
        postcodes,
        cities,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_zone" 
      WHERE "id" = $1`,
      [id]
    );
  }

  // Tax Settings query methods
  async findTaxSettingsById(id: string): Promise<TaxSettings | null> {
    return await queryOne<TaxSettings>(
      `SELECT 
        id,
        merchant_id AS "merchantId",
        calculation_method AS "calculationMethod",
        prices_include_tax AS "pricesIncludeTax",
        display_prices_with_tax AS "displayPricesWithTax",
        tax_based_on AS "taxBasedOn",
        shipping_tax_class AS "shippingTaxClass",
        display_tax_totals AS "displayTaxTotals",
        apply_tax_to_shipping AS "applyTaxToShipping",
        apply_discount_before_tax AS "applyDiscountBeforeTax",
        round_tax_at_subtotal AS "roundTaxAtSubtotal",
        tax_decimal_places AS "taxDecimalPlaces",
        default_tax_category AS "defaultTaxCategory",
        default_tax_zone AS "defaultTaxZone",
        tax_provider AS "taxProvider",
        tax_provider_settings AS "taxProviderSettings",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_settings" 
      WHERE "id" = $1`,
      [id]
    );
  }

  async findTaxSettingsByMerchantId(merchantId: string): Promise<TaxSettings | null> {
    return await queryOne<TaxSettings>(
      `SELECT 
        id,
        merchant_id AS "merchantId",
        calculation_method AS "calculationMethod",
        prices_include_tax AS "pricesIncludeTax",
        display_prices_with_tax AS "displayPricesWithTax",
        tax_based_on AS "taxBasedOn",
        shipping_tax_class AS "shippingTaxClass",
        display_tax_totals AS "displayTaxTotals",
        apply_tax_to_shipping AS "applyTaxToShipping",
        apply_discount_before_tax AS "applyDiscountBeforeTax",
        round_tax_at_subtotal AS "roundTaxAtSubtotal",
        tax_decimal_places AS "taxDecimalPlaces",
        default_tax_category AS "defaultTaxCategory",
        default_tax_zone AS "defaultTaxZone",
        tax_provider AS "taxProvider",
        tax_provider_settings AS "taxProviderSettings",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_settings" 
      WHERE "merchant_id" = $1`,
      [merchantId]
    );
  }

  /**
   * Calculate tax for a single line item
   */
  async calculateTaxForLineItem(
    productId: string,
    quantity: number,
    price: number,
    address: AddressInput,
    customerId?: string
  ): Promise<TaxCalculationResult> {
    // Determine product tax category
    const taxCategoryId = await this.getTaxCategoryForProduct(productId);
    
    // Get applicable tax rate for the given address and tax category
    const applicableTaxes = await this.findApplicableTaxRates(
      address.country,
      taxCategoryId,
      address.region,
      address.postalCode
    );
    
    // Check if customer has tax exemption
    let hasExemption = false;
    if (customerId) {
      const exemptions = await this.findTaxExemptionsByCustomerId(customerId);
      hasExemption = exemptions.length > 0 && exemptions.some((e: CustomerTaxExemption) => 
        e.status === 'active' && 
        (!e.taxZoneId || this.isAddressInTaxZone(address, e.taxZoneId))
      );
    }
    
    // Calculate tax amount
    const subtotal = price * quantity;
    let taxAmount = 0;
    const taxBreakdown: TaxBreakdownItem[] = [];
    
    if (!hasExemption && applicableTaxes.length > 0) {
      for (const tax of applicableTaxes) {
        const taxableAmount = subtotal;
        const singleTaxAmount = this.calculateSingleTaxAmount(taxableAmount, tax);
        
        taxAmount += singleTaxAmount;
        taxBreakdown.push({
          rateId: tax.id,
          rateName: tax.name,
          rateValue: tax.rate,
          taxableAmount,
          taxAmount: singleTaxAmount,
          jurisdictionLevel: 'national', // Default to national, could be more specific
          jurisdictionName: address.country
        });
      }
    }
    
    // Return tax calculation result
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      taxBreakdown,
      taxZoneApplied: applicableTaxes.length > 0 ? applicableTaxes[0].taxZoneId : undefined,
      taxCategoryApplied: taxCategoryId,
      lineItemTaxes: [{
        lineItemId: productId,
        productId: productId,
        taxAmount,
        taxBreakdown
      }]
    };
  }

  /**
   * Calculate complex tax for multiple items
   */
  async calculateComplexTax(
    items: Array<{ productId: string; quantity: number; price: number; taxCategoryId?: string }>,
    shippingAddress: AddressInput,
    billingAddress: AddressInput,
    subtotal: number,
    shippingAmount: number = 0,
    customerId?: string,
    merchantId?: string
  ): Promise<TaxCalculationResult> {
    // Get tax settings if merchant ID is provided
    let settings: TaxSettings | null = null;
    if (merchantId) {
      settings = await this.findTaxSettingsByMerchantId(merchantId);
    }
    
    // Default tax settings if none found
    const taxSettings = settings || {
      calculationMethod: 'row_based',
      pricesIncludeTax: false,
      displayPricesWithTax: false,
      taxBasedOn: 'shipping_address',
      applyTaxToShipping: true,
      applyDiscountBeforeTax: true,
      roundTaxAtSubtotal: false,
      taxDecimalPlaces: 2
    } as TaxSettings;
    
    // Determine which address to use for tax calculations
    const taxAddress = taxSettings.taxBasedOn === 'billing_address' ? billingAddress : shippingAddress;
    
    // Check if customer has tax exemption
    let hasExemption = false;
    if (customerId) {
      const exemptions = await this.findTaxExemptionsByCustomerId(customerId);
      hasExemption = exemptions.length > 0 && exemptions.some((e: CustomerTaxExemption) => 
        e.status === 'active' && 
        (!e.taxZoneId || this.isAddressInTaxZone(taxAddress, e.taxZoneId))
      );
    }
    
    // Calculate taxes for each line item
    const lineItemTaxes: LineItemTax[] = [];
    const allTaxBreakdown: TaxBreakdownItem[] = [];
    let totalTaxAmount = 0;
    
    for (const item of items) {
      // Get tax category for the product if not provided
      const taxCategoryId = item.taxCategoryId || await this.getTaxCategoryForProduct(item.productId);
      
      // Get applicable tax rates
      const applicableTaxes = await this.findApplicableTaxRates(
        taxAddress.country,
        taxCategoryId,
        taxAddress.region,
        taxAddress.postalCode
      );
      
      // Calculate tax for the item
      const itemSubtotal = item.price * item.quantity;
      let itemTaxAmount = 0;
      const itemTaxBreakdown: TaxBreakdownItem[] = [];
      
      if (!hasExemption && applicableTaxes.length > 0) {
        for (const tax of applicableTaxes) {
          const taxableAmount = itemSubtotal;
          const singleTaxAmount = this.calculateSingleTaxAmount(taxableAmount, tax);
          
          itemTaxAmount += singleTaxAmount;
          
          const breakdownItem: TaxBreakdownItem = {
            rateId: tax.id,
            rateName: tax.name,
            rateValue: tax.rate,
            taxableAmount,
            taxAmount: singleTaxAmount,
            jurisdictionLevel: 'national', // Could be more specific based on tax zone
            jurisdictionName: taxAddress.country
          };
          
          itemTaxBreakdown.push(breakdownItem);
          allTaxBreakdown.push(breakdownItem);
        }
      }
      
      lineItemTaxes.push({
        lineItemId: item.productId, // Using productId as lineItem identifier
        productId: item.productId,
        taxAmount: itemTaxAmount,
        taxBreakdown: itemTaxBreakdown
      });
      
      totalTaxAmount += itemTaxAmount;
    }
    
    // Calculate shipping tax if applicable
    let shippingTaxAmount = 0;
    if (taxSettings.applyTaxToShipping && shippingAmount > 0 && !hasExemption) {
      // Get shipping tax category if specified in settings
      const shippingTaxCategory = taxSettings.shippingTaxClass ? 
        await this.findTaxCategoryById(taxSettings.shippingTaxClass) : 
        await this.getDefaultTaxCategory();
      
      const shippingTaxCategoryId = shippingTaxCategory?.id;
      
      if (shippingTaxCategoryId) {
        const applicableTaxes = await this.findApplicableTaxRates(
          taxAddress.country,
          shippingTaxCategoryId,
          taxAddress.region,
          taxAddress.postalCode
        );
        
        for (const tax of applicableTaxes) {
          if (tax.isShippingTaxable) {
            const singleTaxAmount = this.calculateSingleTaxAmount(shippingAmount, tax);
            shippingTaxAmount += singleTaxAmount;
            
            const breakdownItem: TaxBreakdownItem = {
              rateId: tax.id,
              rateName: tax.name,
              rateValue: tax.rate,
              taxableAmount: shippingAmount,
              taxAmount: singleTaxAmount,
              jurisdictionLevel: 'national',
              jurisdictionName: taxAddress.country
            };
            
            allTaxBreakdown.push(breakdownItem);
          }
        }
      }
    }
    
    // Combine taxes
    totalTaxAmount += shippingTaxAmount;
    
    // Return tax calculation result
    return {
      subtotal,
      taxAmount: totalTaxAmount,
      total: subtotal + totalTaxAmount + shippingAmount,
      taxBreakdown: allTaxBreakdown,
      lineItemTaxes
    };
  }

  /**
   * Calculate tax for a basket by basket ID
   */
  async calculateTaxForBasket(
    basketId: string,
    address: AddressInput,
    customerId?: string
  ): Promise<TaxCalculationResult> {
    // This method would typically get the basket from the database
    // But since we're not implementing the full database access here,
    // we'll just return a placeholder result
    return {
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      taxBreakdown: []
    };
  }

  // Helper methods for tax calculations
  private async getTaxCategoryForProduct(productId: string): Promise<string | undefined> {
    // In a real implementation, this would fetch the product and get its tax category
    // For now, we'll return undefined to use the default tax category
    return undefined;
  }

  private async getDefaultTaxCategory(): Promise<TaxCategory | null> {
    return await queryOne<TaxCategory>(
      `SELECT 
        id,
        name,
        description,
        code,
        is_default AS "isDefault",
        sort_order AS "sortOrder",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_category" 
      WHERE "is_default" = TRUE AND "is_active" = TRUE 
      LIMIT 1`
    );
  }

  private async findApplicableTaxRates(
    country: string,
    taxCategoryId?: string,
    region?: string,
    postalCode?: string
  ): Promise<TaxRate[]> {
    if (!taxCategoryId) {
      const defaultCategory = await this.getDefaultTaxCategory();
      if (!defaultCategory) {
        return [];
      }
      taxCategoryId = defaultCategory.id;
    }
    
    // Find tax zones matching the address
    const matchingTaxZoneIds = await this.findTaxZonesForAddress({
      country,
      region,
      postalCode
    });
    
    if (matchingTaxZoneIds.length === 0) {
      return [];
    }
    
    // Find tax rates for the matching tax zones and category
    const placeholders = matchingTaxZoneIds.map((_, idx) => `$${idx + 3}`).join(',');
    
    return await query<TaxRate[]>(
      `SELECT 
        id,
        tax_category_id AS "taxCategoryId",
        tax_zone_id AS "taxZoneId",
        name,
        description,
        rate,
        type,
        priority,
        is_compound AS "isCompound",
        include_in_price AS "includeInPrice",
        is_shipping_taxable AS "isShippingTaxable",
        fixed_amount AS "fixedAmount",
        minimum_amount AS "minimumAmount",
        maximum_amount AS "maximumAmount",
        threshold,
        start_date AS "startDate",
        end_date AS "endDate",
        is_active AS "isActive",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."tax_rate" 
      WHERE "tax_category_id" = $1 
        AND "tax_zone_id" IN (${placeholders})
        AND "is_active" = TRUE
        AND "start_date" <= $2
        AND ("end_date" IS NULL OR "end_date" >= $2)
      ORDER BY "priority" DESC, "rate" ASC`,
      [taxCategoryId, Math.floor(Date.now() / 1000), ...matchingTaxZoneIds]
    ) || [];
  }

  private async findTaxZonesForAddress(address: AddressInput): Promise<string[]> {
    // Query to find all tax zones that match the given address
    let sql = `
      SELECT id FROM "public"."tax_zone"
      WHERE "is_active" = TRUE
        AND "countries" @> ARRAY[$1]::varchar(2)[]
    `;
    
    const params: any[] = [address.country];
    
    // Add state/region filter if provided
    if (address.region) {
      sql += ` AND ("states" IS NULL OR "states" = '{}' OR "states" @> ARRAY[$2]::varchar(50)[])`;
      params.push(address.region);
    }
    
    // Add postal code filter if provided
    if (address.postalCode) {
      sql += ` AND ("postcodes" IS NULL OR "postcodes" = '{}' OR "postcodes" @> ARRAY[$${params.length + 1}]::varchar(20)[])`;
      params.push(address.postalCode);
    }
    
    // Add city filter if provided
    if (address.city) {
      sql += ` AND ("cities" IS NULL OR "cities" = '{}' OR "cities" @> ARRAY[$${params.length + 1}]::varchar(100)[])`;
      params.push(address.city);
    }
    
    const results = await query<{ id: string }[]>(sql, params);
    
    return results ? results.map(r => r.id) : [];
  }

  private isAddressInTaxZone(address: AddressInput, taxZoneId: string): boolean {
    // This would check if the address falls within the tax zone
    // Would require fetching the tax zone and comparing
    // For simplicity, returning true
    return true;
  }

  private calculateSingleTaxAmount(amount: number, taxRate: TaxRate): number {
    if (taxRate.type === 'percentage') {
      return amount * (taxRate.rate / 100);
    } else if (taxRate.type === 'fixed_amount') {
      return taxRate.fixedAmount || 0;
    } else {
      // compound or other types would have more complex calculation
      return amount * (taxRate.rate / 100);
    }
  }
}

export default new TaxQueryRepo();
