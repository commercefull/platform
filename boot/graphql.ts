import type { RequestHandler } from 'express';
import type { HttpApplication } from 'libs/http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLFormattedError } from 'graphql';
import { SessionService } from '../libs/session';
import { verifyAccessJwt } from '../libs/auth';
import { logger } from '../libs/logger';
import { AppError } from '../libs/errors';

// Module barrels — GraphQL typeDefs and resolvers imported from barrels only
import { productResolvers, productTypeDefs } from '../modules/product';
import { orderResolvers, orderTypeDefs } from '../modules/order';
import { customerResolvers, customerTypeDefs } from '../modules/customer';
import { basketResolvers, basketTypeDefs } from '../modules/basket';
import { checkoutResolvers, checkoutTypeDefs } from '../modules/checkout';
import { paymentResolvers, paymentTypeDefs } from '../modules/payment';
import { inventoryResolvers, inventoryTypeDefs } from '../modules/inventory';
import { fulfillmentResolvers, fulfillmentTypeDefs } from '../modules/fulfillment';
import { shippingResolvers, shippingTypeDefs } from '../modules/shipping';
import { promotionResolvers, promotionTypeDefs } from '../modules/promotion';
import { loyaltyResolvers, loyaltyTypeDefs } from '../modules/loyalty';
import { membershipResolvers, membershipTypeDefs } from '../modules/membership';
import { subscriptionResolvers, subscriptionTypeDefs } from '../modules/subscription';
import { couponResolvers, couponTypeDefs } from '../modules/coupon';
import { notificationResolvers, notificationTypeDefs } from '../modules/notification';
import { storeResolvers, storeTypeDefs } from '../modules/store';
import { taxResolvers, taxTypeDefs } from '../modules/tax';
import { pricingResolvers, pricingTypeDefs } from '../modules/pricing';
import { organizationResolvers, organizationTypeDefs } from '../modules/organization';
import { analyticsResolvers, analyticsTypeDefs } from '../modules/analytics';
import { contentResolvers, contentTypeDefs } from '../modules/content';
import { mediaResolvers, mediaTypeDefs } from '../modules/media';
import { localizationResolvers, localizationTypeDefs } from '../modules/localization';
import { configurationResolvers, configurationTypeDefs } from '../modules/configuration';
import { supplierResolvers, supplierTypeDefs } from '../modules/supplier';
import { gdprResolvers, gdprTypeDefs } from '../modules/gdpr';
import { identityResolvers, identityTypeDefs } from '../modules/identity';
import { reportingResolvers, reportingTypeDefs } from '../modules/reporting';
import { supportResolvers, supportTypeDefs } from '../modules/support';
import { warehouseResolvers, warehouseTypeDefs } from '../modules/warehouse';
import { webhookResolvers, webhookTypeDefs } from '../modules/webhook';
import { moduleRegistry } from './moduleManifests';
import { getGraphQLValidationRules } from '../libs/graphqlSecurity';
import { persistedQueryStore, initPersistedQueries } from '../libs/persistedQueries';

import { getSecret } from '../libs/secrets';

const CUSTOMER_JWT_SECRET = getSecret('CUSTOMER_JWT_SECRET');
const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const SESSION_COOKIE_NAME = 'cf_session';

import { GraphQLAuthContext as GraphQLContext } from '../libs/graphqlAuth';
export type { GraphQLAuthContext as GraphQLContext } from '../libs/graphqlAuth';

async function buildContext({ req }: ExpressContextFunctionArgument): Promise<GraphQLContext> {
  const context: GraphQLContext = {
    sessionId: req.sessionID,
  };

  // Try JWT from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // Try customer token first, then merchant token
    for (const secret of [CUSTOMER_JWT_SECRET, ORGANIZATION_JWT_SECRET]) {
      try {
        context.user = verifyAccessJwt(token, secret) as GraphQLContext['user'];
        break;
      } catch {
        // Continue to next secret
      }
    }
  }

  // Fall back to session-based auth
  if (!context.user) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      try {
        const session = await SessionService.getSession(sessionId);
        if (session) {
          await SessionService.updateActivity(sessionId);
          context.user = {
            userId: session.userId,
            id: session.userId,
            email: session.email,
            role: session.role,
            type: session.userType,
            organizationId: session.organizationId,
            storeId: session.storeId,
            permissions: session.permissions,
          };
        }
      } catch (error) {
        logger.debug('GraphQL session auth failed:', error);
      }
    }
  }

  return context;
}

// Module GraphQL contributions — typeDefs + resolvers paired per module,
// filtered by module enabled state before merging into the schema.
const GRAPHQL_MODULES: { module: string; defs: string; res: unknown }[] = [
  { module: 'product', defs: productTypeDefs, res: productResolvers },
  { module: 'order', defs: orderTypeDefs, res: orderResolvers },
  { module: 'customer', defs: customerTypeDefs, res: customerResolvers },
  { module: 'basket', defs: basketTypeDefs, res: basketResolvers },
  { module: 'checkout', defs: checkoutTypeDefs, res: checkoutResolvers },
  { module: 'payment', defs: paymentTypeDefs, res: paymentResolvers },
  { module: 'inventory', defs: inventoryTypeDefs, res: inventoryResolvers },
  { module: 'fulfillment', defs: fulfillmentTypeDefs, res: fulfillmentResolvers },
  { module: 'shipping', defs: shippingTypeDefs, res: shippingResolvers },
  { module: 'promotion', defs: promotionTypeDefs, res: promotionResolvers },
  { module: 'loyalty', defs: loyaltyTypeDefs, res: loyaltyResolvers },
  { module: 'membership', defs: membershipTypeDefs, res: membershipResolvers },
  { module: 'subscription', defs: subscriptionTypeDefs, res: subscriptionResolvers },
  { module: 'coupon', defs: couponTypeDefs, res: couponResolvers },
  { module: 'notification', defs: notificationTypeDefs, res: notificationResolvers },
  { module: 'store', defs: storeTypeDefs, res: storeResolvers },
  { module: 'tax', defs: taxTypeDefs, res: taxResolvers },
  { module: 'pricing', defs: pricingTypeDefs, res: pricingResolvers },
  { module: 'analytics', defs: analyticsTypeDefs, res: analyticsResolvers },
  { module: 'content', defs: contentTypeDefs, res: contentResolvers },
  { module: 'media', defs: mediaTypeDefs, res: mediaResolvers },
  { module: 'localization', defs: localizationTypeDefs, res: localizationResolvers },
  { module: 'configuration', defs: configurationTypeDefs, res: configurationResolvers },
  { module: 'organization', defs: organizationTypeDefs, res: organizationResolvers },
  { module: 'supplier', defs: supplierTypeDefs, res: supplierResolvers },
  { module: 'gdpr', defs: gdprTypeDefs, res: gdprResolvers },
  { module: 'identity', defs: identityTypeDefs, res: identityResolvers },
  { module: 'reporting', defs: reportingTypeDefs, res: reportingResolvers },
  { module: 'support', defs: supportTypeDefs, res: supportResolvers },
  { module: 'warehouse', defs: warehouseTypeDefs, res: warehouseResolvers },
  { module: 'webhook', defs: webhookTypeDefs, res: webhookResolvers },
];

function formatGraphQLError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const isProduction = process.env.NODE_ENV === 'production';
  const original = (error as Record<string, unknown>)?.originalError;

  // If it's an AppError, enrich the GraphQL error with our code/status
  if (original instanceof AppError) {
    return {
      message: isProduction && !original.isExpected ? 'An internal error occurred' : original.message,
      extensions: {
        code: original.code,
        statusCode: original.statusCode,
        isExpected: original.isExpected,
        ...(original.details ? { details: original.details } : {}),
      },
    };
  }

  // Log unexpected errors
  if (
    formattedError.extensions?.code !== 'BAD_USER_INPUT' &&
    formattedError.extensions?.code !== 'UNAUTHENTICATED' &&
    formattedError.extensions?.code !== 'FORBIDDEN'
  ) {
    logger.error('GraphQL error', {
      message: formattedError.message,
      path: formattedError.path,
      code: formattedError.extensions?.code,
    });
  }

  // Hide internal details in production
  if (isProduction) {
    return {
      message: 'An internal error occurred',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  }

  return formattedError;
}

// Persisted query enforcement: reject queries not in the allowlist.
// Returns true when the request was handled (rejected).
function rejectNonPersistedQuery(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): boolean {
  if (persistedQueryStore.isEnabled() && req.method === 'POST' && req.body?.query && !persistedQueryStore.isQueryAllowed(req.body.query)) {
    res.status(403).json({
      errors: [{ message: 'Query not in persisted query allowlist' }],
    });
    return true;
  }
  return false;
}

// Serve GraphiQL UI for browser GET requests in non-production.
// Returns true when the request was handled.
function serveGraphiQL(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): boolean {
  if (req.method !== 'GET' || process.env.NODE_ENV === 'production') return false;
  const accept = req.headers.accept || '';
  if (!accept.includes('text/html')) return false;

  res.setHeader('Content-Type', 'text/html');
  res.send(GRAPHIQL_HTML);
  return true;
}

export function configureGraphQL(app: HttpApplication): void {
  const enabledModules = GRAPHQL_MODULES.filter(m => moduleRegistry.shouldIncludeGraphQL(m.module));

  const schema = makeExecutableSchema({
    typeDefs: mergeTypeDefs(enabledModules.map(m => m.defs)),
    resolvers: mergeResolvers(enabledModules.map(m => m.res) as unknown as NonNullable<Parameters<typeof mergeResolvers>[0]>),
  });

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    validationRules: getGraphQLValidationRules(
      parseInt(process.env.GRAPHQL_MAX_DEPTH ?? '10', 10),
      parseInt(process.env.GRAPHQL_MAX_COMPLEXITY ?? '1000', 10),
    ),
    formatError: formatGraphQLError,
  });

  // Initialize persisted queries (if enabled via env)
  initPersistedQueries();

  // Register /graphql synchronously before storefront routes catch it.
  // The actual Apollo middleware is swapped in once the server has started.
  let graphqlHandler: RequestHandler | null = null;

  app.use('/graphql', (req, res, next) => {
    if (rejectNonPersistedQuery(req, res)) return;
    if (serveGraphiQL(req, res)) return;

    if (graphqlHandler) {
      graphqlHandler(req, res, next);
    } else {
      res.status(503).json({ error: 'GraphQL server is starting, please retry shortly.' });
    }
  });

  apolloServer
    .start()
    .then(() => {
      graphqlHandler = expressMiddleware<GraphQLContext>(apolloServer, {
        context: async args => buildContext(args),
      });
      logger.info('GraphQL endpoint mounted at /graphql');
    })
    .catch(error => {
      logger.error('Failed to start Apollo Server:', error);
    });
}

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Commercefull GraphiQL</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; height: 100vh; } #graphiql { height: 100vh; }</style>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphiql@3.3.2/graphiql.min.css" />
  </head>
  <body>
    <div id="graphiql">Loading GraphiQL…</div>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/graphiql@3.3.2/graphiql.min.js"></script>
    <script>
      window.addEventListener('load', function () {
        var fetcher = function (graphQLParams, opts) {
          return fetch(window.location.origin + '/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(graphQLParams),
            credentials: opts && opts.headers ? undefined : 'include',
          }).then(function (r) { return r.json(); });
        };
        ReactDOM.render(
          React.createElement(GraphiQL, { fetcher: fetcher, defaultEditorToolsVisibility: true }),
          document.getElementById('graphiql')
        );
      });
    </script>
  </body>
</html>`;
