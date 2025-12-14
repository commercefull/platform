import { Express } from "express";

// Storefront routes
import { storefrontCustomerRouter } from "./templates/storefront/storefrontRouter";

// Feature routes - Customer facing
import { identityCustomerRouter } from "./features/identity/interface/routers/identityCustomerRouter";
import { identitySocialRouter } from "./features/identity/interface/routers/identitySocialRouter";
import { customerRouter } from "./features/customer/interface/routers/customerRouter";
import { taxCustomerRouter } from "./features/tax/taxCustomerRouter";
import { b2bCustomerRouter } from "./features/b2b/b2bCustomerRouter";
import { gdprCustomerRouter } from "./features/gdpr/gdprCustomerRouter";
import { orderCustomerRouter } from "./features/order/interface/routers/customerRouter";
import { basketCustomerRouter } from "./features/basket/interface/routers/basketRouter";
import { productCustomerRouter } from "./features/product/interface/routers/productCustomerRouter";
import { loyaltyCustomerRouter } from "./features/loyalty/loyaltyCustomerRouter";
import { paymentCustomerRouter } from "./features/payment/interface/routers/paymentCustomerRouter";
import { supportCustomerRouter } from "./features/support/supportCustomerRouter";
import { checkoutCustomerRouter } from "./features/checkout/interface/routers/checkoutRouter";
import { inventoryCustomerRouter } from "./features/inventory/interface/routers/customerRouter";
import { marketingCustomerRouter } from "./features/marketing/marketingCustomerRouter";
import { warehouseCustomerRouter } from "./features/warehouse/warehouseCustomerRouter";
import { membershipCustomerRouter } from "./features/membership/membershipCustomerRouter";
import { distributionCustomerRouter } from "./features/distribution/distributionCustomerRouter";
import { subscriptionCustomerRouter } from "./features/subscription/subscriptionCustomerRouter";
import { localizationCustomerRouter } from "./features/localization/localizationCustomerRouter";

// Feature routes - Business/Merchant facing
import { identityBusinessRouter } from "./features/identity/interface/routers/identityBusinessRouter";
import { merchantMerchantRouter } from "./features/merchant/merchantBusinessRouter";
import { promotionBusinessRouter } from "./features/promotion/interface/routers/businessRouter";
import { productBusinessRouter } from "./features/product/interface/routers/productBusinessRouter";
import { orderBusinessRouter } from "./features/order/interface/routers/businessRouter";
import { distributionBusinessRouter } from "./features/distribution/distributionBusinessRouter";
import { taxBusinessRouter } from "./features/tax/taxBusinessRouter";
import { customerBusinessRouter } from "./features/customer/interface/routers/businessRouter";
import { gdprBusinessRouter } from "./features/gdpr/gdprBusinessRouter";
import { marketingBusinessRouter } from "./features/marketing/marketingBusinessRouter";
import { b2bBusinessRouter } from "./features/b2b/b2bBusinessRouter";
import { subscriptionBusinessRouter } from "./features/subscription/subscriptionBusinessRouter";
import { supportBusinessRouter } from "./features/support/supportBusinessRouter";
import { analyticsBusinessRouter } from "./features/analytics/analyticsBusinessRouter";
import { warehouseMerchantRouter } from "./features/warehouse/warehouseBusinessRouter";
import { supplierMerchantRouter } from "./features/supplier/supplierBusinessRouter";
import { localizationMerchantRouter } from "./features/localization/localizationBusinessRouter";
import { pricingMerchantRouter } from "./features/pricing/pricingBusinessRouter";
import { loyaltyMerchantRouter } from "./features/loyalty/loyaltyBusinessRouter";
import { notificationMerchantRouter } from "./features/notification/notificationBusinessRouter";
import { contentRouterAdmin } from "./features/content/contentBusinessRouter";
import { membershipBusinessRouter } from "./features/membership/membershipBusinessRouter";

/**
 * Configure all application routes
 */
export function configureRoutes(app: Express): void {
  // Health check endpoint (before other routes for load balancers)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Storefront routes (public website)
  app.use("/", storefrontCustomerRouter);

  // Customer-facing API routes
  app.use("/customer", [
    identityCustomerRouter,  // Must be first - public auth routes
    identitySocialRouter,    // Social login routes
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
    marketingCustomerRouter,
    warehouseCustomerRouter,
    membershipCustomerRouter,
    distributionCustomerRouter,
    subscriptionCustomerRouter,
    localizationCustomerRouter,
  ]);

  // Business/Merchant API routes
  app.use("/business", [
    identityBusinessRouter,
    merchantMerchantRouter,
    promotionBusinessRouter,
    productBusinessRouter,
    orderBusinessRouter,
    distributionBusinessRouter,
    taxBusinessRouter,
    customerBusinessRouter,
    gdprBusinessRouter,
    marketingBusinessRouter,
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
    membershipBusinessRouter
  ]);

  // 404 handler - catch all unmatched routes
  app.use(function (req, res) {
    res.status(404);
    res.render("storefront/views/404");
  });
}
