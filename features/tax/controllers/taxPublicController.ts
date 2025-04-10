import { Request, Response } from 'express';
import taxRepo, { AddressInput } from '../repos/taxRepo';
import { BasketRepo } from '../../basket/basketRepo';

// Define interfaces needed for the controller
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

interface Basket {
  id: string;
  customerId?: string;
  merchantId?: string;
  subtotal: number;
  shippingAmount?: number;
  items: BasketItem[];
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
      if (typeof taxRepo.calculateTaxForLineItem === 'function') {
        const taxResult = await taxRepo.calculateTaxForLineItem(
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
        
        return res.json(taxResult);
      }
      
      // Otherwise use the new complex tax calculation
      const items: TaxableItem[] = [{
        productId,
        quantity: parsedQuantity,
        price: parsedPrice,
        taxCategoryId: undefined // Will be determined by the tax repo
      }];
      
      const address: AddressInput = {
        country: shippingAddress.country,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode,
        city: shippingAddress.city
      };
      
      const taxResult = await taxRepo.calculateComplexTax(
        items,
        address,
        address, // Same address for billing
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
      if (typeof taxRepo.calculateTaxForBasket === 'function') {
        // Calculate taxes for the entire basket using the legacy method
        const taxResult = await taxRepo.calculateTaxForBasket(
          basketId,
          {
            country: shippingAddress.country,
            region: shippingAddress.region,
            postalCode: shippingAddress.postalCode
          },
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
        
        // Format the items for tax calculation
        const items: TaxableItem[] = basket.items.map((item: BasketItem) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          taxCategoryId: item.taxCategoryId
        }));
        
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
        
        // Calculate tax using the enhanced method
        const taxResult = await taxRepo.calculateComplexTax(
          items,
          shippingAddrInput,
          billingAddrInput,
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
      
      const taxCategory = await taxRepo.findTaxCategoryByCode(code);
      
      if (!taxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
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
      
      const taxRates = await taxRepo.findAllTaxRates(
        true, // Use boolean instead of string for 'active'
        country as string,
        region as string
      );
      
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
      const exemptions = await taxRepo.findTaxExemptionsByCustomerId(customerId);
      
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
      
      const address: AddressInput = {
        country,
        region,
        postalCode,
        city
      };
      
      // Return just the country-based tax zone for now
      // The enhanced method will be implemented in taxRepo
      try {
        // Fallback to look up by country only
        const taxRates = await taxRepo.findAllTaxRates(true, country);
        
        if (taxRates.length === 0) {
          return res.status(404).json({ error: 'No matching tax zone found' });
        }
        
        // Return the first matching tax rate's zone information
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
