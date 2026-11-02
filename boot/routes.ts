import type { HttpApplication, HttpRouter } from 'libs/http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

// Storefront routes
import { storefrontCustomerRouter } from '../web/storefront/storefrontRouter';

// Module barrels — all routers imported from module barrels only
import {
  identityBusinessRouter,
  identityCustomerRouter,
  identitySocialRouter,
  scimRouter,
  ssoRouter,
} from '../modules/identity';
import {
  customerBusinessRouter,
  customerRouter,
} from '../modules/customer';
import {
  taxBusinessRouter,
  taxCustomerRouter,
} from '../modules/tax';
import {
  gdprBusinessRouter,
  gdprCustomerRouter,
} from '../modules/gdpr';
import {
  orderBusinessRouter,
  orderCustomerRouter,
} from '../modules/order';
import {
  basketBusinessRouter,
  basketCustomerRouter,
} from '../modules/basket';
import {
  attributeBusinessRouter,
  categoryCustomerRouter,
  productBusinessRouter,
  productCustomerRouter,
} from '../modules/product';
import {
  loyaltyCustomerRouter,
  loyaltyMerchantRouter,
} from '../modules/loyalty';
import {
  gatewayWebhookController,
  paymentBusinessRouter,
  paymentCustomerRouter,
} from '../modules/payment';
import {
  supportBusinessRouter,
  supportCustomerRouter,
} from '../modules/support';
import {
  checkoutCustomerRouter,
} from '../modules/checkout';
import {
  inventoryBusinessRouter,
  inventoryCustomerRouter,
} from '../modules/inventory';
import {
  warehouseCustomerRouter,
  warehouseMerchantRouter,
} from '../modules/warehouse';
import {
  membershipBusinessRouter,
  membershipCustomerRouter,
} from '../modules/membership';
import {
  subscriptionBusinessRouter,
  subscriptionCustomerRouter,
} from '../modules/subscription';
import {
  localizationCustomerRouter,
  localizationMerchantRouter,
} from '../modules/localization';
import {
  shippingBusinessRouter,
  shippingCustomerRouter,
} from '../modules/shipping';
import {
  notificationCustomerRouter,
  notificationMerchantRouter,
} from '../modules/notification';
import {
  couponBusinessRouter,
  couponCustomerRouter,
} from '../modules/coupon';
import {
  promotionBusinessRouter,
  promotionCustomerRouter,
} from '../modules/promotion';
import {
  storeCustomerRouter,
  storeRouter,
} from '../modules/store';
import {
  fulfillmentBusinessRouter,
  fulfillmentCustomerRouter,
  fulfillmentLocationRouter,
} from '../modules/fulfillment';
import {
  contentCustomerRouter,
  contentRouterAdmin,
} from '../modules/content';
import {
  mediaRouter,
} from '../modules/media';
import {
  systemConfigurationRouter,
} from '../modules/configuration';
import {
  webhookBusinessRouter,
} from '../modules/webhook';
import {
  reportingBusinessRouter,
} from '../modules/reporting';
import {
  auditAdminRouter,
  auditMiddleware,
} from '../modules/audit';
import {
  segmentBusinessRouter,
} from '../modules/segment';
import {
  automationBusinessRouter,
} from '../modules/automation';
import {
  returnBusinessRouter,
} from '../modules/returns';
import {
  themeBusinessRouter,
} from '../modules/theme';
import {
  pageBuilderBusinessRouter,
} from '../modules/pagebuilder';
import {
  trackingBusinessRouter,
} from '../modules/tracking';
import {
  b2bBusinessRouter,
} from '../modules/b2b';
import {
  marketplaceBusinessRouter,
} from '../modules/marketplace';
import {
  migrationBusinessRouter,
} from '../modules/migration';
import {
  integrationBusinessRouter,
} from '../modules/integration';
import {
  organizationBusinessRouter,
} from '../modules/organization';
import {
  supplierMerchantRouter,
} from '../modules/supplier';
import {
  recommendationBusinessRouter,
  recommendationCustomerRouter,
} from '../modules/recommendation';
import {
  pricingMerchantRouter,
} from '../modules/pricing';
import {
  analyticsBusinessRouter,
} from '../modules/analytics';
import {
  assortmentBusinessRouter,
  assortmentCustomerRouter,
} from '../modules/assortment';
import {
  agenticCheckoutRouter,
} from '../modules/agentic-checkout';
import { adminRouter } from '../web/admin/adminRouters';
import { searchCustomerRouter, searchBusinessRouter } from '../libs/search/searchRouter';
import { initSearchAdapter } from '../libs/search/init';
import { configureGraphQL } from './graphql';
import { moduleRegistry } from './moduleManifests';

/**
 * Configure all application routes
 */
export function configureRoutes(app: HttpApplication): void {
  // Initialize search adapter
  initSearchAdapter();

  // Gateway webhook — unauthenticated, HMAC-verified, raw body required
  app.post('/payment/webhook', express.raw({ type: 'application/json' }), gatewayWebhookController.handleGatewayWebhook);

  // Agentic Commerce Protocol — channel-authenticated (Bearer key + optional
  // Signature HMAC), raw body preserved inside the router for signature checks
  if (moduleRegistry.shouldMountRoutes('agentic-checkout')) {
    app.use('/acp', agenticCheckoutRouter);
  }

  // GraphQL endpoint — alongside REST, shares auth via context
  configureGraphQL(app);

  // Storefront routes (public website)
  app.use('/', storefrontCustomerRouter);

  app.use('/admin', adminRouter);

  // Customer API routes — conditionally mounted based on module enabled state
  const customerRouters: { module: string; router: HttpRouter }[] = [
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
    { module: 'recommendation', router: recommendationCustomerRouter },
    { module: 'assortment', router: assortmentCustomerRouter },
  ];
  const enabledCustomerRouters = customerRouters.filter(r => moduleRegistry.shouldMountRoutes(r.module)).map(r => r.router);
  app.use(
    '/customer',
    enabledCustomerRouters.filter(r => r !== fulfillmentCustomerRouter),
  );
  // Fulfillment customer router uses bare params (/:fulfillmentId) that would shadow
  // single-segment customer routes like /customer/search — mount under its own prefix.
  if (moduleRegistry.shouldMountRoutes('fulfillment')) {
    app.use('/customer/fulfillments', fulfillmentCustomerRouter);
  }

  // Business/Merchant API routes — conditionally mounted based on module enabled state
  const businessRouters: { module: string; router: HttpRouter }[] = [
    { module: 'fulfillment', router: fulfillmentLocationRouter },
    { module: 'identity', router: identityBusinessRouter },
    { module: 'organization', router: organizationBusinessRouter },
    { module: 'promotion', router: promotionBusinessRouter },
    { module: 'product', router: productBusinessRouter },
    { module: 'recommendation', router: recommendationBusinessRouter },
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
    { module: 'migration', router: migrationBusinessRouter },
    { module: 'integration', router: integrationBusinessRouter },
    { module: 'assortment', router: assortmentBusinessRouter },
  ];
  const enabledBusinessRouters = businessRouters.filter(r => moduleRegistry.shouldMountRoutes(r.module)).map(r => r.router);
  app.use('/business', enabledBusinessRouters);

  // Audit middleware — auto-records mutating admin/business actions
  if (moduleRegistry.isEnabled('audit')) {
    app.use('/business', auditMiddleware);
  }

  // Internal docs (architecture, security guidelines, DB schema, full route map)
  // are reconnaissance material — only served in production when DOCS_PUBLIC=true.
  const serveDocs = process.env.NODE_ENV !== 'production' || process.env.DOCS_PUBLIC === 'true';

  // ─── Documentation site (Docsify) ────────────────────────────────────────
  const docsDir = path.resolve('docs');
  if (serveDocs && fs.existsSync(docsDir)) {
    app.use('/docs', express.static(docsDir));
    app.get('/docs', (_req, res) => res.redirect('/docs/'));
  }

  // ─── Swagger UI (OpenAPI) ────────────────────────────────────────────────
  const openApiPath = path.resolve('docs/generated/openapi.json');
  if (serveDocs && fs.existsSync(openApiPath)) {
    const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    app.use(
      '/docs/api',
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customCssUrl: undefined,
        customSiteTitle: 'Commercefull API',
      } as swaggerUi.SwaggerUiOptions),
    );
  }

  // 404 handler - catch all unmatched routes
  app.use(function (req, res) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(404).json({ status: 'not found', timestamp: new Date().toISOString() });
    } else {
      res.status(404).render('storefront/themes/default/404', {
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
