import express, { Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import flash from "connect-flash";
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import bodyParser from 'body-parser'
import i18nextMiddleware from 'i18next-http-middleware';
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import { pool } from "./libs/db/pool";
import passport from "passport";
import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from "./libs/form";
import { storefrontCustomerRouter } from "./storefront/storefrontRouter";
import { distributionBusinessRouter } from "./features/distribution/distributionBusinessRouter";
import { merchantMerchantRouter } from "./features/merchant/merchantBusinessRouter";
import { taxBusinessRouter } from "./features/tax/taxBusinessRouter";
import { taxCustomerRouter } from "./features/tax/taxCustomerRouter";
import { distributionCustomerRouter } from "./features/distribution/distributionCustomerRouter";
import gdprRouter from "./features/gdpr/gdprRouter";
import { gdprBusinessRouter } from "./features/gdpr/gdprBusinessRouter";
import { basketCustomerRouter } from "./features/basket/interface/routers/basketRouter";
import { orderBusinessRouter } from "./features/order/interface/routers/businessRouter";
import { orderCustomerRouter } from "./features/order/interface/routers/customerRouter";
import { checkoutCustomerRouter } from "./features/checkout/interface/routers/checkoutRouter";
import { productBusinessRouter } from "./features/product/interface/routers/businessRouter";
import { promotionBusinessRouter } from "./features/promotion/interface/routers/businessRouter";
import { inventoryCustomerRouter } from "./features/inventory/interface/routers/customerRouter";
import { paymentCustomerRouter } from "./features/payment/interface/routers/customerRouter";
import { productCustomerRouter } from "./features/product/interface/routers/customerRouter";
import { customerRouter } from "./features/customer/interface/routers/customerRouter";
import { customerBusinessRouter } from "./features/customer/interface/routers/businessRouter";
import { identityBusinessRouter } from "./features/identity/interface/routers/identityBusinessRouter";
import { identityCustomerRouter } from "./features/identity/interface/routers/identityCustomerRouter";
import { marketingBusinessRouter } from "./features/marketing/marketingBusinessRouter";
import { marketingCustomerRouter } from "./features/marketing/marketingCustomerRouter";
import { b2bBusinessRouter } from "./features/b2b/b2bBusinessRouter";
import { b2bCustomerRouter } from "./features/b2b/b2bCustomerRouter";
import { subscriptionBusinessRouter } from "./features/subscription/subscriptionBusinessRouter";
import { subscriptionCustomerRouter } from "./features/subscription/subscriptionCustomerRouter";
import { supportBusinessRouter } from "./features/support/supportBusinessRouter";
import { supportCustomerRouter } from "./features/support/supportCustomerRouter";
import { analyticsBusinessRouter } from "./features/analytics/analyticsBusinessRouter";
import { initializeAnalyticsHandlers } from "./features/analytics/services/analyticsEventHandler";
import { warehouseMerchantRouter } from "./features/warehouse/warehouseBusinessRouter";
import { warehouseCustomerRouter } from "./features/warehouse/warehouseCustomerRouter";
import { supplierMerchantRouter } from "./features/supplier/supplierBusinessRouter";
import { localizationMerchantRouter } from "./features/localization/localizationBusinessRouter";
import { localizationCustomerRouter } from "./features/localization/localizationCustomerRouter";
import { pricingMerchantRouter } from "./features/pricing/pricingBusinessRouter";
import { loyaltyMerchantRouter } from "./features/loyalty/loyaltyBusinessRouter";
import { loyaltyCustomerRouter } from "./features/loyalty/loyaltyCustomerRouter";
import { notificationMerchantRouter } from "./features/notification/notificationBusinessRouter";
import { contentRouterAdmin } from "./features/content/contentBusinessRouter";
const pgSession = require('connect-pg-simple')(session);

// Initialize analytics event handlers
initializeAnalyticsHandlers();

const app = express();
let loadPath;

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "public")));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "style-src": ["'self'", "https:", "'unsafe-inline'"],
          "script-src": ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com', 'https://ssl.google-analytics.com', 'https://www.googletagmanager.com'], // <2>
          "img-src": ["'self'", "data:", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'], // <1>
          "connect-src": ["'self'", 'https://www.google-analytics.com'],
          "font-src": ["'self'", 'https://fonts.gstatic.com'],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
          "frame-ancestors": ["'self'"],
          "object-src": ["'none'"],
          "script-src-attr": ["'none'"],
        },
      },
    }),
  );

  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false
      }
      return compression.filter(req, res)
    }
  }))
  loadPath = path.join(__dirname, 'locales/{{lng}}/{{ns}}.json');

} else {
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "public")));
  loadPath = __dirname + '/locales/{{lng}}/{{ns}}.json';
}

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    debug: false,
    backend: {
      loadPath
    },
    fallbackLng: 'en',
    preload: ['en', 'de', 'es', 'fr', 'it', 'el', 'sq'],
    ns: ['shared', 'auth', 'basket', 'checkout', 'customer', 'distribution', 'merchant', 'order', 'product', 'promotion', 'tax'],
    defaultNS: 'shared',
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'lang',
      ignoreCase: true,
      cookieSecure: false
    },
    initImmediate: true, // Initialize i18next synchronously to prevent race conditions
  });

app.use(
  i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ['/css', '/fonts', '/images', '/js', '/vendors', '/webfonts'],
    removeLngFromUrl: false
  })
)

app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }))

app.set("view engine", "ejs");
app.locals.t = function (key: string) {
  return i18next.t(key);
};

app.use(logger("short"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "",
    store: new pgSession({
      pool: pool,
    }),
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 1000 * 60 * 3 }, //session expires after 3 hours
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(async (req: Request, res: Response, next) => {
  try {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    next();
  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
});

//routes config
app.use("/", storefrontCustomerRouter);
app.use("/identity", identityCustomerRouter);
app.use("/customer", customerRouter);
app.use("/basket", basketCustomerRouter);
app.use("/order", orderCustomerRouter);
app.use("/checkout", checkoutCustomerRouter);
app.use("/tax", taxCustomerRouter);
app.use("/products", productCustomerRouter);
app.use("/payment", paymentCustomerRouter);
app.use("/inventory", inventoryCustomerRouter);
app.use("/distribution", distributionCustomerRouter);
app.use("/gdpr", gdprRouter);
app.use("/marketing", marketingCustomerRouter);
app.use("/b2b", b2bCustomerRouter);
app.use("/subscriptions", subscriptionCustomerRouter);
app.use("/support", supportCustomerRouter);
app.use("/warehouse", warehouseCustomerRouter);
app.use("/localization", localizationCustomerRouter);
app.use("/loyalty", loyaltyCustomerRouter);
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
  contentRouterAdmin
]);


// catch 404 and forward to error handler
app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

// error handler
app.use(function (err: any, req: any, res: any) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

app.locals.formText = formText;
app.locals.formInput = formInput;
app.locals.formSelect = formSelect;
app.locals.formLegend = formLegend;
app.locals.formCheckbox = formCheckbox;
app.locals.formMultiSelect = formMultiSelect;
app.locals.formHidden = formHidden;
app.locals.formSubmit = formSubmit;

const port = process.env.PORT || 10000;
app.set("port", port);
app.listen(port, () => {
  console.log("Server running at port " + port);
});

module.exports = app;