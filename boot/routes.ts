import { Express } from 'express';

// Storefront routes
import { storefrontCustomerRouter } from '../web/storefront/storefrontRouter';

// Feature routes - Customer facing
import { identityCustomerRouter } from '../modules/identity/interface/routers/identityCustomerRouter';
import { identitySocialRouter } from '../modules/identity/interface/routers/identitySocialRouter';
import { customerRouter } from '../modules/customer/interface/routers/customerRouter';
import { taxCustomerRouter } from '../modules/tax/interface/routers/taxCustomerRouter';
import { b2bCustomerRouter } from '../modules/b2b/interface/routers/b2bCustomerRouter';
import { gdprCustomerRouter } from '../modules/gdpr/interface/routers/gdprCustomerRouter';
import { orderCustomerRouter } from '../modules/order/interface/routers/customerRouter';
import { basketCustomerRouter } from '../modules/basket/interface/routers/basketRouter';
import { productCustomerRouter } from '../modules/product/interface/routers/productCustomerRouter';
import { loyaltyCustomerRouter } from '../modules/loyalty/interface/routers/loyaltyCustomerRouter';
import { paymentCustomerRouter } from '../modules/payment/interface/routers/paymentCustomerRouter';
import { supportCustomerRouter } from '../modules/support/interface/routers/supportCustomerRouter';
import { checkoutCustomerRouter } from '../modules/checkout/interface/routers/checkoutRouter';
import { inventoryCustomerRouter } from '../modules/inventory/interface/routers/customerRouter';
import { warehouseCustomerRouter } from '../modules/warehouse/interface/routers/warehouseCustomerRouter';
import { membershipCustomerRouter } from '../modules/membership/interface/routers/membershipCustomerRouter';
import { subscriptionCustomerRouter } from '../modules/subscription/interface/routers/subscriptionCustomerRouter';
import { localizationCustomerRouter } from '../modules/localization/interface/routers/localizationCustomerRouter';
import { shippingCustomerRouter } from '../modules/shipping/interface/routers/shippingCustomerRouter';
import { notificationCustomerRouter } from '../modules/notification/interface/routers/notificationCustomerRouter';

// Feature routes - Business/Merchant facing
import { identityBusinessRouter } from '../modules/identity/interface/routers/identityBusinessRouter';
import { merchantMerchantRouter } from '../modules/merchant/interface/http/merchantBusinessRouter';
import { promotionBusinessRouter } from '../modules/promotion/interface/routers/businessRouter';
import { productBusinessRouter } from '../modules/product/interface/routers/productBusinessRouter';
import { orderBusinessRouter } from '../modules/order/interface/routers/businessRouter';
import { taxBusinessRouter } from '../modules/tax/interface/routers/taxBusinessRouter';
import { customerBusinessRouter } from '../modules/customer/interface/routers/businessRouter';
import { gdprBusinessRouter } from '../modules/gdpr/interface/routers/gdprBusinessRouter';
import { b2bBusinessRouter } from '../modules/b2b/interface/routers/b2bBusinessRouter';
import { subscriptionBusinessRouter } from '../modules/subscription/interface/routers/subscriptionBusinessRouter';
import { supportBusinessRouter } from '../modules/support/interface/routers/supportBusinessRouter';
import { analyticsBusinessRouter } from '../modules/analytics/interface/routers/analyticsBusinessRouter';
import { warehouseMerchantRouter } from '../modules/warehouse/interface/routers/warehouseBusinessRouter';
import { supplierMerchantRouter } from '../modules/supplier/interface/routers/supplierBusinessRouter';
import { localizationMerchantRouter } from '../modules/localization/interface/routers/localizationBusinessRouter';
import { pricingMerchantRouter } from '../modules/pricing/interface/routers/pricingBusinessRouter';
import { loyaltyMerchantRouter } from '../modules/loyalty/interface/routers/loyaltyBusinessRouter';
import { notificationMerchantRouter } from '../modules/notification/interface/routers/notificationBusinessRouter';
import { contentRouterAdmin } from '../modules/content/interface/routers/contentBusinessRouter';
import { membershipBusinessRouter } from '../modules/membership/interface/routers/membershipBusinessRouter';
import { shippingBusinessRouter } from '../modules/shipping/interface/routers/shippingBusinessRouter';
import { inventoryBusinessRouter } from '../modules/inventory/interface/routers/businessRouter';
import { paymentBusinessRouter } from '../modules/payment/interface/routers/paymentBusinessRouter';
import { businessRouter } from '../modules/business/interface/http/BusinessRouter';
import { storeRouter } from '../modules/store/interface/http/StoreRouter';
import { systemConfigurationRouter } from '../modules/configuration/interface/http/SystemConfigurationRouter';
import { mediaRouter } from '../modules/media/interface/http/MediaRouter';
import { adminRouter } from '../web/admin/adminRouters';
import { merchantRouter } from '../web/merchant/merchantRouters';
import { b2bPortalRouter } from '../web/b2b/b2bRouters';

// New module routers
import { brandBusinessRouter } from '../modules/brand/interface/routers/brandRouter';
import { channelBusinessRouter } from '../modules/channel/interface/routers/channelRouter';
import { segmentBusinessRouter } from '../modules/segment/interface/routers/segmentRouter';
import { couponBusinessRouter } from '../modules/coupon/interface/routers/couponRouter';
import { fulfillmentBusinessRouter } from '../modules/fulfillment/interface/routers/fulfillmentBusinessRouter';
import fulfillmentCustomerRouter from '../modules/fulfillment/interface/routers/fulfillmentCustomerRouter';
import { organizationBusinessRouter } from '../modules/organization/interface/routers/organizationRouter';
import { brandCustomerRouter } from '../modules/brand/interface/routers/brandCustomerRouter';
import { couponCustomerRouter } from '../modules/coupon/interface/routers/couponCustomerRouter';
import { storeCustomerRouter } from '../modules/store/interface/routers/storeCustomerRouter';
import { assortmentBusinessRouter } from '../modules/assortment/interface/routers/assortmentRouter';

/**
 * Configure all application routes
 */
export function configureRoutes(app: Express): void {
  // Storefront routes (public website)
  app.use('/', storefrontCustomerRouter);

  app.use('/admin', adminRouter);
  app.use('/merchant', merchantRouter);
  app.use('/b2b', b2bPortalRouter);

  app.use('/customer', [
    identityCustomerRouter, // Must be first - public auth routes
    identitySocialRouter, // Social login routes
    customerRouter,
    taxCustomerRouter,
    b2bCustomerRouter,
    gdprCustomerRouter,
    orderCustomerRouter,
    basketCustomerRouter,
    productCustomerRouter,
    loyaltyCustomerRouter,
    paymentCustomerRouter,
    supportCustomerRouter,
    checkoutCustomerRouter,
    inventoryCustomerRouter,
    warehouseCustomerRouter,
    membershipCustomerRouter,
    subscriptionCustomerRouter,
    localizationCustomerRouter,
    shippingCustomerRouter,
    notificationCustomerRouter,
    brandCustomerRouter,
    couponCustomerRouter,
    storeCustomerRouter,
    fulfillmentCustomerRouter,
  ]);

  // Business/Merchant API routes
  app.use('/business', [
    identityBusinessRouter,
    merchantMerchantRouter,
    promotionBusinessRouter,
    productBusinessRouter,
    orderBusinessRouter,
    taxBusinessRouter,
    customerBusinessRouter,
    gdprBusinessRouter,
    b2bBusinessRouter,
    subscriptionBusinessRouter,
    supportBusinessRouter,
    analyticsBusinessRouter,
    warehouseMerchantRouter,
    supplierMerchantRouter,
    localizationMerchantRouter,
    pricingMerchantRouter,
    loyaltyMerchantRouter,
    notificationMerchantRouter,
    contentRouterAdmin,
    membershipBusinessRouter,
    shippingBusinessRouter,
    inventoryBusinessRouter,
    paymentBusinessRouter,
    mediaRouter,
    businessRouter,
    storeRouter,
    systemConfigurationRouter,
    brandBusinessRouter,
    channelBusinessRouter,
    segmentBusinessRouter,
    couponBusinessRouter,
    fulfillmentBusinessRouter,
    organizationBusinessRouter,
    assortmentBusinessRouter,
  ]);

  // Health check endpoint (before other routes for load balancers)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler - catch all unmatched routes
  app.use(function (req, res) {
    // Return JSON for API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(404).json({ status: 'not found', timestamp: new Date().toISOString() });
    } else {
      // Render 404 page for HTML requests
      res.status(404).render('storefront/views/404', {
        pageName: 'Page Not Found',
        message: "The page you're looking for doesn't exist.",
        error: { status: 404 },
        user: req.user ?? null,
        session: req.session ?? null,
        successMsg: res.locals.successMsg ?? null,
        errorMsg: res.locals.errorMsg ?? null,
        categories: [],
      });
    }
  });
}
