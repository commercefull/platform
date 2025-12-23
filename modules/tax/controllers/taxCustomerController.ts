import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import taxQueryRepo from '../repos/taxQueryRepo';
import { AddressInput } from '../taxTypes';
import basketRepo from '../../basket/infrastructure/repositories/BasketRepository';


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


export const calculateTaxForLineItem = async (req: Request, res: Response) => {
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
      res.status(400).json({
        error: 'Product ID, quantity, price, and shipping country are required'
      });
    }

    // Ensure quantity and price are valid numbers
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    // For backward compatibility, use simple tax calculation if available
    if (typeof taxQueryRepo.calculateTaxForLineItem === 'function') {
      const taxResult = await taxQueryRepo.calculateTaxForLineItem(
        productId,
        parsedQuantity,
        parsedPrice,
        {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postalCode: shippingAddress.postalCode
        },
        customerId
      );

      res.json(taxResult);
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

    // DB uses camelCase - pass items and address directly
    const dbItems = items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      tax_category_id: item.taxCategoryId
    }));
    const dbAddress = {
      country: address.country,
      region: address.region,
      postal_code: address.postalCode,
      city: address.city
    };

    const taxResult = await taxQueryRepo.calculateComplexTax(
      dbItems,
      dbAddress,
      dbAddress, // Same address for billing
      parsedPrice * parsedQuantity, // Subtotal
      0, // No shipping amount for single line item
      customerId,
      merchantId
    );

    res.json(taxResult);
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Calculate tax for an entire basket
 */
export const calculateTaxForBasket = async (req: Request, res: Response) => {
  try {
    const { basketId } = req.params;
    const { shippingAddress, billingAddress, customerId, merchantId } = req.body;

    // Validate required fields
    if (!basketId || !shippingAddress || !shippingAddress.country) {
      res.status(400).json({
        error: 'Basket ID and shipping country are required'
      });
    }

    // For backward compatibility
    if (typeof taxQueryRepo.calculateTaxForBasket === 'function') {
      const taxResult = await taxQueryRepo.calculateTaxForBasket(
        basketId,
        {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postal_code: shippingAddress.postalCode
        },
        customerId
      );

      res.json(taxResult);
    }

    // For the enhanced tax system, we need to get the basket items first
    // Note: This assumes a basketRepo is available in the application
    // If not, this would need to be implemented based on your application structure
    try {
      // Get the basket with items
      const basket = await basketRepo.findById(basketId);

      if (!basket) {
        res.status(404).json({ error: 'Basket not found' });
        return;
      }

      // Format the items for tax calculation (in application camelCase format)
      // TODO: Basket interface doesn't have items property - needs basketItemRepo
      const items: TaxableItem[] = []; // basket.items.map((item: BasketItem) => ({
        // productId: item.productId,
        // quantity: item.quantity,
        // price: item.price,
        // taxCategoryId: item.taxCategoryId
      // }));

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

      // Convert to format expected by calculateComplexTax
      const dbItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        tax_category_id: item.taxCategoryId
      }));
      const dbShippingAddr = {
        country: shippingAddrInput.country,
        region: shippingAddrInput.region,
        postal_code: shippingAddrInput.postalCode,
        city: shippingAddrInput.city
      };
      const dbBillingAddr = {
        country: billingAddrInput.country,
        region: billingAddrInput.region,
        postal_code: billingAddrInput.postalCode,
        city: billingAddrInput.city
      };

      // Calculate tax using the enhanced method
      const taxResult = await taxQueryRepo.calculateComplexTax(
        dbItems,
        dbShippingAddr,
        dbBillingAddr,
        basket.subtotal.amount,
        0,
        customerId,
        merchantId
      );

      res.json(taxResult);
    } catch (error) {
      logger.error('Error:', error);
      
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get a tax category by its code
 */
export const getTaxCategoryByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ error: 'Tax category code is required' });
    }

    // Call repository - returns data with id field already added
    const taxCategory = await taxQueryRepo.findTaxCategoryByCode(code);

    if (!taxCategory) {
      res.status(404).json({ error: 'Tax category not found' });
    }

    res.json(taxCategory);
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get active tax rates
 */
export const getTaxRates = async (req: Request, res: Response) => {
  try {
    const { country, region } = req.query;

    // Call repository - returns data with id field already added
    const taxRates = await taxQueryRepo.findAllTaxRates(
      true,
      country as string,
      region as string
    );

    res.json(taxRates);
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Check if a customer has tax exemptions
 */
export const checkCustomerTaxExemption = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      res.status(400).json({ error: 'Customer ID is required' });
    }

    // Repository returns data with id field already added
    const exemptions = await taxQueryRepo.findTaxExemptionsByCustomerId(customerId);

    // Format response in camelCase as per platform convention
    res.json({
      hasExemption: exemptions.length > 0,
      exemptions
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Find the tax zone for a given address
 */
export const findTaxZoneForAddress = async (req: Request, res: Response) => {
  try {
    const { country, region, postalCode, city } = req.body;

    if (!country) {
      res.status(400).json({ error: 'Country is required' });
    }

    // Format the address input in camelCase for application layer
    const address: AddressInput = {
      country,
      region,
      postalCode,
      city
    };

    //  just the country-based tax zone for now
    // The enhanced method will be implemented in taxRepo
    try {
      // Fallback to look up by country only
      const taxRates = await taxQueryRepo.findAllTaxRates(true, address.country);

      if (taxRates.length === 0) {
        res.status(404).json({ error: 'No matching tax zone found' });
      }

      //  the first matching tax rate's zone information
      // Note: This is constructed in camelCase as it's going to the API response
      res.json({
        id: `default-${country}`,
        name: `${country} Tax Zone`,
        description: `Default tax zone for ${country}`,
        countries: [country],
        isDefault: true
      });
    } catch (err) {
      
      res.status(404).json({ error: 'No matching tax zone found' });
    }
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get customer tax settings (for display on storefront)
 */
export const getCustomerTaxSettings = async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      res.status(400).json({ error: 'Merchant ID is required' });
    }

    //  default settings for now
    // The enhanced method will be implemented in taxRepo
    // Note: This is using camelCase for the API response as per our convention
    res.json({
      displayPricesWithTax: false,
      priceDisplaySettings: {
        includesTax: false,
        showTaxSeparately: true
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
