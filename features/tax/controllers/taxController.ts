import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import taxRepo, { 
  TaxRate, 
  TaxCategory, 
  TaxExemptionType,
  TaxExemptionStatus,
  TaxZone,
  TaxSettings,
  CustomerTaxExemption,
  AddressInput
} from '../repos/taxRepo';

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
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getAllTaxRates(req: Request, res: Response) {
    try {
      const { country, region, status, limit, offset } = req.query;
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : undefined;
      
      // Convert status string to boolean if needed
      let statusFilter: boolean | undefined = undefined;
      if (status === 'active') {
        statusFilter = true;
      } else if (status === 'inactive') {
        statusFilter = false;
      }
      
      const taxRates = await taxRepo.findAllTaxRates(
        statusFilter,
        country as string,
        region as string,
        limitNum,
        offsetNum
      );
      
      return res.json(taxRates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxRate(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        rate,
        taxCategoryId,
        taxZoneId,
        priority,
        isActive,
        type,
        isCompound,
        includeInPrice,
        isShippingTaxable,
        startDate
      } = req.body;
      
      if (!name || rate === undefined || !taxCategoryId || !taxZoneId) {
        return res.status(400).json({
          error: 'Name, rate, tax category ID, and tax zone ID are required'
        });
      }
      
      const newTaxRate = {
        name,
        description,
        rate: parseFloat(rate),
        taxCategoryId,
        taxZoneId,
        priority: priority ? parseInt(priority) : 1,
        isActive: isActive !== undefined ? isActive : true,
        type: type || 'percentage',
        isCompound: isCompound !== undefined ? isCompound : false,
        includeInPrice: includeInPrice !== undefined ? includeInPrice : false,
        isShippingTaxable: isShippingTaxable !== undefined ? isShippingTaxable : false,
        startDate: startDate || Math.floor(Date.now() / 1000) // Unix timestamp if not provided
      };
      
      const createdTaxRate = await taxRepo.createTaxRate(newTaxRate);
      
      return res.status(201).json(createdTaxRate);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxRate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        rate,
        taxCategoryId,
        taxZoneId,
        priority,
        isActive
      } = req.body;
      
      const existingTaxRate = await taxRepo.findTaxRateById(id);
      
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      
      const updatedTaxRate: Partial<Omit<any, "id" | "createdAt" | "updatedAt">> = {};
      
      if (name !== undefined) updatedTaxRate.name = name;
      if (description !== undefined) updatedTaxRate.description = description;
      if (rate !== undefined) updatedTaxRate.rate = parseFloat(rate);
      if (taxCategoryId !== undefined) updatedTaxRate.taxCategoryId = taxCategoryId;
      if (taxZoneId !== undefined) updatedTaxRate.taxZoneId = taxZoneId;
      if (priority !== undefined) updatedTaxRate.priority = parseInt(priority);
      if (isActive !== undefined) updatedTaxRate.isActive = isActive;
      
      const result = await taxRepo.updateTaxRate(id, updatedTaxRate);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxRate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const existingTaxRate = await taxRepo.findTaxRateById(id);
      
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      
      await taxRepo.deleteTaxRate(id);
      
      return res.json({ message: 'Tax rate deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  // Tax Category Methods
  async getAllTaxCategories(req: Request, res: Response) {
    try {
      const { status } = req.query;
      
      // Convert status string to boolean if needed
      let isActive: boolean | undefined = undefined;
      if (status === 'active') {
        isActive = true;
      } else if (status === 'inactive') {
        isActive = false;
      }
      
      const taxCategories = await taxRepo.findAllTaxCategories(isActive);
      
      return res.json(taxCategories);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const taxCategory = await taxRepo.findTaxCategoryById(id);
      
      if (!taxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      return res.json(taxCategory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxCategory(req: Request, res: Response) {
    try {
      const { name, code, description, isActive, isDefault, sortOrder } = req.body;
      
      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
      }
      
      const newTaxCategory = {
        name,
        code,
        description,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: req.body.isDefault !== undefined ? req.body.isDefault : false,
        sortOrder: req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder) : 0
      };
      
      const createdTaxCategory = await taxRepo.createTaxCategory(newTaxCategory);
      
      return res.status(201).json(createdTaxCategory);
    } catch (error) {
      console.error(error);
      
      // Check for duplicate code error
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Tax category code already exists' });
      }
      
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, description, isActive, isDefault, sortOrder } = req.body;
      
      const existingTaxCategory = await taxRepo.findTaxCategoryById(id);
      
      if (!existingTaxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      const updatedTaxCategory: Partial<any> = {};
      
      if (name !== undefined) updatedTaxCategory.name = name;
      if (code !== undefined) updatedTaxCategory.code = code;
      if (description !== undefined) updatedTaxCategory.description = description;
      if (isActive !== undefined) updatedTaxCategory.isActive = isActive;
      if (isDefault !== undefined) updatedTaxCategory.isDefault = isDefault;
      if (sortOrder !== undefined) updatedTaxCategory.sortOrder = parseInt(sortOrder);
      
      const result = await taxRepo.updateTaxCategory(id, updatedTaxCategory);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      
      // Check for duplicate code error
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Tax category code already exists' });
      }
      
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const existingTaxCategory = await taxRepo.findTaxCategoryById(id);
      
      if (!existingTaxCategory) {
        return res.status(404).json({ error: 'Tax category not found' });
      }
      
      // Check if this tax category is in use by any tax rates
      const relatedTaxRates = await taxRepo.findTaxRatesByCategory(id);
      
      if (relatedTaxRates.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete tax category that is in use by tax rates',
          relatedTaxRates
        });
      }
      
      await taxRepo.deleteTaxCategory(id);
      
      return res.json({ message: 'Tax category deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  // Tax Exemption Methods
  async getCustomerTaxExemptions(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      // Use legacy method until the new one is implemented
      const exemptions = await taxRepo.findTaxExemptionsByCustomerId(customerId);
      
      return res.json(exemptions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Tax exemption ID is required' });
      }
      
      const exemption = await taxRepo.findTaxExemptionById(id);
      
      if (!exemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      return res.json(exemption);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxExemption(req: Request, res: Response) {
    try {
      const { 
        customerId, 
        exemptionType, 
        certificateNumber, 
        certificateImage, 
        expirationDate, 
        taxCategoryIds, 
        verificationStatus, 
        notes,
        taxZoneId,
        businessName,
        exemptionReason
      } = req.body;
      
      if (!customerId || !exemptionType) {
        return res.status(400).json({ 
          error: 'Customer ID and exemption type are required' 
        });
      }
      
      // Create new tax exemption
      const newExemption = {
        customerId,
        type: exemptionType as TaxExemptionType,
        status: verificationStatus as TaxExemptionStatus || 'pending',
        name: req.body.name || `Tax Exemption for Customer ${customerId}`,
        exemptionNumber: certificateNumber || '',
        businessName: businessName || undefined,
        exemptionReason: exemptionReason || undefined,
        documentUrl: certificateImage || undefined,
        startDate: Math.floor(Date.now() / 1000), // Current timestamp
        expiryDate: expirationDate ? Math.floor(new Date(expirationDate).getTime() / 1000) : undefined,
        isVerified: verificationStatus === 'active',
        taxZoneId: taxZoneId || undefined,
        notes: notes || undefined
      };
      
      const createdExemption = await taxRepo.createTaxExemption(newExemption);
      
      return res.status(201).json(createdExemption);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        exemptionType,
        certificateNumber,
        certificateImage,
        expirationDate,
        taxCategoryIds,
        verificationStatus,
        notes,
        businessName,
        exemptionReason,
        name
      } = req.body;
      
      const existingExemption = await taxRepo.findTaxExemptionById(id);
      
      if (!existingExemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      // Build updated exemption object
      const updatedExemption: Partial<Omit<CustomerTaxExemption, "id" | "createdAt" | "updatedAt" | "customerId">> = {};
      
      if (exemptionType !== undefined) updatedExemption.type = exemptionType as TaxExemptionType;
      if (certificateNumber !== undefined) updatedExemption.exemptionNumber = certificateNumber;
      if (certificateImage !== undefined) updatedExemption.documentUrl = certificateImage;
      if (expirationDate !== undefined) updatedExemption.expiryDate = Math.floor(new Date(expirationDate).getTime() / 1000);
      if (verificationStatus !== undefined) {
        updatedExemption.status = verificationStatus as TaxExemptionStatus;
        updatedExemption.isVerified = verificationStatus === 'active';
      }
      if (notes !== undefined) updatedExemption.notes = notes;
      if (businessName !== undefined) updatedExemption.businessName = businessName;
      if (exemptionReason !== undefined) updatedExemption.exemptionReason = exemptionReason;
      if (name !== undefined) updatedExemption.name = name;
      
      // Use legacy method until the new one is implemented
      const result = await taxRepo.updateTaxExemption(id, updatedExemption);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxExemption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const existingExemption = await taxRepo.findTaxExemptionById(id);
      
      if (!existingExemption) {
        return res.status(404).json({ error: 'Tax exemption not found' });
      }
      
      // Use legacy method until the new one is implemented
      await taxRepo.deleteTaxExemption(id);
      
      return res.json({ message: 'Tax exemption deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Tax Zone Methods
  async getAllTaxZones(req: Request, res: Response) {
    try {
      const { country, isActive } = req.query;
      
      const statusFilter = isActive !== undefined 
        ? isActive === 'true' 
        : undefined;
      
      // Implement this method in taxRepo
      // For now, just return a mock response
      const mockZones = [
        {
          id: 'zone1',
          code: 'US-FULL',
          name: 'United States',
          description: 'All US states',
          countries: ['US'],
          isActive: true,
          isDefault: true,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000)
        }
      ];
      
      return res.json(mockZones);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async getTaxZone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Implement this method in taxRepo
      // For now, return a mock response
      if (id === 'zone1') {
        return res.json({
          id: 'zone1',
          code: 'US-FULL',
          name: 'United States',
          description: 'All US states',
          countries: ['US'],
          isActive: true,
          isDefault: true,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000)
        });
      }
      
      return res.status(404).json({ error: 'Tax zone not found' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async createTaxZone(req: Request, res: Response) {
    try {
      const {
        name,
        code,
        description,
        countries,
        states,
        postcodes,
        cities,
        isActive,
        isDefault
      } = req.body;
      
      if (!name || !code || !countries || countries.length === 0) {
        return res.status(400).json({
          error: 'Name, code, and at least one country are required'
        });
      }
      
      const newTaxZone: any = {
        name,
        code,
        description,
        countries,
        states: states || [],
        postcodes: postcodes || [],
        cities: cities || [],
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault !== undefined ? isDefault : false
      };
      
      // Implement this method in taxRepo
      // For now, just return a mock response with the input data
      const mockCreatedZone = {
        id: 'zone1',
        ...newTaxZone,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      return res.status(201).json(mockCreatedZone);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async updateTaxZone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        countries,
        states,
        postcodes,
        cities,
        isActive,
        isDefault
      } = req.body;
      
      // Check if the tax zone exists
      // Implement this method in taxRepo
      // For now, just mock the validation
      if (id !== 'zone1') {
        return res.status(404).json({ error: 'Tax zone not found' });
      }
      
      // Build updated tax zone object
      const updatedTaxZone: Partial<any> = {};
      
      if (name !== undefined) updatedTaxZone.name = name;
      if (code !== undefined) updatedTaxZone.code = code;
      if (description !== undefined) updatedTaxZone.description = description;
      if (countries !== undefined) updatedTaxZone.countries = countries;
      if (states !== undefined) updatedTaxZone.states = states;
      if (postcodes !== undefined) updatedTaxZone.postcodes = postcodes;
      if (cities !== undefined) updatedTaxZone.cities = cities;
      if (isActive !== undefined) updatedTaxZone.isActive = isActive;
      if (isDefault !== undefined) updatedTaxZone.isDefault = isDefault;
      
      // Implement this method in taxRepo
      // For now, just return a mock response
      const mockUpdatedZone = {
        id,
        name: updatedTaxZone.name || 'United States',
        code: updatedTaxZone.code || 'US-FULL',
        description: updatedTaxZone.description || 'All US states',
        countries: updatedTaxZone.countries || ['US'],
        states: updatedTaxZone.states || [],
        postcodes: updatedTaxZone.postcodes || [],
        cities: updatedTaxZone.cities || [],
        isActive: updatedTaxZone.isActive !== undefined ? updatedTaxZone.isActive : true,
        isDefault: updatedTaxZone.isDefault !== undefined ? updatedTaxZone.isDefault : true,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      return res.json(mockUpdatedZone);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  async deleteTaxZone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if the tax zone exists
      // Implement this method in taxRepo
      // For now, just mock the validation
      if (id !== 'zone1') {
        return res.status(404).json({ error: 'Tax zone not found' });
      }
      
      // Check if the tax zone is in use by any tax rates
      // This should be implemented in taxRepo
      // For now, just return success
      
      return res.json({ message: 'Tax zone deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Find the tax zone for a given address
   */
  async getTaxZoneForAddress(req: Request, res: Response) {
    try {
      const { country, region, postalCode, city } = req.body;
      
      if (!country) {
        return res.status(400).json({ error: 'Country is required' });
      }
      
      const address: any = {
        country,
        region,
        postalCode,
        city
      };
      
      // Implement this method in taxRepo
      // For now, just return a mock response
      const mockTaxZone = {
        id: 'zone1',
        code: 'US-FULL',
        name: 'United States',
        description: 'All US states',
        countries: ['US'],
        states: [],
        postcodes: [],
        cities: [],
        isActive: true,
        isDefault: true,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      return res.json(mockTaxZone);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Get tax settings for a merchant
   */
  async getTaxSettings(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      
      if (!merchantId) {
        return res.status(400).json({ error: 'Merchant ID is required' });
      }
      
      // Implement this method in taxRepo
      // For now, just return default tax settings
      const mockTaxSettings = {
        id: 'settings1',
        merchantId,
        displayPricesWithTax: false,
        displayTaxTotals: 'itemized',
        defaultTaxZone: 'zone1',
        taxProvider: 'internal',
        taxProviderSettings: {},
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      return res.json(mockTaxSettings);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Create or update tax settings for a merchant
   */
  async createOrUpdateTaxSettings(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const {
        displayPricesWithTax,
        displayTaxTotals,
        defaultTaxZone,
        taxProvider,
        taxProviderSettings
      } = req.body;
      
      if (!merchantId) {
        return res.status(400).json({ error: 'Merchant ID is required' });
      }
      
      // Check if tax settings already exist for this merchant
      // Implement this method in taxRepo
      // For now, just create new settings
      
      const taxSettings: Partial<Omit<TaxSettings, "id" | "merchantId" | "createdAt" | "updatedAt">> = {};
      
      if (displayPricesWithTax !== undefined) taxSettings.displayPricesWithTax = displayPricesWithTax;
      if (displayTaxTotals !== undefined) taxSettings.displayTaxTotals = displayTaxTotals;
      if (defaultTaxZone !== undefined) taxSettings.defaultTaxZone = defaultTaxZone;
      if (taxProvider !== undefined) taxSettings.taxProvider = taxProvider;
      if (taxProviderSettings !== undefined) taxSettings.taxProviderSettings = taxProviderSettings;
      
      // Implement this method in taxRepo
      // For now, just return a mock response
      const mockTaxSettings = {
        id: 'settings1',
        merchantId,
        displayPricesWithTax: taxSettings.displayPricesWithTax !== undefined ? taxSettings.displayPricesWithTax : false,
        displayTaxTotals: taxSettings.displayTaxTotals !== undefined ? taxSettings.displayTaxTotals : 'itemized',
        defaultTaxZone: taxSettings.defaultTaxZone,
        taxProvider: taxSettings.taxProvider || 'internal',
        taxProviderSettings: taxSettings.taxProviderSettings,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      return res.json(mockTaxSettings);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Calculate tax for a request
   */
  async calculateTax(req: Request, res: Response) {
    try {
      const {
        items,
        shippingAddress,
        billingAddress,
        subtotal,
        shippingAmount,
        customerId,
        merchantId
      } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }
      
      if (!shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ error: 'Shipping address with country is required' });
      }
      
      // Format the shipping address
      const shippingAddrInput: any = {
        country: shippingAddress.country,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode,
        city: shippingAddress.city
      };
      
      // Format the billing address (default to shipping if not provided)
      const billingAddrInput: any = billingAddress && billingAddress.country
        ? {
            country: billingAddress.country,
            region: billingAddress.region,
            postalCode: billingAddress.postalCode,
            city: billingAddress.city
          }
        : shippingAddrInput;
      
      // Implement this method in taxRepo
      // For now, just return a mock tax calculation
      const mockTaxResult = {
        lineItems: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          taxAmount: item.price * item.quantity * 0.08,
          taxRate: 0.08,
          taxCategoryId: item.taxCategoryId || 'standard'
        })),
        totalTax: (subtotal || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)) * 0.08,
        subtotal: subtotal || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        shippingTax: shippingAmount ? shippingAmount * 0.08 : 0,
        total: (subtotal || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)) * 1.08 
               + (shippingAmount ? shippingAmount * 1.08 : 0)
      };
      
      return res.json(mockTaxResult);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new TaxController();
