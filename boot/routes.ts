import { Express } from 'express';
import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

// Storefront routes
import { storefrontCustomerRouter } from '../web/storefront/storefrontRouter';

// Feature routes - Customer facing
import { identityCustomerRouter } from '../modules/identity/interface/routers/identityCustomerRouter';
import { identitySocialRouter } from '../modules/identity/interface/routers/identitySocialRouter';
import { customerRouter } from '../modules/customer/interface/routers/customerRouter';
import { taxCustomerRouter } from '../modules/tax/interface/routers/taxCustomerRouter';
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
import { organizationBusinessRouter } from '../modules/organization/interface/http/organizationBusinessRouter';
import { promotionBusinessRouter } from '../modules/promotion/interface/routers/businessRouter';
import { productBusinessRouter } from '../modules/product/interface/routers/productBusinessRouter';
import { orderBusinessRouter } from '../modules/order/interface/routers/businessRouter';
import { taxBusinessRouter } from '../modules/tax/interface/routers/taxBusinessRouter';
import { customerBusinessRouter } from '../modules/customer/interface/routers/businessRouter';
import { gdprBusinessRouter } from '../modules/gdpr/interface/routers/gdprBusinessRouter';
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
import { contentCustomerRouter } from '../modules/content/interface/routers/contentCustomerRouter';
import { membershipBusinessRouter } from '../modules/membership/interface/routers/membershipBusinessRouter';
import { shippingBusinessRouter } from '../modules/shipping/interface/routers/shippingBusinessRouter';
import { inventoryBusinessRouter } from '../modules/inventory/interface/routers/businessRouter';
import { paymentBusinessRouter } from '../modules/payment/interface/routers/paymentBusinessRouter';
import { storeRouter } from '../modules/store/interface/http/StoreRouter';
import { systemConfigurationRouter } from '../modules/configuration/interface/http/SystemConfigurationRouter';
import { mediaRouter } from '../modules/media/interface/http/MediaRouter';
import { adminRouter } from '../web/admin/adminRouters';
// New module routers
import { couponBusinessRouter } from '../modules/coupon/interface/routers/couponRouter';
import { fulfillmentBusinessRouter } from '../modules/fulfillment/interface/routers/fulfillmentBusinessRouter';
import fulfillmentCustomerRouter from '../modules/fulfillment/interface/routers/fulfillmentCustomerRouter';
import { fulfillmentLocationRouter } from '../modules/fulfillment/interface/routers/fulfillmentLocationRouter';
import { couponCustomerRouter } from '../modules/coupon/interface/routers/couponCustomerRouter';
import { promotionCustomerRouter } from '../modules/promotion/interface/routers/customerRouter';
import { storeCustomerRouter } from '../modules/store/interface/routers/storeCustomerRouter';
import { basketBusinessRouter } from '../modules/basket/interface/routers/basketBusinessRouter';
import { attributeBusinessRouter } from '../modules/product/interface/routers/attributeRouter';
import { categoryCustomerRouter } from '../modules/product/interface/routers/categoryCustomerRouter';
import { webhookBusinessRouter } from '../modules/webhook/interface/routers/webhookBusinessRouter';
import { reportingBusinessRouter } from '../modules/reporting/interface/routers/reportingBusinessRouter';
import { auditAdminRouter } from '../modules/audit/interface/controllers/auditAdminRouter';
import { auditMiddleware } from '../modules/audit/interface/middleware/auditMiddleware';
import { searchCustomerRouter, searchBusinessRouter } from '../libs/search/searchRouter';
import { initSearchAdapter } from '../libs/search/init';
import { segmentBusinessRouter } from '../modules/segment/interface/routers/segmentRouter';
import { automationBusinessRouter } from '../modules/automation/interface/routers/automationRouter';
import { returnBusinessRouter } from '../modules/returns/interface/routers/returnRouter';
import { themeBusinessRouter } from '../modules/theme/interface/routers/themeRouter';
import { pageBuilderBusinessRouter } from '../modules/pagebuilder/interface/routers/pageBuilderRouter';
import { trackingBusinessRouter } from '../modules/tracking/interface/routers/trackingRouter';
import { b2bBusinessRouter } from '../modules/b2b/interface/routers/b2bRouter';
import { marketplaceBusinessRouter } from '../modules/marketplace/interface/routers/marketplaceRouter';
import { ssoRouter } from '../modules/identity/interface/routers/ssoRouter';
import { scimRouter } from '../modules/identity/interface/routers/scimRouter';
import * as gatewayWebhookController from '../modules/payment/interface/controllers/webhookController';
import { configureGraphQL } from './graphql';
import { moduleRegistry } from './moduleManifests';

/**
 * Configure all application routes
 */
export function configureRoutes(app: Express): void {
  // Initialize search adapter
  initSearchAdapter();

  // Gateway webhook — unauthenticated, HMAC-verified, raw body required
  app.post('/payment/webhook', express.raw({ type: 'application/json' }), gatewayWebhookController.handleGatewayWebhook);

  // GraphQL endpoint — alongside REST, shares auth via context
  configureGraphQL(app);

  // Storefront routes (public website)
  app.use('/', storefrontCustomerRouter);

  app.use('/admin', adminRouter);

  // Customer API routes — conditionally mounted based on module enabled state
  const customerRouters: { module: string; router: Router }[] = [
    { module: 'identity', router: identityCustomerRouter },
    { module: 'identity', router: identitySocialRouter },
    { module: 'customer', router: customerRouter },
    { module: 'tax', router: taxCustomerRouter },
    { module: 'gdpr', router: gdprCustomerRouter },
    { module: 'order', router: orderCustomerRouter },
    { module: 'basket', router: basketCustomerRouter },
    { module: 'product', router: productCustomerRouter },
    { module: 'loyalty', router: loyaltyCustomerRouter },
    { module: 'payment', router: paymentCustomerRouter },
    { module: 'support', router: supportCustomerRouter },
    { module: 'checkout', router: checkoutCustomerRouter },
    { module: 'inventory', router: inventoryCustomerRouter },
    { module: 'warehouse', router: warehouseCustomerRouter },
    { module: 'membership', router: membershipCustomerRouter },
    { module: 'subscription', router: subscriptionCustomerRouter },
    { module: 'localization', router: localizationCustomerRouter },
    { module: 'shipping', router: shippingCustomerRouter },
    { module: 'notification', router: notificationCustomerRouter },
    { module: 'coupon', router: couponCustomerRouter },
    { module: 'promotion', router: promotionCustomerRouter },
    { module: 'product', router: categoryCustomerRouter },
    { module: 'store', router: storeCustomerRouter },
    { module: 'fulfillment', router: fulfillmentCustomerRouter },
    { module: 'content', router: contentCustomerRouter },
    { module: 'product', router: searchCustomerRouter },
  ];
  const enabledCustomerRouters = customerRouters
    .filter(r => moduleRegistry.shouldMountRoutes(r.module))
    .map(r => r.router);
  app.use('/customer', enabledCustomerRouters);

  // Business/Merchant API routes — conditionally mounted based on module enabled state
  const businessRouters: { module: string; router: Router }[] = [
    { module: 'fulfillment', router: fulfillmentLocationRouter },
    { module: 'identity', router: identityBusinessRouter },
    { module: 'organization', router: organizationBusinessRouter },
    { module: 'promotion', router: promotionBusinessRouter },
    { module: 'product', router: productBusinessRouter },
    { module: 'order', router: orderBusinessRouter },
    { module: 'tax', router: taxBusinessRouter },
    { module: 'customer', router: customerBusinessRouter },
    { module: 'gdpr', router: gdprBusinessRouter },
    { module: 'subscription', router: subscriptionBusinessRouter },
    { module: 'support', router: supportBusinessRouter },
    { module: 'analytics', router: analyticsBusinessRouter },
    { module: 'warehouse', router: warehouseMerchantRouter },
    { module: 'supplier', router: supplierMerchantRouter },
    { module: 'localization', router: localizationMerchantRouter },
    { module: 'pricing', router: pricingMerchantRouter },
    { module: 'loyalty', router: loyaltyMerchantRouter },
    { module: 'notification', router: notificationMerchantRouter },
    { module: 'content', router: contentRouterAdmin },
    { module: 'membership', router: membershipBusinessRouter },
    { module: 'shipping', router: shippingBusinessRouter },
    { module: 'inventory', router: inventoryBusinessRouter },
    { module: 'payment', router: paymentBusinessRouter },
    { module: 'media', router: mediaRouter },
    { module: 'store', router: storeRouter },
    { module: 'configuration', router: systemConfigurationRouter },
    { module: 'coupon', router: couponBusinessRouter },
    { module: 'fulfillment', router: fulfillmentBusinessRouter },
    { module: 'basket', router: basketBusinessRouter },
    { module: 'product', router: attributeBusinessRouter },
    { module: 'webhook', router: webhookBusinessRouter },
    { module: 'reporting', router: reportingBusinessRouter },
    { module: 'audit', router: auditAdminRouter },
    { module: 'product', router: searchBusinessRouter },
    { module: 'segment', router: segmentBusinessRouter },
    { module: 'automation', router: automationBusinessRouter },
    { module: 'returns', router: returnBusinessRouter },
    { module: 'theme', router: themeBusinessRouter },
    { module: 'pagebuilder', router: pageBuilderBusinessRouter },
    { module: 'tracking', router: trackingBusinessRouter },
    { module: 'b2b', router: b2bBusinessRouter },
    { module: 'marketplace', router: marketplaceBusinessRouter },
    { module: 'identity', router: ssoRouter },
    { module: 'identity', router: scimRouter },
  ];
  const enabledBusinessRouters = businessRouters
    .filter(r => moduleRegistry.shouldMountRoutes(r.module))
    .map(r => r.router);
  app.use('/business', enabledBusinessRouters);

  // Audit middleware — auto-records mutating admin/business actions
  if (moduleRegistry.isEnabled('audit')) {
    app.use('/business', auditMiddleware);
  }

  // ─── Documentation site (Docsify) ────────────────────────────────────────
  // Docsify shell (index.html, _sidebar.md, _coverpage.md) and all markdown
  // content live together in docs/.
  const docsDir = path.resolve(__dirname, '../docs');
  if (fs.existsSync(docsDir)) {
    app.use('/docs', express.static(docsDir));
    // Redirect /docs to /docs/ so Docsify loads properly
    app.get('/docs', (_req, res) => res.redirect('/docs/'));
  }

  // ─── Swagger UI (OpenAPI) ────────────────────────────────────────────────
  const openApiPath = path.resolve(__dirname, '../docs/generated/openapi.json');
  if (fs.existsSync(openApiPath)) {
    const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    app.use('/docs/api', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
      customCssUrl: undefined,
      customSiteTitle: 'CommerceFull API',
    } as swaggerUi.SwaggerUiOptions));
  }

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
