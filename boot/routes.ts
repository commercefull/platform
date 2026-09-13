import { Express } from 'express';
import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

// Storefront routes
import { storefrontCustomerRouter } from '../web/storefront/storefrontRouter';

// Module barrels — all routers imported from module barrels only
import * as Identity from '../modules/identity';
import * as Customer from '../modules/customer';
import * as Tax from '../modules/tax';
import * as Gdpr from '../modules/gdpr';
import * as Order from '../modules/order';
import * as Basket from '../modules/basket';
import * as Product from '../modules/product';
import * as Loyalty from '../modules/loyalty';
import * as Payment from '../modules/payment';
import * as Support from '../modules/support';
import * as Checkout from '../modules/checkout';
import * as Inventory from '../modules/inventory';
import * as Warehouse from '../modules/warehouse';
import * as Membership from '../modules/membership';
import * as Subscription from '../modules/subscription';
import * as Localization from '../modules/localization';
import * as Shipping from '../modules/shipping';
import * as Notification from '../modules/notification';
import * as Coupon from '../modules/coupon';
import * as Promotion from '../modules/promotion';
import * as Store from '../modules/store';
import * as Fulfillment from '../modules/fulfillment';
import * as Content from '../modules/content';
import * as Media from '../modules/media';
import * as Configuration from '../modules/configuration';
import * as Webhook from '../modules/webhook';
import * as Reporting from '../modules/reporting';
import * as Audit from '../modules/audit';
import * as Segment from '../modules/segment';
import * as Automation from '../modules/automation';
import * as Returns from '../modules/returns';
import * as Theme from '../modules/theme';
import * as PageBuilder from '../modules/pagebuilder';
import * as Tracking from '../modules/tracking';
import * as B2b from '../modules/b2b';
import * as Marketplace from '../modules/marketplace';
import * as Migration from '../modules/migration';
import * as Integration from '../modules/integration';
import * as Organization from '../modules/organization';
import * as Supplier from '../modules/supplier';
import * as Pricing from '../modules/pricing';
import * as Analytics from '../modules/analytics';

import { adminRouter } from '../web/admin/adminRouters';
import { searchCustomerRouter, searchBusinessRouter } from '../libs/search/searchRouter';
import { initSearchAdapter } from '../libs/search/init';
import { configureGraphQL } from './graphql';
import { moduleRegistry } from './moduleManifests';

/**
 * Configure all application routes
 */
export function configureRoutes(app: Express): void {
  // Initialize search adapter
  initSearchAdapter();

  // Gateway webhook — unauthenticated, HMAC-verified, raw body required
  app.post('/payment/webhook', express.raw({ type: 'application/json' }), Payment.gatewayWebhookController.handleGatewayWebhook);

  // GraphQL endpoint — alongside REST, shares auth via context
  configureGraphQL(app);

  // Storefront routes (public website)
  app.use('/', storefrontCustomerRouter);

  app.use('/admin', adminRouter);

  // Customer API routes — conditionally mounted based on module enabled state
  const customerRouters: { module: string; router: Router }[] = [
    { module: 'identity', router: Identity.identityCustomerRouter },
    { module: 'identity', router: Identity.identitySocialRouter },
    { module: 'customer', router: Customer.customerRouter },
    { module: 'tax', router: Tax.taxCustomerRouter },
    { module: 'gdpr', router: Gdpr.gdprCustomerRouter },
    { module: 'order', router: Order.orderCustomerRouter },
    { module: 'basket', router: Basket.basketCustomerRouter },
    { module: 'product', router: Product.productCustomerRouter },
    { module: 'loyalty', router: Loyalty.loyaltyCustomerRouter },
    { module: 'payment', router: Payment.paymentCustomerRouter },
    { module: 'support', router: Support.supportCustomerRouter },
    { module: 'checkout', router: Checkout.checkoutCustomerRouter },
    { module: 'inventory', router: Inventory.inventoryCustomerRouter },
    { module: 'warehouse', router: Warehouse.warehouseCustomerRouter },
    { module: 'membership', router: Membership.membershipCustomerRouter },
    { module: 'subscription', router: Subscription.subscriptionCustomerRouter },
    { module: 'localization', router: Localization.localizationCustomerRouter },
    { module: 'shipping', router: Shipping.shippingCustomerRouter },
    { module: 'notification', router: Notification.notificationCustomerRouter },
    { module: 'coupon', router: Coupon.couponCustomerRouter },
    { module: 'promotion', router: Promotion.promotionCustomerRouter },
    { module: 'product', router: Product.categoryCustomerRouter },
    { module: 'store', router: Store.storeCustomerRouter },
    { module: 'fulfillment', router: Fulfillment.fulfillmentCustomerRouter },
    { module: 'content', router: Content.contentCustomerRouter },
    { module: 'product', router: searchCustomerRouter },
  ];
  const enabledCustomerRouters = customerRouters.filter(r => moduleRegistry.shouldMountRoutes(r.module)).map(r => r.router);
  app.use('/customer', enabledCustomerRouters);

  // Business/Merchant API routes — conditionally mounted based on module enabled state
  const businessRouters: { module: string; router: Router }[] = [
    { module: 'fulfillment', router: Fulfillment.fulfillmentLocationRouter },
    { module: 'identity', router: Identity.identityBusinessRouter },
    { module: 'organization', router: Organization.organizationBusinessRouter },
    { module: 'promotion', router: Promotion.promotionBusinessRouter },
    { module: 'product', router: Product.productBusinessRouter },
    { module: 'order', router: Order.orderBusinessRouter },
    { module: 'tax', router: Tax.taxBusinessRouter },
    { module: 'customer', router: Customer.customerBusinessRouter },
    { module: 'gdpr', router: Gdpr.gdprBusinessRouter },
    { module: 'subscription', router: Subscription.subscriptionBusinessRouter },
    { module: 'support', router: Support.supportBusinessRouter },
    { module: 'analytics', router: Analytics.analyticsBusinessRouter },
    { module: 'warehouse', router: Warehouse.warehouseMerchantRouter },
    { module: 'supplier', router: Supplier.supplierMerchantRouter },
    { module: 'localization', router: Localization.localizationMerchantRouter },
    { module: 'pricing', router: Pricing.pricingMerchantRouter },
    { module: 'loyalty', router: Loyalty.loyaltyMerchantRouter },
    { module: 'notification', router: Notification.notificationMerchantRouter },
    { module: 'content', router: Content.contentRouterAdmin },
    { module: 'membership', router: Membership.membershipBusinessRouter },
    { module: 'shipping', router: Shipping.shippingBusinessRouter },
    { module: 'inventory', router: Inventory.inventoryBusinessRouter },
    { module: 'payment', router: Payment.paymentBusinessRouter },
    { module: 'media', router: Media.mediaRouter },
    { module: 'store', router: Store.storeRouter },
    { module: 'configuration', router: Configuration.systemConfigurationRouter },
    { module: 'coupon', router: Coupon.couponBusinessRouter },
    { module: 'fulfillment', router: Fulfillment.fulfillmentBusinessRouter },
    { module: 'basket', router: Basket.basketBusinessRouter },
    { module: 'product', router: Product.attributeBusinessRouter },
    { module: 'webhook', router: Webhook.webhookBusinessRouter },
    { module: 'reporting', router: Reporting.reportingBusinessRouter },
    { module: 'audit', router: Audit.auditAdminRouter },
    { module: 'product', router: searchBusinessRouter },
    { module: 'segment', router: Segment.segmentBusinessRouter },
    { module: 'automation', router: Automation.automationBusinessRouter },
    { module: 'returns', router: Returns.returnBusinessRouter },
    { module: 'theme', router: Theme.themeBusinessRouter },
    { module: 'pagebuilder', router: PageBuilder.pageBuilderBusinessRouter },
    { module: 'tracking', router: Tracking.trackingBusinessRouter },
    { module: 'b2b', router: B2b.b2bBusinessRouter },
    { module: 'marketplace', router: Marketplace.marketplaceBusinessRouter },
    { module: 'identity', router: Identity.ssoRouter },
    { module: 'identity', router: Identity.scimRouter },
    { module: 'migration', router: Migration.migrationBusinessRouter },
    { module: 'integration', router: Integration.integrationBusinessRouter },
  ];
  const enabledBusinessRouters = businessRouters.filter(r => moduleRegistry.shouldMountRoutes(r.module)).map(r => r.router);
  app.use('/business', enabledBusinessRouters);

  // Audit middleware — auto-records mutating admin/business actions
  if (moduleRegistry.isEnabled('audit')) {
    app.use('/business', Audit.auditMiddleware);
  }

  // ─── Documentation site (Docsify) ────────────────────────────────────────
  const docsDir = path.resolve(__dirname, '../docs');
  if (fs.existsSync(docsDir)) {
    app.use('/docs', express.static(docsDir));
    app.get('/docs', (_req, res) => res.redirect('/docs/'));
  }

  // ─── Swagger UI (OpenAPI) ────────────────────────────────────────────────
  const openApiPath = path.resolve(__dirname, '../docs/generated/openapi.json');
  if (fs.existsSync(openApiPath)) {
    const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    app.use(
      '/docs/api',
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customCssUrl: undefined,
        customSiteTitle: 'CommerceFull API',
      } as swaggerUi.SwaggerUiOptions),
    );
  }

  // Health check endpoint (before other routes for load balancers)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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
