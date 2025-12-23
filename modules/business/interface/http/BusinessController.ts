/**
 * Business HTTP Controller
 * Handles business-related HTTP requests
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { CreateBusinessUseCase, CreateBusinessCommand } from '../../application/useCases/CreateBusiness';
import { BusinessRepo } from '../../infrastructure/repositories/BusinessRepo';
import { SystemConfigurationRepo } from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';

export class BusinessController {
  private createBusinessUseCase: CreateBusinessUseCase;

  constructor() {
    const businessRepository = new BusinessRepo();
    const systemConfigRepository = new SystemConfigurationRepo();
    this.createBusinessUseCase = new CreateBusinessUseCase(
      businessRepository,
      systemConfigRepository
    );
  }

  /**
   * Create a new business
   * POST /business/businesses
   */
  async createBusiness(req: Request, res: Response) {
    try {
      const command = new CreateBusinessCommand({
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        businessType: req.body.businessType,
        domain: req.body.domain,
        logo: req.body.logo,
        favicon: req.body.favicon,
        primaryColor: req.body.primaryColor,
        secondaryColor: req.body.secondaryColor,
        theme: req.body.theme,
        isActive: req.body.isActive,
        settings: req.body.settings,
        metadata: req.body.metadata
      });

      const result = await this.createBusinessUseCase.execute(command);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to create business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get business by ID
   * GET /business/businesses/:businessId
   */
  async getBusiness(req: Request, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const business = await businessRepository.findById(req.params.businessId);

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      res.json({
        success: true,
        data: business.toJSON()
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get business by slug
   * GET /business/businesses/slug/:slug
   */
  async getBusinessBySlug(req: Request, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const business = await businessRepository.findBySlug(req.params.slug);

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      res.json({
        success: true,
        data: business.toJSON()
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * List businesses
   * GET /business/businesses
   */
  async listBusinesses(req: Request, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const businesses = await businessRepository.findAll();

      res.json({
        success: true,
        data: businesses.map(business => business.toJSON()),
        count: businesses.length
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to list businesses',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }
}
