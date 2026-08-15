import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import taxQueryRepo from '../../infrastructure/repositories/taxQueryRepo';
import { AddressInput } from '../../taxTypes';
import basketRepo from '../../../basket/infrastructure/repositories/BasketRepository';

// Define interfaces needed for the controller - keeping application layer in camelCase
interface TaxableItem {
  productId: string;
  quantity: number;
  price: number;
  taxCategoryId?: string;
}

interface _BasketItem {
  productId: string;
  quantity: number;
  price: number;
  taxCategoryId?: string;
  [key: string]: unknown;
}

interface ShippingAddressBody {
  country: string;
  region?: string;
  postalCode?: string;
  city?: string;
}

export const calculateTaxForLineItem = async (req: TypedRequest, res: Response) => {
  try {
    const body = req.body as {
      productId?: string;
      quantity?: number;
      price?: number;
      shippingAddress?: ShippingAddressBody;
      customerId?: string;
      merchantId?: string;
    };

    const { productId, quantity, price, shippingAddress, customerId, merchantId } = body;

    // Validate required fields
    if (!productId || !quantity || !price || !shippingAddress || !shippingAddress.country) {
      res.status(400).json({
        error: 'Product ID, quantity, price, and shipping country are required',
      });
      return;
    }

    // Ensure quantity and price are valid numbers
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Price must be a non-negative number' });
      return;
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
          postalCode: shippingAddress.postalCode,
        },
        customerId,
      );

      const subtotal = taxResult.taxableAmount;
      res.json({
        subtotal,
        taxAmount: taxResult.taxAmount,
        total: taxResult.total,
        rate: taxResult.rate,
        taxBreakdown: taxResult.taxAmount > 0
          ? [{
              rateId: 'default',
              rateName: 'Tax',
              rateValue: taxResult.rate,
              taxableAmount: subtotal,
              taxAmount: taxResult.taxAmount,
            }]
          : [],
      });
      return;
    }

    // Otherwise use the new complex tax calculation
    const items: TaxableItem[] = [
      {
        productId,
        quantity: parsedQuantity,
        price: parsedPrice,
        taxCategoryId: undefined, // Will be determined by the tax repo
      },
    ];

    // Transform the input address to the expected format (camelCase for application layer)
    const address: AddressInput = {
      country: shippingAddress.country,
      region: shippingAddress.region,
      postalCode: shippingAddress.postalCode,
      city: shippingAddress.city,
    };

    // DB uses camelCase - pass items and address directly
    const dbItems = items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      tax_category_id: item.taxCategoryId,
    }));
    const dbAddress = {
      country: address.country,
      region: address.region,
      postal_code: address.postalCode,
      city: address.city,
    };

    const taxResult = await taxQueryRepo.calculateComplexTax(
      dbItems,
      dbAddress,
      dbAddress, // Same address for billing
      parsedPrice * parsedQuantity, // Subtotal
      0, // No shipping amount for single line item
      customerId,
      merchantId,
    );

    res.json(taxResult);
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Calculate tax for an entire basket
 */
export const calculateTaxForBasket = async (req: TypedRequest, res: Response) => {
  try {
    const { basketId } = req.params;
    const body = req.body as {
      shippingAddress?: ShippingAddressBody;
      billingAddress?: ShippingAddressBody;
      customerId?: string;
      merchantId?: string;
    };
    const { shippingAddress, billingAddress, customerId, merchantId } = body;

    // Validate required fields
    if (!basketId || !shippingAddress || !shippingAddress.country) {
      res.status(400).json({
        error: 'Basket ID and shipping country are required',
      });
      return;
    }

    // For backward compatibility
    if (typeof taxQueryRepo.calculateTaxForBasket === 'function') {
      const taxResult = await taxQueryRepo.calculateTaxForBasket(
        basketId,
        {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postal_code: shippingAddress.postalCode,
        },
        customerId,
      );

      res.json(taxResult);
      return;
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

      // Format the items for tax calculation from basket items
      const items: TaxableItem[] = (basket.items || []).map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice.amount,
      }));

      // Transform addresses to the expected format (camelCase for application layer)
      const shippingAddrInput: AddressInput = {
        country: shippingAddress.country,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode,
        city: shippingAddress.city,
      };

      const billingAddrInput: AddressInput = billingAddress
        ? {
            country: billingAddress.country,
            region: billingAddress.region,
            postalCode: billingAddress.postalCode,
            city: billingAddress.city,
          }
        : shippingAddrInput;

      // Convert to format expected by calculateComplexTax
      const dbItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        tax_category_id: item.taxCategoryId,
      }));
      const dbShippingAddr = {
        country: shippingAddrInput.country,
        region: shippingAddrInput.region,
        postal_code: shippingAddrInput.postalCode,
        city: shippingAddrInput.city,
      };
      const dbBillingAddr = {
        country: billingAddrInput.country,
        region: billingAddrInput.region,
        postal_code: billingAddrInput.postalCode,
        city: billingAddrInput.city,
      };

      // Calculate tax using the enhanced method
      const taxResult = await taxQueryRepo.calculateComplexTax(
        dbItems,
        dbShippingAddr,
        dbBillingAddr,
        basket.subtotal.amount,
        0,
        customerId,
        merchantId,
      );

      res.json(taxResult);
    } catch (innerError: unknown) {
      logger.error('Error:', innerError);

      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get a tax category by its code
 */
export const getTaxCategoryByCode = async (req: TypedRequest, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ error: 'Tax category code is required' });
      return;
    }

    // Call repository - returns data with id field already added
    const taxCategory = await taxQueryRepo.findTaxCategoryByCode(code);

    if (!taxCategory) {
      res.status(404).json({ error: 'Tax category not found' });
      return;
    }

    res.json(taxCategory);
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get active tax rates
 */
export const getTaxRates = async (req: TypedRequest, res: Response) => {
  try {
    const { country, region } = req.query;

    // Call repository - returns data with id field already added
    const taxRates = await taxQueryRepo.findAllTaxRates(true, country as string, region as string);

    res.json(taxRates);
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Check if a customer has tax exemptions
 */
export const checkCustomerTaxExemption = async (req: TypedRequest, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      res.status(400).json({ error: 'Customer ID is required' });
      return;
    }

    // Repository returns data with id field already added
    const exemptions = await taxQueryRepo.findTaxExemptionsByCustomerId(customerId);

    // Format response in camelCase as per platform convention
    res.json({
      hasExemption: exemptions.length > 0,
      exemptions,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Find the tax zone for a given address
 */
export const findTaxZoneForAddress = async (req: TypedRequest, res: Response) => {
  try {
    const body = req.body as { country?: string; region?: string; postalCode?: string; city?: string };
    const { country, region, postalCode, city } = body;

    if (!country) {
      res.status(400).json({ error: 'Country is required' });
      return;
    }

    // Find the actual tax zone for this address
    const taxZone = await taxQueryRepo.findTaxZoneForAddress(country, region, postalCode, city);

    if (!taxZone) {
      res.status(404).json({ error: 'No matching tax zone found' });
      return;
    }

    res.json(taxZone);
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get customer tax settings (for display on storefront)
 */
export const getCustomerTaxSettings = async (req: TypedRequest, res: Response) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      res.status(400).json({ error: 'Merchant ID is required' });
      return;
    }

    //  default settings for now
    // The enhanced method will be implemented in taxRepo
    // Note: This is using camelCase for the API response as per our convention
    res.json({
      displayPricesWithTax: false,
      priceDisplaySettings: {
        includesTax: false,
        showTaxSeparately: true,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};
