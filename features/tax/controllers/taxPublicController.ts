import { Request, Response } from 'express';
import taxRepo from '../repos/taxRepo';

export class TaxPublicController {
  async calculateTaxForLineItem(req: Request, res: Response) {
    try {
      const { 
        productId, 
        quantity, 
        price, 
        shippingAddress, 
        customerId 
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
      
      // Calculate taxes
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async calculateTaxForBasket(req: Request, res: Response) {
    try {
      const { basketId } = req.params;
      const { shippingAddress, customerId } = req.body;
      
      // Validate required fields
      if (!basketId || !shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ 
          error: 'Basket ID and shipping country are required' 
        });
      }
      
      // Calculate taxes for the entire basket
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getTaxCategoryByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ error: 'Tax category code is required' });
      }
      
      const taxCategory = await taxRepo.findTaxCategoryByCode(code);
      
      if (!taxCategory || taxCategory.status !== 'active') {
        return res.status(404).json({ error: 'Active tax category not found' });
      }
      
      return res.json(taxCategory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getTaxRates(req: Request, res: Response) {
    try {
      const { country, region } = req.query;
      
      if (!country) {
        return res.status(400).json({ error: 'Country is required' });
      }
      
      const taxRates = await taxRepo.findAllTaxRates(
        'active',
        country as string,
        region as string
      );
      
      return res.json(taxRates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async checkCustomerTaxExemption(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const exemptions = await taxRepo.findTaxExemptionsByCustomerId(customerId);
      
      // Find active exemption
      const now = Math.floor(Date.now() / 1000);
      const activeExemption = exemptions.find(e => 
        e.status === 'active' && 
        (!e.expiresAt || e.expiresAt > now)
      );
      
      return res.json({
        isExempt: !!activeExemption,
        exemption: activeExemption || null
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new TaxPublicController();
