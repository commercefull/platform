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
import { Passport } from "./modules/merchant/passport";
import { storefrontRoutes } from "./routes/storefront/routes";
import { storefrontApiRoutes } from "./routes/storefront-api/routes";
import { merchantRoutes } from "./routes/merchant/routes";
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
app.use(Passport.initialize());
app.use(Passport.session());

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

app.use("/", storefrontRoutes);
app.use("/api", storefrontApiRoutes);
app.use("/merchant", merchantRoutes);

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

const port = process.env.PORT || 10000;
app.set("port", port);
app.listen(port, () => {
  console.log("Server running at port " + port);
});

module.exports = app;