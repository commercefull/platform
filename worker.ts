/**
 * Event Worker Entrypoint
 *
 * A consumer-only process: same codebase as app.ts but no web server.
 * Runs the configured event transport's subscriber (Postgres outbox,
 * GCP Pub/Sub, AWS SQS, or Azure Service Bus) plus scheduled jobs.
 *
 * Use this when the event consumer should scale or deploy independently
 * from the web tier — e.g. a dedicated Cloud Run service / ECS service /
 * Container App, or simply a second process on a VM.
 *
 *   yarn worker        # development (tsx)
 *   yarn prd:worker    # production bundle
 *
 * A minimal HTTP server exposes GET /health on PORT (default 3001) so
 * orchestrators can health-check the worker. Set WORKER_NO_HTTP=1 to
 * disable it entirely.
 */

import http from 'http';
import { logger } from './libs/logger';
import { registerAllEventHandlers } from './boot/registerEventHandlers';
import { startEventSubscriber, stopEventTransport } from './libs/events/transportRegistry';
import { initEventTransport } from './libs/events/providers';
import { eventBus } from './libs/events/eventBus';
import { initializeAnalyticsHandlers } from './modules/analytics';
import { initializeScheduledJobs } from './boot/scheduledJobs';
import { registerModuleManifestsSync } from './boot/moduleManifests';
import { themeRegistry } from './modules/theme/domain/services/ThemeRegistry';
import { blockSchemaRegistry } from './modules/pagebuilder/domain/services/BlockSchemaRegistry';
import { validateAllSecrets } from './libs/secrets';

registerModuleManifestsSync();
themeRegistry.registerBuiltInThemes();
blockSchemaRegistry.registerBuiltIns();
validateAllSecrets();

// Register handlers, install the transport, and start consuming.
registerAllEventHandlers();
initializeAnalyticsHandlers();

initEventTransport(eventBus.dispatchFromOutbox.bind(eventBus))
  .then(provider => {
    logger.info('Event worker transport ready', { provider });
    return startEventSubscriber();
  })
  .then(() => logger.info('Event worker consuming'))
  .catch(err => {
    logger.error('Event transport init failed', { error: (err as Error).message });
    process.exit(1);
  });

// Scheduled jobs run on the worker (not the web tier) when present.
if (process.env.CRON_DISABLED !== '1') {
  initializeScheduledJobs();
}

// Minimal health endpoint for container orchestrators.
let server: http.Server | null = null;
if (process.env.WORKER_NO_HTTP !== '1') {
  server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"status":"ok","role":"worker"}');
    } else {
      res.writeHead(404).end();
    }
  });
  const port = Number(process.env.PORT || 3001);
  server.listen(port, () => logger.info('Worker health endpoint listening', { port }));
}

const shutdown = () => {
  stopEventTransport().finally(() => {
    if (server) server.close(() => process.exit(0));
    else process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
