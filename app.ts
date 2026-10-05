import express, { Request, Response } from 'express';
import path from 'path';
import { cookieParser } from './libs/cookieParser';
import { flashMiddleware, popFlashMessages } from './libs/flash';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import cors from 'cors';
import { hpp } from './libs/hpp';
import { closeDatabasePool, getPoolStats, pool } from './libs/db/pool';
import { resolveTestDatabase, runWithTestDb } from './libs/db/testDbContext';
import { startQueryCounterContext } from './libs/db/queryCounter';
import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from './libs/form';
import { createSessionStore } from './libs/session/sessionStoreFactory';
import { configureRoutes } from './boot/routes';
import { expressHttpLogger, logger } from './libs/logger';
import { errorMiddleware } from './libs/errorMiddleware';
import { correlationIdMiddleware } from './libs/correlationId';
import { registerAllEventHandlers } from './boot/registerEventHandlers';
import { startEventSubscriber, stopEventTransport } from './libs/events/transportRegistry';
import { initEventTransport } from './libs/events/providers';
import { eventBus } from './libs/events/eventBus';
import { initializeScheduledJobs } from './boot/scheduledJobs';
import { loadOrgRolePolicies } from './libs/rbac/rolePolicyRepository';
import { registerModuleManifestsSync } from './boot/moduleManifests';
import { themeRegistry } from './modules/theme/domain/services/ThemeRegistry';
import { blockSchemaRegistry } from './modules/pagebuilder/domain/services/BlockSchemaRegistry';
import { flushAnalyticsWrites } from './modules/analytics/infrastructure';
import { validateAllSecrets, validateCorsOrigins, getSecret } from './libs/secrets';
import { AUTH_RATE_LIMITED_PATHS, createOriginVerifyMiddleware, createRateLimiters, resolveTrustProxy } from './libs/httpSecurity';
import { closeRedisClient, getRedisClient } from './libs/redisClient';
import { createHealthService } from './libs/health';
import { cronScheduler } from './libs/jobs/cronScheduler';
import { jsonResponse, sendResponse, setHeader } from './libs/apiResponse';
import { loadAssetManifest } from './libs/assets';
import { observeHttpRequest, renderRuntimeMetrics } from './libs/runtimeMetrics';

const PRODUCTION_CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/',
  'https://cdn.jsdelivr.net/npm/@tabler/core@1.4.0/',
  'https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0-beta17/',
];

const SUPPORTED_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'el', 'sq', 'pt', 'zh', 'hi', 'ru', 'id', 'ja', 'tr', 'ko', 'vi'];

// Register module manifests and initialize registry (sync, env-var based)
registerModuleManifestsSync();

// Register built-in themes in the in-memory theme registry
themeRegistry.registerBuiltInThemes();

// Register built-in block types in the block schema registry
blockSchemaRegistry.registerBuiltIns();

// Validate all required secrets before any service starts
validateAllSecrets();

// Initialize event handlers (module-gated; analytics included) and event transport
registerAllEventHandlers();

const redisRequired = process.env.CACHE_BACKEND === 'redis' || process.env.SESSION_BACKEND === 'redis';
const healthService = createHealthService({
  checkDatabase: async () => {
    await pool.query('SELECT 1');
  },
  checkRedis: async () => {
    await getRedisClient().ping();
  },
  requiresRedis: redisRequired,
  timeoutMs: Number(process.env.HEALTH_CHECK_TIMEOUT_MS || 2_000),
});

// Install the configured event transport and start its subscriber.
// EVENT_BUS_PROVIDER=memory|postgres|gcp-pubsub|aws-sqs|azure-servicebus
// (default: memory — in-process dispatch). OUTBOX_DISABLED=1 is a legacy
// override that forces the memory provider.
initEventTransport(eventBus.dispatch.bind(eventBus))
  .then(async () => {
    if (process.env.EVENT_CONSUMER_DISABLED !== '1') await startEventSubscriber();
    healthService.markStarted();
  })
  .catch(err => {
    logger.error('Event transport init failed', {
      error: (err as Error).message,
    });
  });

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
const rootDir = path.resolve();
const assetManifest = loadAssetManifest();
app.locals.storefrontJsPath = isProduction ? assetManifest.storefrontJs : '/javascripts/storefront/main.js';
app.locals.storefrontCssPath = isProduction ? assetManifest.storefrontCss : '/stylesheets/storefront/compiled.css';
let loadPath;

// ============================================================================
// Security Middleware (applied in ALL environments)
// ============================================================================

// Trust exactly TRUST_PROXY hops (default 1 in production) so req.ip cannot be
// spoofed through X-Forwarded-For
app.set('trust proxy', resolveTrustProxy(process.env.TRUST_PROXY, isProduction));

// Reject requests that bypass the CDN/WAF (active when ORIGIN_VERIFY_SECRET is set)
app.use(createOriginVerifyMiddleware());

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
          // Whole-host CDN allowances let an attacker load any npm package (CSP bypass) —
          // production pins only the packages the templates actually use.
          ...(isProduction
            ? PRODUCTION_CDN_SCRIPTS
            : ['https://unpkg.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', "'unsafe-inline'"]),
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
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => observeHttpRequest(req.method, req.path, res.statusCode, Date.now() - startedAt));
  next();
});

app.get('/live', (_req, res) => jsonResponse(res, 200, healthService.liveness()));
app.get('/ready', async (_req, res) => {
  const report = await healthService.readiness();
  jsonResponse(res, report.status === 'ok' ? 200 : 503, report);
});
app.get('/health', async (_req, res) => {
  const report = await healthService.readiness();
  jsonResponse(res, report.status === 'ok' ? 200 : 503, report);
});
if (process.env.METRICS_ENABLED === '1') {
  app.get('/metrics', (_req, res) => {
    setHeader(res, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    sendResponse(res, 200, renderRuntimeMetrics(getPoolStats()));
  });
}

// Static file serving — after helmet so assets also carry security headers
app.use(
  '/javascripts',
  express.static(path.join(rootDir, 'public/javascripts'), {
    maxAge: isProduction ? '1h' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{12}\.js$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);
app.use(
  '/stylesheets',
  express.static(path.join(rootDir, 'public/stylesheets'), {
    maxAge: isProduction ? '1h' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{12}\.css$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);
app.use(
  '/images',
  express.static(path.join(rootDir, 'public/images'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true,
    lastModified: true,
  }),
);

// Rate limiting — global per-IP budget + strict budget on credential endpoints
const { globalLimiter, authLimiter } = createRateLimiters();
app.use(globalLimiter);
app.use(AUTH_RATE_LIMITED_PATHS, authLimiter);

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
  app.set('views', path.join(rootDir, 'web'));
  app.use(
    express.static(path.join(rootDir, 'public'), {
      maxAge: '1d',
      etag: true,
    }),
  );
  loadPath = path.join(rootDir, 'locales/{{lng}}/{{ns}}.json');
} else {
  app.set('views', path.join(rootDir, 'web'));
  app.use(express.static(path.join(rootDir, 'public')));
  loadPath = rootDir + '/locales/{{lng}}/{{ns}}.json';
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
    preload: SUPPORTED_LANGUAGES,
    // Only allow known languages — the ?lang= value is otherwise used to build a filesystem load path
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    ns: [
      'shared',
      'auth',
      'basket',
      'checkout',
      'content',
      'customer',
      'distribution',
      'merchant',
      'order',
      'product',
      'promotion',
      'tax',
      'storefront',
      'analytics',
      'operations',
      'platform',
      'marketing',
      'notifications',
      'payment',
      'inventory',
      'users',
      'settings',
      'support',
      'b2b',
      'loyalty',
      'subscription',
      'membership',
      'gdpr',
      'reporting',
      'salesSegment',
      'auditLog',
      'organization',
      'recommendation',
    ],
    defaultNS: 'shared',
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'lang',
      ignoreCase: true,
      cookieSecure: isProduction,
      cookieSameSite: 'lax',
    },
  });

app.use(
  i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ['/css', '/fonts', '/images', '/js', '/vendors', '/webfonts'],
    removeLngFromUrl: false,
  }),
);

app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 1000 }));

app.set('view engine', 'ejs');
app.locals.t = function (key: string) {
  return i18next.t(key);
};

// Correlation ID — must be early so all downstream middleware/logs have it
app.use(correlationIdMiddleware);

app.use(expressHttpLogger);
// Skip JSON parsing for webhook/ACP routes — needs raw Buffer for signature verification
app.use((req, res, next) => {
  if (req.path === '/payment/webhook' || req.path.startsWith('/acp')) {
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});
app.use(cookieParser(process.env.COOKIE_SECRET));

// Test database isolation middleware — routes DB queries to a per-test database.
// Must run BEFORE session() so session-store reads and writes share the same
// database context as the request's business queries.
// Only honoured in development/test for test_* names (see resolveTestDatabase).
app.use((req, res, next) => {
  const testDb = resolveTestDatabase(req.headers['x-test-database']);
  if (testDb) {
    return runWithTestDb(testDb, () => next());
  }
  next();
});

// Session configuration — secret validated via libs/secrets (fail-fast in production)
const sessionSecret = getSecret('SESSION_SECRET');

// Create session store - uses Redis if REDIS_URL/REDIS_HOST is set, otherwise PostgreSQL
const sessionStoreResult = createSessionStore({
  // Backend resolved from SESSION_BACKEND env ('postgres' | 'redis')
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
    secret: sessionSecret,
    name: 'sesId', // Don't use default 'connect.sid' - reveals tech stack
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
app.use(flashMiddleware());

// Make session data available in templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  // popFlashMessages guards on existing flash content — req.flash() on a fresh
  // session would dirty it and force a store write + cookie per request.
  const { successMsg, errorMsg } = popFlashMessages(req);
  res.locals.successMsg = successMsg;
  res.locals.errorMsg = errorMsg;
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
  logger.info(`Commercefull service started on port ${port}`);
});
server.keepAliveTimeout = Number(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS || 5_000);
server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS || 10_000);
server.requestTimeout = Number(process.env.HTTP_REQUEST_TIMEOUT_MS || 30_000);

server.on('error', (err: Error) => {
  logger.error('Server error:', err);
  process.exit(1);
});

let shutdownRequested = false;
const shutdown = (signal: string): void => {
  if (shutdownRequested) return;
  shutdownRequested = true;
  healthService.startDraining();
  cronScheduler.shutdown();
  logger.info('Graceful shutdown started', { signal });

  const forceShutdown = setTimeout(
    () => {
      server.closeAllConnections();
      process.exit(1);
    },
    Number(process.env.SHUTDOWN_TIMEOUT_MS || 30_000),
  );
  forceShutdown.unref();

  server.close(() => {
    flushAnalyticsWrites()
      .catch(() => {})
      .then(() => Promise.allSettled([stopEventTransport(), closeRedisClient(), closeDatabasePool()]))
      .then(results => {
        clearTimeout(forceShutdown);
        const failed = results.some(result => result.status === 'rejected');
        process.exit(failed ? 1 : 0);
      });
  });
  server.closeIdleConnections();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

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
