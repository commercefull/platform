/**
 * Business HTTP Controller
 * Handles business-related HTTP requests
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { CreateBusinessUseCase, CreateBusinessCommand } from '../../application/useCases/CreateBusiness';
import { BusinessRepo } from '../../infrastructure/repositories/BusinessRepo';
import { SystemConfigurationRepo } from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';

interface CreateBusinessBody {
  name: string;
  slug?: string;
  description?: string;
  businessType: 'marketplace' | 'multi_store' | 'single_store';
  domain?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
  isActive?: boolean;
  settings?: { defaultCurrency?: string; defaultLanguage?: string; timezone?: string };
  metadata?: Record<string, unknown>;
}

export class BusinessController {
  private createBusinessUseCase: CreateBusinessUseCase;

  constructor() {
    const businessRepository = new BusinessRepo();
    const systemConfigRepository = new SystemConfigurationRepo();
    this.createBusinessUseCase = new CreateBusinessUseCase(businessRepository, systemConfigRepository);
  }

  /**
   * Create a new business
   * POST /business/businesses
   */
  async createBusiness(req: TypedRequest<Record<string, string>, unknown, CreateBusinessBody>, res: Response) {
    try {
      const body = req.body;
      const command = new CreateBusinessCommand({
        name: body.name,
        slug: body.slug,
        description: body.description,
        businessType: body.businessType,
        domain: body.domain,
        logo: body.logo,
        favicon: body.favicon,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        theme: body.theme,
        isActive: body.isActive,
        settings: body.settings,
        metadata: body.metadata,
      });

      const result = await this.createBusinessUseCase.execute(command);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to create business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get business by ID
   * GET /business/businesses/:businessId
   */
  async getBusiness(req: TypedRequest, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const business = await businessRepository.findById(req.params.businessId);

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
        });
      }

      res.json({
        success: true,
        data: business.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get business by slug
   * GET /business/businesses/slug/:slug
   */
  async getBusinessBySlug(req: TypedRequest, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const business = await businessRepository.findBySlug(req.params.slug);

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
        });
      }

      res.json({
        success: true,
        data: business.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get business',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * List businesses
   * GET /business/businesses
   */
  async listBusinesses(req: TypedRequest, res: Response) {
    try {
      const businessRepository = new BusinessRepo();
      const businesses = await businessRepository.findAll();

      res.json({
        success: true,
        data: businesses.map(business => business.toJSON()),
        count: businesses.length,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to list businesses',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }
}
