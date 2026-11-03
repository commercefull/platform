import { jsonResponse } from 'libs/apiResponse';
/**
 * Store HTTP Controller
 * Handles store-related HTTP requests
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateStoreCommand } from '../../application/useCases/CreateStore';
import { UpdateStoreCommand } from '../../application/useCases/UpdateStore';
import { type ConfigureStorePickupInput } from '../../application/useCases/ConfigureStorePickup';
import { type SetLocalDeliveryZoneInput } from '../../application/useCases/SetLocalDeliveryZone';
import { type CreateStoreHierarchyInput } from '../../application/useCases/CreateStoreHierarchy';
import { ListStoresQuery } from '../../application/useCases/ListStores';
import {
  configureStorePickupUseCase,
  createStoreHierarchyUseCase,
  createStoreUseCase,
  deleteStoreUseCase,
  listStoresUseCase,
  manageStoresAdminUseCase,
  setLocalDeliveryZoneUseCase,
  updateStoreUseCase,
} from '../../application/useCases/wired';

export class StoreController {
  private createStoreUseCase = createStoreUseCase;
  private updateStoreUseCase = updateStoreUseCase;
  private configurePickupUseCase = configureStorePickupUseCase;
  private setLocalDeliveryUseCase = setLocalDeliveryZoneUseCase;
  private createStoreHierarchyUseCase = createStoreHierarchyUseCase;
  private listStoresUseCase = listStoresUseCase;
  private deleteStoreUseCase = deleteStoreUseCase;

  /**
   * Create a new store
   * POST /business/stores
   */
  createStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
      storePolicies: body.storePolicies as CreateStoreCommand['storeData']['storePolicies'],
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

    jsonResponse(res, 201, {
      success: true,
      data: result,
    });
  };

  /**
   * Get store by ID
   * GET /business/stores/:storeId
   */
  getStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const store = await manageStoresAdminUseCase.findById(req.params.storeId);

    if (!store) {
      jsonResponse(res, 404, {
        success: false,
        message: 'Store not found',
      });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: store.toJSON(),
    });
  };

  /**
   * Get store by slug
   * GET /business/stores/slug/:slug
   */
  getStoreBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const store = await manageStoresAdminUseCase.findBySlug(req.params.slug);

    if (!store) {
      jsonResponse(res, 404, {
        success: false,
        message: 'Store not found',
      });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: store.toJSON(),
    });
  };

  /**
   * Get stores by business
   * GET /business/stores/business/:organizationId
   */
  getStoresByBusiness = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const stores = await manageStoresAdminUseCase.findByBusiness(req.params.organizationId);

    jsonResponse(res, 200, {
      success: true,
      data: stores.map(store => store.toJSON()),
      count: stores.length,
    });
  };

  /**
   * Get active stores
   * GET /business/stores/active
   */
  getActiveStores = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const stores = await manageStoresAdminUseCase.findActive();

    jsonResponse(res, 200, {
      success: true,
      data: stores.map(store => store.toJSON()),
      count: stores.length,
    });
  };

  /**
   * Update store
   * PUT /business/stores/:storeId
   */
  updateStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const command = new UpdateStoreCommand(req.params.storeId, req.body as UpdateStoreCommand['updates']);
    const result = await this.updateStoreUseCase.execute(command);

    jsonResponse(res, 200, {
      success: true,
      data: result,
    });
  };

  /**
   * Delete store
   * DELETE /business/stores/:storeId
   */
  deleteStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    await this.deleteStoreUseCase.execute(req.params.storeId);

    jsonResponse(res, 200, {
      success: true,
      message: 'Store deleted successfully',
    });
  };

  /**
   * Configure store pickup (BOPIS)
   * PUT /business/stores/:storeId/pickup
   */
  configurePickup = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const body = req.body as Record<string, unknown>;
    const result = await this.configurePickupUseCase.execute({
      storeId: req.params.storeId,
      enabled: body.enabled as boolean,
      settings: body.settings as ConfigureStorePickupInput['settings'],
    });

    jsonResponse(res, 200, {
      success: true,
      data: result,
    });
  };

  /**
   * Set local delivery zone
   * PUT /business/stores/:storeId/local-delivery
   */
  setLocalDelivery = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

    jsonResponse(res, 200, {
      success: true,
      data: result,
    });
  };

  /**
   * Create store hierarchy
   * POST /business/stores/hierarchy
   */
  createStoreHierarchy = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

    jsonResponse(res, 201, {
      success: true,
      data: result,
    });
  };

  /**
   * List stores with filtering and pagination
   * GET /business/stores
   */
  listStores = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

    jsonResponse(res, 200, {
      success: true,
      data: result.stores,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  };
}
