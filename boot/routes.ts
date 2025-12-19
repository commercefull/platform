import { Express } from "express";

// Storefront routes
import { storefrontCustomerRouter } from "../web/storefront/storefrontRouter";

// Feature routes - Customer facing
import { identityCustomerRouter } from "../modules/identity/interface/routers/identityCustomerRouter";
import { identitySocialRouter } from "../modules/identity/interface/routers/identitySocialRouter";
import { customerRouter } from "../modules/customer/interface/routers/customerRouter";
import { taxCustomerRouter } from "../modules/tax/taxCustomerRouter";
import { b2bCustomerRouter } from "../modules/b2b/b2bCustomerRouter";
import { gdprCustomerRouter } from "../modules/gdpr/gdprCustomerRouter";
import { orderCustomerRouter } from "../modules/order/interface/routers/customerRouter";
import { basketCustomerRouter } from "../modules/basket/interface/routers/basketRouter";
import { productCustomerRouter } from "../modules/product/interface/routers/productCustomerRouter";
import { loyaltyCustomerRouter } from "../modules/loyalty/loyaltyCustomerRouter";
import { paymentCustomerRouter } from "../modules/payment/interface/routers/paymentCustomerRouter";
import { supportCustomerRouter } from "../modules/support/supportCustomerRouter";
import { checkoutCustomerRouter } from "../modules/checkout/interface/routers/checkoutRouter";
import { inventoryCustomerRouter } from "../modules/inventory/interface/routers/customerRouter";
import { marketingCustomerRouter } from "../modules/marketing/marketingCustomerRouter";
import { warehouseCustomerRouter } from "../modules/warehouse/warehouseCustomerRouter";
import { membershipCustomerRouter } from "../modules/membership/membershipCustomerRouter";
import { distributionCustomerRouter } from "../modules/distribution/distributionCustomerRouter";
import { subscriptionCustomerRouter } from "../modules/subscription/subscriptionCustomerRouter";
import { localizationCustomerRouter } from "../modules/localization/localizationCustomerRouter";
import { shippingCustomerRouter } from "../modules/shipping/shippingCustomerRouter";

// Feature routes - Business/Merchant facing
import { identityBusinessRouter } from "../modules/identity/interface/routers/identityBusinessRouter";
import { merchantMerchantRouter } from "../modules/merchant/merchantBusinessRouter";
import { promotionBusinessRouter } from "../modules/promotion/interface/routers/businessRouter";
import { productBusinessRouter } from "../modules/product/interface/routers/productBusinessRouter";
import { orderBusinessRouter } from "../modules/order/interface/routers/businessRouter";
import { distributionBusinessRouter } from "../modules/distribution/distributionBusinessRouter";
import { taxBusinessRouter } from "../modules/tax/taxBusinessRouter";
import { customerBusinessRouter } from "../modules/customer/interface/routers/businessRouter";
import { gdprBusinessRouter } from "../modules/gdpr/gdprBusinessRouter";
import { marketingBusinessRouter } from "../modules/marketing/marketingBusinessRouter";
import { b2bBusinessRouter } from "../modules/b2b/b2bBusinessRouter";
import { subscriptionBusinessRouter } from "../modules/subscription/subscriptionBusinessRouter";
import { supportBusinessRouter } from "../modules/support/supportBusinessRouter";
import { analyticsBusinessRouter } from "../modules/analytics/analyticsBusinessRouter";
import { warehouseMerchantRouter } from "../modules/warehouse/warehouseBusinessRouter";
import { supplierMerchantRouter } from "../modules/supplier/supplierBusinessRouter";
import { localizationMerchantRouter } from "../modules/localization/localizationBusinessRouter";
import { pricingMerchantRouter } from "../modules/pricing/pricingBusinessRouter";
import { loyaltyMerchantRouter } from "../modules/loyalty/loyaltyBusinessRouter";
import { notificationMerchantRouter } from "../modules/notification/notificationBusinessRouter";
import { contentRouterAdmin } from "../modules/content/contentBusinessRouter";
import { membershipBusinessRouter } from "../modules/membership/membershipBusinessRouter";
import { shippingBusinessRouter } from "../modules/shipping/shippingBusinessRouter";
import { inventoryBusinessRouter } from "../modules/inventory/interface/routers/businessRouter";
import { paymentBusinessRouter } from "../modules/payment/interface/routers/paymentBusinessRouter";
import { adminRouter } from "../web/admin/adminRouters";

/**
 * Configure all application routes
 */
export function configureRoutes(app: Express): void {
  // Storefront routes (public website)
  app.use("/", storefrontCustomerRouter);

  app.use("/admin", adminRouter);

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
    shippingCustomerRouter,
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
    membershipBusinessRouter,
    shippingBusinessRouter,
    inventoryBusinessRouter,
    paymentBusinessRouter,
  ]);

  // Health check endpoint (before other routes for load balancers)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler - catch all unmatched routes
  app.use(function (_req, res) {
    res.status(404).json({ status: 'not found', timestamp: new Date().toISOString() });
  });
}
