import type { RequestHandler } from 'express';
import type { HttpApplication } from 'libs/http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
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
import {
  mediaResolvers,
  mediaTypeDefs,
} from '../modules/media';
import {
  localizationResolvers,
  localizationTypeDefs,
} from '../modules/localization';
import {
  configurationResolvers,
  configurationTypeDefs,
} from '../modules/configuration';
import {
  supplierResolvers,
  supplierTypeDefs,
} from '../modules/supplier';
import {
  gdprResolvers,
  gdprTypeDefs,
} from '../modules/gdpr';
import {
  identityResolvers,
  identityTypeDefs,
} from '../modules/identity';
import {
  reportingResolvers,
  reportingTypeDefs,
} from '../modules/reporting';
import {
  supportResolvers,
  supportTypeDefs,
} from '../modules/support';
import {
  warehouseResolvers,
  warehouseTypeDefs,
} from '../modules/warehouse';
import {
  webhookResolvers,
  webhookTypeDefs,
} from '../modules/webhook';
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

export function configureGraphQL(app: HttpApplication): void {
  // Build arrays of typeDefs and resolvers, filtered by module enabled state
  const allTypeDefs: { module: string; defs: string }[] = [
    { module: 'product', defs: productTypeDefs },
    { module: 'order', defs: orderTypeDefs },
    { module: 'customer', defs: customerTypeDefs },
    { module: 'basket', defs: basketTypeDefs },
    { module: 'checkout', defs: checkoutTypeDefs },
    { module: 'payment', defs: paymentTypeDefs },
    { module: 'inventory', defs: inventoryTypeDefs },
    { module: 'fulfillment', defs: fulfillmentTypeDefs },
    { module: 'shipping', defs: shippingTypeDefs },
    { module: 'promotion', defs: promotionTypeDefs },
    { module: 'loyalty', defs: loyaltyTypeDefs },
    { module: 'membership', defs: membershipTypeDefs },
    { module: 'subscription', defs: subscriptionTypeDefs },
    { module: 'coupon', defs: couponTypeDefs },
    { module: 'notification', defs: notificationTypeDefs },
    { module: 'store', defs: storeTypeDefs },
    { module: 'tax', defs: taxTypeDefs },
    { module: 'pricing', defs: pricingTypeDefs },
    { module: 'analytics', defs: analyticsTypeDefs },
    { module: 'content', defs: contentTypeDefs },
    { module: 'media', defs: mediaTypeDefs },
    { module: 'localization', defs: localizationTypeDefs },
    { module: 'configuration', defs: configurationTypeDefs },
    { module: 'organization', defs: organizationTypeDefs },
    { module: 'supplier', defs: supplierTypeDefs },
    { module: 'gdpr', defs: gdprTypeDefs },
    { module: 'identity', defs: identityTypeDefs },
    { module: 'reporting', defs: reportingTypeDefs },
    { module: 'support', defs: supportTypeDefs },
    { module: 'warehouse', defs: warehouseTypeDefs },
    { module: 'webhook', defs: webhookTypeDefs },
  ];

  const allResolvers: { module: string; res: unknown }[] = [
    { module: 'product', res: productResolvers },
    { module: 'order', res: orderResolvers },
    { module: 'customer', res: customerResolvers },
    { module: 'basket', res: basketResolvers },
    { module: 'checkout', res: checkoutResolvers },
    { module: 'payment', res: paymentResolvers },
    { module: 'inventory', res: inventoryResolvers },
    { module: 'fulfillment', res: fulfillmentResolvers },
    { module: 'shipping', res: shippingResolvers },
    { module: 'promotion', res: promotionResolvers },
    { module: 'loyalty', res: loyaltyResolvers },
    { module: 'membership', res: membershipResolvers },
    { module: 'subscription', res: subscriptionResolvers },
    { module: 'coupon', res: couponResolvers },
    { module: 'notification', res: notificationResolvers },
    { module: 'store', res: storeResolvers },
    { module: 'tax', res: taxResolvers },
    { module: 'pricing', res: pricingResolvers },
    { module: 'analytics', res: analyticsResolvers },
    { module: 'content', res: contentResolvers },
    { module: 'media', res: mediaResolvers },
    { module: 'localization', res: localizationResolvers },
    { module: 'configuration', res: configurationResolvers },
    { module: 'organization', res: organizationResolvers },
    { module: 'supplier', res: supplierResolvers },
    { module: 'gdpr', res: gdprResolvers },
    { module: 'identity', res: identityResolvers },
    { module: 'reporting', res: reportingResolvers },
    { module: 'support', res: supportResolvers },
    { module: 'warehouse', res: warehouseResolvers },
    { module: 'webhook', res: webhookResolvers },
  ];

  const enabledTypeDefs = allTypeDefs.filter(t => moduleRegistry.shouldIncludeGraphQL(t.module)).map(t => t.defs);
  const enabledResolvers = allResolvers.filter(r => moduleRegistry.shouldIncludeGraphQL(r.module)).map(r => r.res);

  const typeDefs = mergeTypeDefs(enabledTypeDefs);
  const resolvers = mergeResolvers(enabledResolvers as unknown as NonNullable<Parameters<typeof mergeResolvers>[0]>);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    validationRules: getGraphQLValidationRules(
      parseInt(process.env.GRAPHQL_MAX_DEPTH ?? '10', 10),
      parseInt(process.env.GRAPHQL_MAX_COMPLEXITY ?? '1000', 10),
    ),
    formatError: (formattedError, error) => {
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
    },
  });

  // Initialize persisted queries (if enabled via env)
  initPersistedQueries();

  // Register /graphql synchronously before storefront routes catch it.
  // The actual Apollo middleware is swapped in once the server has started.
  let graphqlHandler: RequestHandler | null = null;

  app.use('/graphql', (req, res, next) => {
    // Persisted query enforcement: reject queries not in the allowlist
    if (persistedQueryStore.isEnabled() && req.method === 'POST' && req.body?.query) {
      if (!persistedQueryStore.isQueryAllowed(req.body.query)) {
        res.status(403).json({
          errors: [{ message: 'Query not in persisted query allowlist' }],
        });
        return;
      }
    }

    // Serve GraphiQL UI for browser GET requests in non-production
    if (req.method === 'GET' && process.env.NODE_ENV !== 'production') {
      const accept = req.headers.accept || '';
      if (accept.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html');
        res.send(`<!DOCTYPE html>
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
</html>`);
        return;
      }
    }
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
