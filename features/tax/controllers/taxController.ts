import { Request, Response } from 'express';
import taxRepo, { TaxRate, TaxCategory, TaxExemption } from '../repos/taxRepo';

export class TaxController {
  // Tax Rate Methods
  async getTaxRate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax rate ID is required' });
      }
      
      const taxRate = await taxRepo.findTaxRateById(id);
      
      if (!taxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      
      return res.json(taxRate);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getAllTaxRates(req: Request, res: Response) {
    try {
      const { status, country, region, limit = 50, offset = 0 } = req.query;
      
      const taxRates = await taxRepo.findAllTaxRates(
        status as TaxRate['status'],
        country as string,
        region as string,
        Number(limit),
        Number(offset)
      );
      
      return res.json(taxRates);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxRate(req: Request, res: Response) {
    try {
      const { 
        name, description, rate, country, region, postalCode,
        status, priority, productCategories 
      } = req.body;
      
      // Validate required fields
      if (!name || rate === undefined || !country) {
        return res.status(400).json({ error: 'Name, rate, and country are required' });
      }
      
      // Validate rate is a valid number
      const rateValue = Number(rate);
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
        return res.status(400).json({ error: 'Rate must be a decimal number between 0 and 1' });
      }
      
      const newTaxRate = await taxRepo.createTaxRate({
        name,
        description,
        rate: rateValue,
        country,
        region,
        postalCode,
        status: status || 'active',
        priority: Number(priority) || 1,
        productCategories: productCategories
      });
      
      return res.status(201).json(newTaxRate);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxRate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        name, description, rate, country, region, postalCode,
        status, priority, productCategories 
      } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax rate ID is required' });
      }
      
      // Check if tax rate exists
      const existingTaxRate = await taxRepo.findTaxRateById(id);
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      
      // Prepare update data
      const updateData: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>> = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (rate !== undefined) {
        const rateValue = Number(rate);
        if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
          return res.status(400).json({ error: 'Rate must be a decimal number between 0 and 1' });
        }
        updateData.rate = rateValue;
      }
      if (country !== undefined) updateData.country = country;
      if (region !== undefined) updateData.region = region;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = Number(priority);
      if (productCategories !== undefined) updateData.productCategories = productCategories;
      
      const updatedTaxRate = await taxRepo.updateTaxRate(id, updateData);
      
      return res.json(updatedTaxRate);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxRate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax rate ID is required' });
      }
      
      // Check if tax rate exists
      const existingTaxRate = await taxRepo.findTaxRateById(id);
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      
      await taxRepo.deleteTaxRate(id);
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  // Tax Category Methods
  async getTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax category ID is required' });
      }
      
      const taxCategory = await taxRepo.findTaxCategoryById(id);
      
      if (!taxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      return res.json(taxCategory);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getAllTaxCategories(req: Request, res: Response) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      const taxCategories = await taxRepo.findAllTaxCategories(
        status as TaxCategory['status'],
        Number(limit),
        Number(offset)
      );
      
      return res.json(taxCategories);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxCategory(req: Request, res: Response) {
    try {
      const { name, description, code, status } = req.body;
      
      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
      }
      
      // Check if code already exists
      const existingCategory = await taxRepo.findTaxCategoryByCode(code);
      if (existingCategory) {
        return res.status(409).json({ error: 'A tax category with this code already exists' });
      }
      
      const newTaxCategory = await taxRepo.createTaxCategory({
        name,
        description,
        code,
        status: status || 'active'
      });
      
      return res.status(201).json(newTaxCategory);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, code, status } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax category ID is required' });
      }
      
      // Check if tax category exists
      const existingCategory = await taxRepo.findTaxCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      // Check if code is being changed and already exists
      if (code && code !== existingCategory.code) {
        const categoryWithCode = await taxRepo.findTaxCategoryByCode(code);
        if (categoryWithCode && categoryWithCode.id !== id) {
          return res.status(409).json({ error: 'A tax category with this code already exists' });
        }
      }
      
      // Prepare update data
      const updateData: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>> = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (code !== undefined) updateData.code = code;
      if (status !== undefined) updateData.status = status;
      
      const updatedTaxCategory = await taxRepo.updateTaxCategory(id, updateData);
      
      return res.json(updatedTaxCategory);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax category ID is required' });
      }
      
      // Check if tax category exists
      const existingCategory = await taxRepo.findTaxCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      await taxRepo.deleteTaxCategory(id);
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  // Tax Exemption Methods
  async getTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax exemption ID is required' });
      }
      
      const taxExemption = await taxRepo.findTaxExemptionById(id);
      
      if (!taxExemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      return res.json(taxExemption);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getCustomerTaxExemptions(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const exemptions = await taxRepo.findTaxExemptionsByCustomerId(customerId);
      
      return res.json(exemptions);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxExemption(req: Request, res: Response) {
    try {
      const { 
        customerId, certificateNumber, certificateImage, 
        expiresAt, status 
      } = req.body;
      
      // Validate required fields
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const newTaxExemption = await taxRepo.createTaxExemption({
        customerId,
        certificateNumber,
        certificateImage,
        expiresAt,
        status: status || 'active'
      });
      
      return res.status(201).json(newTaxExemption);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        certificateNumber, certificateImage, 
        expiresAt, status 
      } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax exemption ID is required' });
      }
      
      // Check if tax exemption exists
      const existingExemption = await taxRepo.findTaxExemptionById(id);
      if (!existingExemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      // Prepare update data
      const updateData: Partial<Omit<TaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>> = {};
      
      if (certificateNumber !== undefined) updateData.certificateNumber = certificateNumber;
      if (certificateImage !== undefined) updateData.certificateImage = certificateImage;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
      if (status !== undefined) updateData.status = status;
      
      const updatedTaxExemption = await taxRepo.updateTaxExemption(id, updateData);
      
      return res.json(updatedTaxExemption);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax exemption ID is required' });
      }
      
      // Check if tax exemption exists
      const existingExemption = await taxRepo.findTaxExemptionById(id);
      if (!existingExemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      await taxRepo.deleteTaxExemption(id);
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new TaxController();
