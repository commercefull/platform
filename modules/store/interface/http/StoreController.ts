/**
 * Store HTTP Controller
 * Handles store-related HTTP requests
 */

import { Request, Response } from 'express';
import { CreateStoreUseCase, CreateStoreCommand } from '../../application/useCases/CreateStore';
import { StoreRepo } from '../../infrastructure/repositories/StoreRepo';
import { BusinessRepo } from '../../../business/infrastructure/repositories/BusinessRepo';
import { SystemConfigurationRepo } from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';

export class StoreController {
  private createStoreUseCase: CreateStoreUseCase;

  constructor() {
    const storeRepository = new StoreRepo();
    const businessRepository = new BusinessRepo();
    const systemConfigRepository = new SystemConfigurationRepo();
    this.createStoreUseCase = new CreateStoreUseCase(
      storeRepository,
      businessRepository,
      systemConfigRepository
    );
  }

  /**
   * Create a new store
   * POST /business/stores
   */
  async createStore(req: Request, res: Response) {
    try {
      const command = new CreateStoreCommand({
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        storeType: req.body.storeType,
        merchantId: req.body.merchantId,
        businessId: req.body.businessId,
        storeUrl: req.body.storeUrl,
        storeEmail: req.body.storeEmail,
        storePhone: req.body.storePhone,
        logo: req.body.logo,
        banner: req.body.banner,
        favicon: req.body.favicon,
        primaryColor: req.body.primaryColor,
        secondaryColor: req.body.secondaryColor,
        theme: req.body.theme,
        address: req.body.address,
        isActive: req.body.isActive,
        isVerified: req.body.isVerified,
        isFeatured: req.body.isFeatured,
        defaultCurrency: req.body.defaultCurrency,
        supportedCurrencies: req.body.supportedCurrencies,
        settings: req.body.settings,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        metaKeywords: req.body.metaKeywords,
        socialLinks: req.body.socialLinks,
        openingHours: req.body.openingHours,
        customPages: req.body.customPages,
        customFields: req.body.customFields,
        metadata: req.body.metadata
      });

      const result = await this.createStoreUseCase.execute(command);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Create store error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to create store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get store by ID
   * GET /business/stores/:storeId
   */
  async getStore(req: Request, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const store = await storeRepository.findById(req.params.storeId);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      res.json({
        success: true,
        data: store.toJSON()
      });
    } catch (error) {
      console.error('Get store error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get store by slug
   * GET /business/stores/slug/:slug
   */
  async getStoreBySlug(req: Request, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const store = await storeRepository.findBySlug(req.params.slug);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      res.json({
        success: true,
        data: store.toJSON()
      });
    } catch (error) {
      console.error('Get store by slug error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get stores by business
   * GET /business/stores/business/:businessId
   */
  async getStoresByBusiness(req: Request, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const stores = await storeRepository.findByBusiness(req.params.businessId);

      res.json({
        success: true,
        data: stores.map(store => store.toJSON()),
        count: stores.length
      });
    } catch (error) {
      console.error('Get stores by business error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get stores',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get active stores
   * GET /business/stores/active
   */
  async getActiveStores(req: Request, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const stores = await storeRepository.findActive();

      res.json({
        success: true,
        data: stores.map(store => store.toJSON()),
        count: stores.length
      });
    } catch (error) {
      console.error('Get active stores error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get active stores',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }
}
