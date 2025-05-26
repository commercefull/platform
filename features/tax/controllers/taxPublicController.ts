import { Request, Response } from 'express';
import taxQueryRepo from '../repos/taxQueryRepo';
import { AddressInput } from '../taxTypes';
import { BasketRepo } from '../../basket/basketRepo';

// Field mapping dictionaries for TypeScript (camelCase) to database (snake_case) conversion
const addressFields: Record<string, string> = {
  country: 'country',
  region: 'region',
  postalCode: 'postal_code',
  city: 'city'
};

const taxableItemFields: Record<string, string> = {
  productId: 'product_id',
  quantity: 'quantity',
  price: 'price',
  taxCategoryId: 'tax_category_id'
};

// These should align with the field mappings in the repository
const taxCategoryFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  isDefault: 'is_default',
  sortOrder: 'sort_order',
  isActive: 'is_active',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const taxRateFields: Record<string, string> = {
  id: 'id',
  taxCategoryId: 'tax_category_id',
  taxZoneId: 'tax_zone_id',
  name: 'name',
  description: 'description',
  rate: 'rate',
  type: 'type',
  priority: 'priority',
  isCompound: 'is_compound',
  includeInPrice: 'include_in_price',
  isShippingTaxable: 'is_shipping_taxable',
  fixedAmount: 'fixed_amount',
  minimumAmount: 'minimum_amount',
  maximumAmount: 'maximum_amount',
  threshold: 'threshold',
  startDate: 'start_date',
  endDate: 'end_date',
  isActive: 'is_active',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const customerTaxExemptionFields: Record<string, string> = {
  id: 'id',
  customerId: 'customer_id',
  taxCategoryId: 'tax_category_id',
  exemptionNumber: 'exemption_number',
  exemptionType: 'exemption_type',
  issuingAuthority: 'issuing_authority',
  validFrom: 'start_date',
  validUntil: 'expiry_date',
  documentUrl: 'document_url',
  notes: 'notes',
  isVerified: 'is_verified',
  verifiedBy: 'verified_by',
  verifiedAt: 'verified_at',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform TypeScript object to database format (camelCase to snake_case)
 */
function transformTsToDb<T>(tsObject: any, fieldMap: Record<string, string>): T {
  if (!tsObject) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (tsObject[tsKey] !== undefined) {
      result[dbKey] = tsObject[tsKey];
    }
  });
  
  return result as T;
}

/**
 * Transform database record to TypeScript object (snake_case to camelCase)
 */
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

/**
 * Transform an array of TypeScript objects to database format
 */
function transformArrayTsToDb<T>(tsObjects: any[], fieldMap: Record<string, string>): T[] {
  if (!tsObjects || !Array.isArray(tsObjects)) return [];
  return tsObjects.map(obj => transformTsToDb<T>(obj, fieldMap));
}

/**
 * Transform an array of database records to TypeScript objects
 */
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// Define interfaces needed for the controller - keeping application layer in camelCase
interface TaxableItem {
  productId: string;
  quantity: number;
  price: number;
  taxCategoryId?: string;
}

interface BasketItem {
  productId: string;
  quantity: number;
  price: number;
  taxCategoryId?: string;
  [key: string]: any;
}

export class TaxPublicController {
  /**
   * Calculate tax for a single line item
   */
  async calculateTaxForLineItem(req: Request, res: Response) {
    try {
      const { 
        productId, 
        quantity, 
        price, 
        shippingAddress, 
        customerId,
        merchantId
      } = req.body;
      
      // Validate required fields
      if (!productId || !quantity || !price || !shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ 
          error: 'Product ID, quantity, price, and shipping country are required' 
        });
      }
      
      // Ensure quantity and price are valid numbers
      const parsedQuantity = Number(quantity);
      const parsedPrice = Number(price);
      
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
      }
      
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }

      // For backward compatibility, use simple tax calculation if available
      // This uses the repository's transformation methods to handle snake_case/camelCase conversion
      if (typeof taxQueryRepo.calculateTaxForLineItem === 'function') {
        // Convert address to database format (snake_case) for the repository call
        const dbAddress = transformTsToDb<any>({
          country: shippingAddress.country,
          region: shippingAddress.region,
          postalCode: shippingAddress.postalCode
        }, addressFields);
        
        const taxResult = await taxQueryRepo.calculateTaxForLineItem(
          productId,
          parsedQuantity,
          parsedPrice,
          dbAddress,
          customerId
        );
        
        return res.json(taxResult);
      }
      
      // Otherwise use the new complex tax calculation
      const items: TaxableItem[] = [{
        productId,
        quantity: parsedQuantity,
        price: parsedPrice,
        taxCategoryId: undefined // Will be determined by the tax repo
      }];
      
      // Transform the input address to the expected format (camelCase for application layer)
      const address: AddressInput = {
        country: shippingAddress.country,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode,
        city: shippingAddress.city
      };
      
      // Convert items and addresses to database format (snake_case) for the repository call
      const dbItems = transformArrayTsToDb<any>(items, taxableItemFields);
      const dbAddress = transformTsToDb<any>(address, addressFields);
      
      const taxResult = await taxQueryRepo.calculateComplexTax(
        dbItems,
        dbAddress,
        dbAddress, // Same address for billing
        parsedPrice * parsedQuantity, // Subtotal
        0, // No shipping amount for single line item
        customerId,
        merchantId
      );
      
      return res.json(taxResult);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Calculate tax for an entire basket
   */
  async calculateTaxForBasket(req: Request, res: Response) {
    try {
      const { basketId } = req.params;
      const { shippingAddress, billingAddress, customerId, merchantId } = req.body;
      
      // Validate required fields
      if (!basketId || !shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ 
          error: 'Basket ID and shipping country are required' 
        });
      }
      
      // For backward compatibility
      if (typeof taxQueryRepo.calculateTaxForBasket === 'function') {
        // Calculate taxes for the entire basket using the legacy method
        // Convert address to database format (snake_case) for the repository call
        const dbAddress = transformTsToDb<any>({
          country: shippingAddress.country,
          region: shippingAddress.region,
          postalCode: shippingAddress.postalCode
        }, addressFields);
        
        const taxResult = await taxQueryRepo.calculateTaxForBasket(
          basketId,
          dbAddress,
          customerId
        );
        
        return res.json(taxResult);
      }
      
      // For the enhanced tax system, we need to get the basket items first
      // Note: This assumes a basketRepo is available in the application
      // If not, this would need to be implemented based on your application structure
      try {
        // Get the basket with items
        const basket = await (new BasketRepo()).getBasketById(basketId);
        if (!basket) {
          return res.status(404).json({ error: 'Basket not found' });
        }
        
        // Format the items for tax calculation (in application camelCase format)
        const items: TaxableItem[] = basket.items.map((item: BasketItem) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          taxCategoryId: item.taxCategoryId
        }));
        
        // Transform addresses to the expected format (camelCase for application layer)
        const shippingAddrInput: AddressInput = {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postalCode: shippingAddress.postalCode,
          city: shippingAddress.city
        };
        
        const billingAddrInput: AddressInput = billingAddress ? {
          country: billingAddress.country,
          region: billingAddress.region,
          postalCode: billingAddress.postalCode,
          city: billingAddress.city
        } : shippingAddrInput;
        
        // Convert items and addresses to database format (snake_case) for the repository call
        const dbItems = transformArrayTsToDb<any>(items, taxableItemFields);
        const dbShippingAddr = transformTsToDb<any>(shippingAddrInput, addressFields);
        const dbBillingAddr = transformTsToDb<any>(billingAddrInput, addressFields);
        
        // Calculate tax using the enhanced method
        const taxResult = await taxQueryRepo.calculateComplexTax(
          dbItems,
          dbShippingAddr,
          dbBillingAddr,
          basket.subtotal,
          0,
          customerId,
          merchantId
        );
        
        return res.json(taxResult);
      } catch (error) {
        console.error('Error importing basketRepo or calculating tax:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Get a tax category by its code
   */
  async getTaxCategoryByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ error: 'Tax category code is required' });
      }
      
      // Call repository with the code parameter
      const dbTaxCategory = await taxQueryRepo.findTaxCategoryByCode(code);
      
      if (!dbTaxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      // Transform from database record to TypeScript object
      const taxCategory = transformDbToTs(dbTaxCategory, taxCategoryFields);
      
      return res.json(taxCategory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Get active tax rates
   */
  async getTaxRates(req: Request, res: Response) {
    try {
      const { country, region } = req.query;
      
      // Call repository with query parameters
      const dbTaxRates = await taxQueryRepo.findAllTaxRates(
        true, // Use boolean instead of string for 'active'
        country as string,
        region as string
      );
      
      // Transform from database records to TypeScript objects
      const taxRates = transformArrayDbToTs(dbTaxRates, taxRateFields);
      
      return res.json(taxRates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Check if a customer has tax exemptions
   */
  async checkCustomerTaxExemption(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      // Use the legacy method as the new one will be added to taxRepo later
      const dbExemptions = await taxQueryRepo.findTaxExemptionsByCustomerId(customerId);
      
      // Transform database records to TypeScript objects
      const exemptions = transformArrayDbToTs(dbExemptions, customerTaxExemptionFields);
      
      // Format response in camelCase as per platform convention
      return res.json({
        hasExemption: exemptions.length > 0,
        exemptions
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Find the tax zone for a given address
   */
  async findTaxZoneForAddress(req: Request, res: Response) {
    try {
      const { country, region, postalCode, city } = req.body;
      
      if (!country) {
        return res.status(400).json({ error: 'Country is required' });
      }
      
      // Format the address input in camelCase for application layer
      const address: AddressInput = {
        country,
        region,
        postalCode,
        city
      };
      
      // Convert to database format (snake_case) for repository calls
      const dbAddress = transformTsToDb<any>(address, addressFields);
      
      // Return just the country-based tax zone for now
      // The enhanced method will be implemented in taxRepo
      try {
        // Fallback to look up by country only
        // Use the already converted dbAddress parameter for the query
        const dbTaxRates = await taxQueryRepo.findAllTaxRates(true, dbAddress.country);
        
        // Transform database records to TypeScript objects
        const taxRates = transformArrayDbToTs(dbTaxRates, taxRateFields);
        
        if (taxRates.length === 0) {
          return res.status(404).json({ error: 'No matching tax zone found' });
        }
        
        // Return the first matching tax rate's zone information
      // Note: This is constructed in camelCase as it's going to the API response
      return res.json({
        id: `default-${country}`,
        name: `${country} Tax Zone`,
        description: `Default tax zone for ${country}`,
        countries: [country],
        isDefault: true
      });
      } catch (err) {
        console.error('Tax zone lookup error:', err);
        return res.status(404).json({ error: 'No matching tax zone found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Get customer tax settings (for display on storefront)
   */
  async getStorefrontTaxSettings(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      
      if (!merchantId) {
        return res.status(400).json({ error: 'Merchant ID is required' });
      }
      
      // Return default settings for now
      // The enhanced method will be implemented in taxRepo
      // Note: This is using camelCase for the API response as per our convention
      return res.json({
        displayPricesWithTax: false,
        priceDisplaySettings: {
          includesTax: false,
          showTaxSeparately: true
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new TaxPublicController();
