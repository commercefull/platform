import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import flash from 'connect-flash';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import bodyParser from 'body-parser';
import i18nextMiddleware from 'i18next-http-middleware';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import cors from 'cors';
import hpp from 'hpp';
import { pool } from './libs/db/pool';
import { runWithTestDb } from './libs/db/testDbContext';
import { startQueryCounterContext } from './libs/db/queryCounter';
import passport from 'passport';
import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from './libs/form';
import { createSessionStore } from './libs/session/sessionStoreFactory';
import { initializeAnalyticsHandlers } from './boot/analyticsEventHandler';
import { configureRoutes } from './boot/routes';
import { expressHttpLogger, logger } from './libs/logger';
import { errorMiddleware } from './libs/errorMiddleware';
import { correlationIdMiddleware } from './libs/correlationId';
import { registerAllEventHandlers } from './libs/events/registerEventHandlers';
import { startOutboxDispatcher, stopOutboxDispatcher } from './libs/events/outboxDispatcher';
import { initializeScheduledJobs } from './libs/jobs/cronScheduler';
import { loadOrgRolePolicies } from './libs/rbac/rolePolicyRepository';
import { registerModuleManifestsSync } from './boot/moduleManifests';
import { themeRegistry } from './modules/theme/domain/services/ThemeRegistry';
import { blockSchemaRegistry } from './modules/pagebuilder/domain/services/BlockSchemaRegistry';
import { validateAllSecrets, validateCorsOrigins, getSecret } from './libs/secrets';

// Register module manifests and initialize registry (sync, env-var based)
registerModuleManifestsSync();

// Register built-in themes in the in-memory theme registry
themeRegistry.registerBuiltInThemes();

// Register built-in block types in the block schema registry
blockSchemaRegistry.registerBuiltIns();

// Validate all required secrets — fail fast in production before any service starts
validateAllSecrets();

// Initialize event handlers and outbox dispatcher
registerAllEventHandlers();
initializeAnalyticsHandlers();

// Start the durable outbox dispatcher (claim-based, multi-node safe)
if (process.env.OUTBOX_DISABLED !== '1') {
  startOutboxDispatcher();
}

// Start scheduled jobs (cron)
if (process.env.CRON_DISABLED !== '1') {
  initializeScheduledJobs();
}

// Load per-organization role policies into RBAC cache
if (process.env.POSTGRES_HOST) {
  loadOrgRolePolicies().catch(() => {
    // Non-fatal — system defaults will be used
  });
}

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
app.use(
  '/javascripts',
  express.static(path.join(__dirname, 'public/javascripts'), {
    maxAge: isProduction ? '1y' : 0, // Cache for 1 year in production
    etag: true,
    lastModified: true,
  }),
);
app.use(
  '/stylesheets',
  express.static(path.join(__dirname, 'public/stylesheets'), {
    maxAge: isProduction ? '1y' : 0,
    etag: true,
    lastModified: true,
  }),
);
app.use(
  '/images',
  express.static(path.join(__dirname, 'public/images'), {
    maxAge: isProduction ? '1y' : 0,
    etag: true,
    lastModified: true,
  }),
);

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
        'default-src': ["'self'"],
        'style-src': [
          "'self'",
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          'https://code.ionicframework.com',
          "'unsafe-inline'",
        ],
        'script-src': [
          "'self'",
          'https://www.google-analytics.com',
          'https://ssl.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          ...(isProduction ? [] : ["'unsafe-inline'"]),
        ],
        'img-src': [
          "'self'",
          'data:',
          'https:',
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://preview.tabler.io',
        ],
        'connect-src': [
          "'self'",
          'https://www.google-analytics.com',
          'https://api.stripe.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          'https://code.ionicframework.com',
          ...(isProduction ? [] : ['ws:', 'wss:']),
        ],
        'font-src': [
          "'self'",
          'https://fonts.gstatic.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          'https://code.ionicframework.com',
          'data:',
        ],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'upgrade-insecure-requests': isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // May need adjustment for external resources
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }),
);

// CORS configuration — validated origins (fail-fast in production)
const corsOptions: cors.CorsOptions = {
  origin: validateCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// HTTP Parameter Pollution protection
// Prevents attackers from polluting query/body parameters
app.use(
  hpp({
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
  }),
);

// Compression (production only for performance)
if (isProduction) {
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
    }),
  );
}

// ============================================================================
// View Engine & Static Files
// ============================================================================

if (isProduction) {
  const __dirname = path.resolve();
  app.set('views', path.join(__dirname, 'web'));
  app.use(
    express.static(path.join(__dirname, 'public'), {
      maxAge: '1d',
      etag: true,
    }),
  );
  loadPath = path.join(__dirname, 'locales/{{lng}}/{{ns}}.json');
} else {
  app.set('views', path.join(__dirname, 'web'));
  app.use(express.static(path.join(__dirname, 'public')));
  loadPath = __dirname + '/locales/{{lng}}/{{ns}}.json';
}

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    debug: false,
    backend: {
      loadPath,
    },
    fallbackLng: 'en',
    preload: ['en', 'de', 'es', 'fr', 'it', 'el', 'sq', 'pt', 'zh', 'hi', 'ru', 'id', 'ja', 'tr', 'ko', 'vi'],
    ns: ['shared', 'auth', 'basket', 'checkout', 'content', 'customer', 'distribution', 'merchant', 'order', 'product', 'promotion', 'tax', 'storefront', 'analytics', 'operations', 'platform', 'marketing', 'notifications', 'payment', 'inventory', 'users', 'settings', 'support', 'b2b', 'loyalty', 'subscription', 'membership', 'gdpr', 'reporting', 'salesSegment', 'auditLog', 'organization'],
    defaultNS: 'shared',
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'lang',
      ignoreCase: true,
      cookieSecure: false,
    },
  });

app.use(
  i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ['/css', '/fonts', '/images', '/js', '/vendors', '/webfonts'],
    removeLngFromUrl: false,
  }),
);

app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 1000 }));

app.set('view engine', 'ejs');
app.locals.t = function (key: string) {
  return i18next.t(key);
};

// Correlation ID — must be early so all downstream middleware/logs have it
app.use(correlationIdMiddleware);

app.use(expressHttpLogger);
// Skip JSON parsing for webhook route — needs raw Buffer for signature verification
app.use((req, res, next) => {
  if (req.path === '/payment/webhook') {
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration — secret validated via libs/secrets (fail-fast in production)
const sessionSecret = getSecret('SESSION_SECRET');

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
  }),
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

// Test database isolation middleware — routes DB queries to a per-test database
app.use((req, res, next) => {
  const testDb = req.headers['x-test-database'] as string | undefined;
  if (testDb) {
    return runWithTestDb(testDb, () => next());
  }
  next();
});

// Query-count middleware — wraps each request in a query counter context.
// In dev/test mode, patches res.end to inject the X-Query-Count response header
// so integration tests can assert per-endpoint query budgets (N+1 detection).
app.use((req, res, next) => {
  const state = startQueryCounterContext(() => next());

  if (isProduction === false) {
    const originalEnd = res.end.bind(res);
    res.end = ((...args: Parameters<typeof res.end>) => {
      res.setHeader('X-Query-Count', String(state.count));
      return originalEnd(...args);
    }) as typeof res.end;
  }
});

// Configure all routes
configureRoutes(app);

// Global error handler — central error middleware
// Maps AppError.statusCode, logs at declared severity, emits RFC 7807 problem+json
app.use(errorMiddleware);

app.locals.formText = formText;
app.locals.formInput = formInput;
app.locals.formSelect = formSelect;
app.locals.formLegend = formLegend;
app.locals.formCheckbox = formCheckbox;
app.locals.formMultiSelect = formMultiSelect;
app.locals.formHidden = formHidden;
app.locals.formSubmit = formSubmit;

const port = process.env.PORT || 10000;
app.set('port', port);
const server = app.listen(port, () => {
  logger.info(`CommerceFull service started on port ${port}`);
});

server.on('error', (err: Error) => {
  logger.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopOutboxDispatcher().finally(() => {
    server.close(() => process.exit(0));
  });
});

process.on('SIGINT', () => {
  stopOutboxDispatcher().finally(() => {
    server.close(() => process.exit(0));
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

export default app;
