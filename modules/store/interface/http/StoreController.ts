/**
 * Store HTTP Controller
 * Handles store-related HTTP requests
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { eventBus } from '../../../../libs/events/eventBus';
import { CreateStoreUseCase, CreateStoreCommand } from '../../application/useCases/CreateStore';
import { UpdateStoreUseCase, UpdateStoreCommand } from '../../application/useCases/UpdateStore';
import { ConfigureStorePickupUseCase, type ConfigureStorePickupInput } from '../../application/useCases/ConfigureStorePickup';
import { SetLocalDeliveryZoneUseCase, type SetLocalDeliveryZoneInput } from '../../application/useCases/SetLocalDeliveryZone';
import { CreateStoreHierarchyUseCase, type CreateStoreHierarchyInput } from '../../application/useCases/CreateStoreHierarchy';
import { ListStoresUseCase, ListStoresQuery } from '../../application/useCases/ListStores';
import { StoreRepo } from '../../infrastructure/repositories/StoreRepo';
import { SystemConfigurationRepo } from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';

export class StoreController {
  private createStoreUseCase: CreateStoreUseCase;
  private updateStoreUseCase: UpdateStoreUseCase;
  private configurePickupUseCase: ConfigureStorePickupUseCase;
  private setLocalDeliveryUseCase: SetLocalDeliveryZoneUseCase;
  private createStoreHierarchyUseCase: CreateStoreHierarchyUseCase;
  private listStoresUseCase: ListStoresUseCase;

  constructor() {
    const storeRepository = new StoreRepo();
    const systemConfigRepository = new SystemConfigurationRepo();
    this.createStoreUseCase = new CreateStoreUseCase(storeRepository, systemConfigRepository);
    this.updateStoreUseCase = new UpdateStoreUseCase(storeRepository);
    this.configurePickupUseCase = new ConfigureStorePickupUseCase(storeRepository);
    this.setLocalDeliveryUseCase = new SetLocalDeliveryZoneUseCase(storeRepository);
    this.createStoreHierarchyUseCase = new CreateStoreHierarchyUseCase(storeRepository);
    this.listStoresUseCase = new ListStoresUseCase(storeRepository);
  }

  /**
   * Create a new store
   * POST /business/stores
   */
  async createStore(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const command = new CreateStoreCommand({
        name: body.name as string,
        slug: body.slug as string | undefined,
        description: body.description as string | undefined,
        storeType: body.storeType as 'merchant_store' | 'organization_store',
        organizationId: body.organizationId as string | undefined,
        isHeadquarters: body.isHeadquarters as boolean | undefined,
        parentStoreId: body.parentStoreId as string | undefined,
        storeUrl: body.storeUrl as string | undefined,
        storeEmail: body.storeEmail as string | undefined,
        storePhone: body.storePhone as string | undefined,
        logo: body.logo as string | undefined,
        banner: body.banner as string | undefined,
        favicon: body.favicon as string | undefined,
        primaryColor: body.primaryColor as string | undefined,
        secondaryColor: body.secondaryColor as string | undefined,
        theme: body.theme as string | undefined,
        address: body.address as CreateStoreCommand['storeData']['address'],
        isActive: body.isActive as boolean | undefined,
        isVerified: body.isVerified as boolean | undefined,
        isFeatured: body.isFeatured as boolean | undefined,
        defaultCurrency: body.defaultCurrency as string | undefined,
        supportedCurrencies: body.supportedCurrencies as string[] | undefined,
        settings: body.settings as CreateStoreCommand['storeData']['settings'],
        metaTitle: body.metaTitle as string | undefined,
        metaDescription: body.metaDescription as string | undefined,
        metaKeywords: body.metaKeywords as string[] | undefined,
        socialLinks: body.socialLinks as CreateStoreCommand['storeData']['socialLinks'],
        openingHours: body.openingHours as CreateStoreCommand['storeData']['openingHours'],
        customPages: body.customPages as CreateStoreCommand['storeData']['customPages'],
        customFields: body.customFields as CreateStoreCommand['storeData']['customFields'],
        metadata: body.metadata as CreateStoreCommand['storeData']['metadata'],
      });

      const result = await this.createStoreUseCase.execute(command);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to create store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get store by ID
   * GET /business/stores/:storeId
   */
  async getStore(req: TypedRequest, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const store = await storeRepository.findById(req.params.storeId);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      res.json({
        success: true,
        data: store.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to get store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get store by slug
   * GET /business/stores/slug/:slug
   */
  async getStoreBySlug(req: TypedRequest, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const store = await storeRepository.findBySlug(req.params.slug);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      res.json({
        success: true,
        data: store.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to get store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get stores by business
   * GET /business/stores/business/:organizationId
   */
  async getStoresByBusiness(req: TypedRequest, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const stores = await storeRepository.findByBusiness(req.params.organizationId);

      res.json({
        success: true,
        data: stores.map(store => store.toJSON()),
        count: stores.length,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to get stores',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get active stores
   * GET /business/stores/active
   */
  async getActiveStores(req: TypedRequest, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      const stores = await storeRepository.findActive();

      res.json({
        success: true,
        data: stores.map(store => store.toJSON()),
        count: stores.length,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to get active stores',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Update store
   * PUT /business/stores/:storeId
   */
  async updateStore(req: TypedRequest, res: Response) {
    try {
      const command = new UpdateStoreCommand(req.params.storeId, req.body as UpdateStoreCommand['updates']);
      const result = await this.updateStoreUseCase.execute(command);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : "Unknown error";
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to update store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Delete store
   * DELETE /business/stores/:storeId
   */
  async deleteStore(req: TypedRequest, res: Response) {
    try {
      const storeRepository = new StoreRepo();
      await storeRepository.delete(req.params.storeId);

      eventBus.emit('store.deleted', {
        storeId: req.params.storeId,
      });

      res.json({
        success: true,
        message: 'Store deleted successfully',
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to delete store',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Configure store pickup (BOPIS)
   * PUT /business/stores/:storeId/pickup
   */
  async configurePickup(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const result = await this.configurePickupUseCase.execute({
        storeId: req.params.storeId,
        enabled: body.enabled as boolean,
        settings: body.settings as ConfigureStorePickupInput['settings'],
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : "Unknown error";
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to configure pickup',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Set local delivery zone
   * PUT /business/stores/:storeId/local-delivery
   */
  async setLocalDelivery(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const result = await this.setLocalDeliveryUseCase.execute({
        storeId: req.params.storeId,
        enabled: body.enabled as boolean,
        radiusKm: body.radiusKm as number | undefined,
        postalCodes: body.postalCodes as string[] | undefined,
        deliveryFee: body.deliveryFee as number | undefined,
        freeDeliveryThreshold: body.freeDeliveryThreshold as number | undefined,
        estimatedDeliveryMinutes: body.estimatedDeliveryMinutes as number | undefined,
        maxDailyOrders: body.maxDailyOrders as number | undefined,
        availableSlots: body.availableSlots as SetLocalDeliveryZoneInput['availableSlots'],
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : "Unknown error";
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to set local delivery zone',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Create store hierarchy
   * POST /business/stores/hierarchy
   */
  async createStoreHierarchy(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const result = await this.createStoreHierarchyUseCase.execute({
        organizationId: body.organizationId as string,
        name: body.name as string,
        defaultStoreId: body.defaultStoreId as string,
        storeIds: body.storeIds as string[],
        sharedInventoryPoolId: body.sharedInventoryPoolId as string | undefined,
        sharedCatalogId: body.sharedCatalogId as string | undefined,
        settings: body.settings as CreateStoreHierarchyInput['settings'],
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : "Unknown error";
      const statusCode = errorMessage.toLowerCase().includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to create store hierarchy',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * List stores with filtering and pagination
   * GET /business/stores
   */
  async listStores(req: TypedRequest, res: Response) {
    try {
      const query = new ListStoresQuery(
        {
          storeType: req.query.storeType as 'merchant_store' | 'organization_store' | undefined,
          organizationId: req.query.organizationId as string | undefined,
          isHeadquarters: req.query.isHeadquarters === 'true',
          parentStoreId: req.query.parentStoreId as string | undefined,
          isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
          isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
          isFeatured: req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
          search: req.query.search as string | undefined,
        },
        {
          page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        },
        req.query.sortField && req.query.sortDirection
          ? { field: req.query.sortField as string, direction: req.query.sortDirection as 'asc' | 'desc' }
          : undefined,
      );

      const result = await this.listStoresUseCase.execute(query);

      res.json({
        success: true,
        data: result.stores,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to list stores',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }
}
