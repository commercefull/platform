import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import bodyParser from 'body-parser'
import i18nextMiddleware from 'i18next-http-middleware';
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import cors from 'cors';
import hpp from 'hpp';
import { pool } from "./libs/db/pool";
import passport from "passport";
import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from "./libs/form";
import { createSessionStore } from './libs/session/sessionStoreFactory';
import { initializeAnalyticsHandlers } from "./boot/analyticsEventHandler";
import { configureRoutes } from "./boot/routes";
import { expressHttpLogger } from "./libs/logger";

// Initialize analytics event handlers
initializeAnalyticsHandlers();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
let loadPath;

// ============================================================================
// Security Middleware (applied in ALL environments)
// ============================================================================

// Trust proxy when behind load balancer/reverse proxy
if (isProduction) {
  app.set('trust proxy', 1);
}

// Static file serving - must be before security middleware
app.use('/javascripts', express.static(path.join(__dirname, 'public/javascripts'), {
  maxAge: isProduction ? '1y' : 0, // Cache for 1 year in production
  etag: true,
  lastModified: true,
}));
app.use('/stylesheets', express.static(path.join(__dirname, 'public/stylesheets'), {
  maxAge: isProduction ? '1y' : 0,
  etag: true,
  lastModified: true,
}));
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  maxAge: isProduction ? '1y' : 0,
  etag: true,
  lastModified: true,
}));

// ============================================================================
// Security Middleware (applied in ALL environments)
// ============================================================================

// Trust proxy when behind load balancer/reverse proxy
if (isProduction) {
  app.set('trust proxy', 1);
}

// Helmet security headers - always enabled
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        "script-src": ["'self'", 'https://www.google-analytics.com', 'https://ssl.google-analytics.com', 'https://www.googletagmanager.com', 'https://unpkg.com'],
        "img-src": ["'self'", "data:", "https:", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
        "connect-src": ["'self'", 'https://www.google-analytics.com', 'https://api.stripe.com'],
        "font-src": ["'self'", 'https://fonts.gstatic.com'],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
        "object-src": ["'none'"],
        "script-src-attr": ["'none'"],
        "upgrade-insecure-requests": isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // May need adjustment for external resources
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }),
);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:10000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// HTTP Parameter Pollution protection
// Prevents attackers from polluting query/body parameters
app.use(hpp({
  whitelist: [
    // Allow arrays for these common filter parameters
    'ids',
    'tags',
    'categories',
    'status',
    'types',
    'fields',
    'include',
    'sort',
  ],
}));

// Compression (production only for performance)
if (isProduction) {
  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
  }));
}

// ============================================================================
// View Engine & Static Files
// ============================================================================

if (isProduction) {
  const __dirname = path.resolve();
  app.set("views", path.join(__dirname, "web"));
  app.use(express.static(path.join(__dirname, "public"), {
    maxAge: '1d',
    etag: true,
  }));
  loadPath = path.join(__dirname, 'locales/{{lng}}/{{ns}}.json');
} else {
  app.set("views", path.join(__dirname, "web"));
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

app.use(bodyParser.urlencoded({ limit: "10mb", extended: true, parameterLimit: 1000 }))

app.set("view engine", "ejs");
app.locals.t = function (key: string) {
  return i18next.t(key);
};

app.use(expressHttpLogger);
app.use(express.json({ limit: '1mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration with secure defaults
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (isProduction) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters in production');
  }
  console.warn('WARNING: SESSION_SECRET is not set or too short. Using insecure default for development.');
}

// Create session store - uses Redis if REDIS_URL/REDIS_HOST is set, otherwise PostgreSQL
const sessionStoreResult = createSessionStore({
  type: 'auto', // Automatically choose based on environment
  postgres: {
    pool: pool,
    tableName: 'session',
    pruneSessionInterval: 60 * 15, // 15 minutes
  },
  redis: {
    keyPrefix: 'sess:',
  },
});


app.use(
  session({
    secret: sessionSecret || 'dev-only-insecure-secret-do-not-use-in-production',
    name: 'sid', // Don't use default 'connect.sid' - reveals tech stack
    store: sessionStoreResult.store,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored (GDPR)
    rolling: true, // Reset expiry on each request
    cookie: {
      maxAge: 60 * 1000 * 60 * 3, // 3 hours
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS access to cookie
      sameSite: 'lax', // CSRF protection
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    },
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Make session data available in templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  // Make flash messages available to templates (take first message from array)
  res.locals.successMsg = req.flash('success')[0] || null;
  res.locals.errorMsg = req.flash('error')[0] || null;
  next();
});

// Configure all routes
configureRoutes(app);

// Global error handler - never expose stack traces in production
app.use(function (err: any, req: Request, res: Response, _next: NextFunction) {
  // Log error for debugging (use proper logging in production)
  console.error('Error:', {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  res.locals.message = isProduction ? 'An error occurred' : err.message;
  res.locals.error = isProduction ? {} : err;
  
  const status = err.status || 500;
  res.status(status);
  
  // Return JSON for API requests
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({
      success: false,
      message: isProduction ? 'Internal server error' : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  } else {
    res.render("storefront/views/error", {
      pageName: "Error",
      message: res.locals.message,
      error: res.locals.error,
      user: req.user,
      session: req.session,
      successMsg: res.locals.successMsg,
      errorMsg: res.locals.errorMsg,
      categories: []
    });
  }
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
  
});

module.exports = app;