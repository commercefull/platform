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
import { basketCustomerRouter } from "./features/basket/basketCustomerRouter";
import { contentRouter } from "./features/content/contentCustomerRouter";
import { checkoutRouter } from "./features/checkout/checkoutCustomerRouter";
import { orderCustomerRouter } from "./features/order/orderCustomerRouter";
import { orderMerchantRouter } from "./features/order/orderMerchantRouter";
import { distributionMerchantRouter } from "./features/distribution/distributionMerchantRouter";
import { merchantMerchantRouter } from "./features/merchant/merchantMerchantRouter";
import { authMerchantRouter } from "./features/auth/authMerchantRouter";
import { taxMerchantRouter } from "./features/tax/taxMerchantRouter";
import { taxCustomerRouter } from "./features/tax/taxCustomerRouter";
import { productMerchantRouter } from "./features/product/productMerchantRouter";
import { productCustomerRouter } from "./features/product/productCustomerRouter";
import { inventoryCustomerRouter } from "./features/inventory/inventoryCustomerRouter";
import { paymentCustomerRouter } from "./features/payment/paymentCustomerRouter";
import { promotionMerchantRouter } from "./features/promotion/promotionMerchantRouter";
import { distributionCustomerRouter } from "./features/distribution/distributionCustomerRouter";
import { customerMerchantRouter } from "./features/customer/customerMerchantRouter";
import { customerRouter } from "./features/customer/customerRouter";
import { authCustomerRouter } from "./features/auth/authCustomerRouter";
import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from "./libs/form";

const pgSession = require('connect-pg-simple')(session);

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
    backend: {
      loadPath
    },
    fallbackLng: 'en',
    preload: ['en', 'de', 'es', 'fr', 'it', 'pt', 'el', 'sq'],
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'lang',
      ignoreCase: true,
      cookieSecure: false
    },
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
app.use("/", contentRouter);
app.use("/auth", authCustomerRouter);
app.use("/customer", customerRouter);
app.use("/basket", basketCustomerRouter);
app.use("/order", orderCustomerRouter);
app.use("/checkout", checkoutRouter);
app.use("/tax", taxCustomerRouter);
app.use("/products", productCustomerRouter);
app.use("/payment", paymentCustomerRouter);
app.use("/inventory", inventoryCustomerRouter);
app.use("/distribution", distributionCustomerRouter);
app.use("/merchant", [
  authMerchantRouter,
  merchantMerchantRouter, 
  promotionMerchantRouter, 
  productMerchantRouter, 
  orderMerchantRouter, 
  distributionMerchantRouter,
  taxMerchantRouter,
  customerMerchantRouter
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