import { Request, Response } from 'express';
import { MerchantRepo, Merchant } from '../repos/merchantRepo';

export class MerchantController {
  private merchantRepo: MerchantRepo;

  constructor() {
    this.merchantRepo = new MerchantRepo();
  }

  /**
   * Get all merchants with pagination
   */
  getMerchants = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as Merchant['status'] | undefined;

      let merchants: Merchant[];
      
      if (status) {
        merchants = await this.merchantRepo.findByStatus(status, limit);
      } else {
        merchants = await this.merchantRepo.findAll(limit, offset);
      }

      res.status(200).json({
        success: true,
        data: merchants,
        pagination: {
          limit,
          offset,
          total: merchants.length // This should ideally be the total count from DB
        }
      });
    } catch (error) {
      console.error('Error fetching merchants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchants',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get merchant by ID
   */
  getMerchantById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const merchant = await this.merchantRepo.findById(id);

      if (!merchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: merchant
      });
    } catch (error) {
      console.error('Error fetching merchant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchant',
        error: (error as Error).message
      });
    }
  };

  /**
   * Create a new merchant
   */
  createMerchant = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        email,
        phone,
        website,
        logoUrl,
        description,
        status = 'pending' // Default status for new merchants
      } = req.body;

      // Basic validation
      if (!name || !email) {
        res.status(400).json({
          success: false,
          message: 'Name and email are required'
        });
        return;
      }

      // Check if merchant with email already exists
      const existingMerchant = await this.merchantRepo.findByEmail(email);
      if (existingMerchant) {
        res.status(409).json({
          success: false,
          message: `Merchant with email ${email} already exists`
        });
        return;
      }

      const merchant = await this.merchantRepo.create({
        name,
        email,
        phone,
        website,
        logoUrl,
        description,
        status
      });

      res.status(201).json({
        success: true,
        data: merchant,
        message: 'Merchant created successfully'
      });
    } catch (error) {
      console.error('Error creating merchant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create merchant',
        error: (error as Error).message
      });
    }
  };

  /**
   * Update a merchant
   */
  updateMerchant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        website,
        logoUrl,
        description,
        status
      } = req.body;

      // Check if merchant exists
      const existingMerchant = await this.merchantRepo.findById(id);
      if (!existingMerchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${id} not found`
        });
        return;
      }

      // If email is being updated, check that it doesn't conflict with another merchant
      if (email && email !== existingMerchant.email) {
        const merchantWithEmail = await this.merchantRepo.findByEmail(email);
        if (merchantWithEmail && merchantWithEmail.id !== id) {
          res.status(409).json({
            success: false,
            message: `Email ${email} is already in use by another merchant`
          });
          return;
        }
      }

      const updatedMerchant = await this.merchantRepo.update(id, {
        name,
        email,
        phone,
        website,
        logoUrl,
        description,
        status
      });

      res.status(200).json({
        success: true,
        data: updatedMerchant,
        message: 'Merchant updated successfully'
      });
    } catch (error) {
      console.error('Error updating merchant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update merchant',
        error: (error as Error).message
      });
    }
  };

  /**
   * Delete a merchant
   */
  deleteMerchant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if merchant exists
      const existingMerchant = await this.merchantRepo.findById(id);
      if (!existingMerchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${id} not found`
        });
        return;
      }

      const deleted = await this.merchantRepo.delete(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Merchant deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete merchant'
        });
      }
    } catch (error) {
      console.error('Error deleting merchant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete merchant',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get addresses for a merchant
   */
  getMerchantAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      
      // Check if merchant exists
      const merchant = await this.merchantRepo.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${merchantId} not found`
        });
        return;
      }

      const addresses = await this.merchantRepo.findAddressesByMerchantId(merchantId);

      res.status(200).json({
        success: true,
        data: addresses
      });
    } catch (error) {
      console.error('Error fetching merchant addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchant addresses',
        error: (error as Error).message
      });
    }
  };

  /**
   * Add an address for a merchant
   */
  addMerchantAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      const {
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        isPrimary = false
      } = req.body;

      // Check if merchant exists
      const merchant = await this.merchantRepo.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${merchantId} not found`
        });
        return;
      }

      // Basic validation
      if (!addressLine1 || !city || !state || !postalCode || !country) {
        res.status(400).json({
          success: false,
          message: 'Address line 1, city, state, postal code, and country are required'
        });
        return;
      }

      const address = await this.merchantRepo.createAddress({
        merchantId,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        isPrimary
      });

      res.status(201).json({
        success: true,
        data: address,
        message: 'Merchant address added successfully'
      });
    } catch (error) {
      console.error('Error adding merchant address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add merchant address',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get payment info for a merchant
   */
  getMerchantPaymentInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      
      // Check if merchant exists
      const merchant = await this.merchantRepo.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${merchantId} not found`
        });
        return;
      }

      const paymentInfo = await this.merchantRepo.findPaymentInfoByMerchantId(merchantId);

      if (!paymentInfo) {
        res.status(404).json({
          success: false,
          message: `Payment information for merchant with ID ${merchantId} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: paymentInfo
      });
    } catch (error) {
      console.error('Error fetching merchant payment info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchant payment info',
        error: (error as Error).message
      });
    }
  };

  /**
   * Add payment info for a merchant
   */
  addMerchantPaymentInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      const {
        accountHolderName,
        bankName,
        accountNumber,
        routingNumber,
        paymentProcessor,
        processorAccountId,
        isVerified = false
      } = req.body;

      // Check if merchant exists
      const merchant = await this.merchantRepo.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: `Merchant with ID ${merchantId} not found`
        });
        return;
      }

      // Check if payment info already exists
      const existingPaymentInfo = await this.merchantRepo.findPaymentInfoByMerchantId(merchantId);
      if (existingPaymentInfo) {
        res.status(409).json({
          success: false,
          message: `Payment information already exists for merchant with ID ${merchantId}`
        });
        return;
      }

      // Basic validation
      if (!accountHolderName) {
        res.status(400).json({
          success: false,
          message: 'Account holder name is required'
        });
        return;
      }

      const paymentInfo = await this.merchantRepo.createPaymentInfo({
        merchantId,
        accountHolderName,
        bankName,
        accountNumber,
        routingNumber,
        paymentProcessor,
        processorAccountId,
        isVerified
      });

      res.status(201).json({
        success: true,
        data: paymentInfo,
        message: 'Merchant payment information added successfully'
      });
    } catch (error) {
      console.error('Error adding merchant payment info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add merchant payment info',
        error: (error as Error).message
      });
    }
  };
}
