import type { RequestHandler } from 'express';
import type { HttpApplication } from 'libs/http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import jwt from 'jsonwebtoken';
import { SessionService } from '../libs/session';
import { logger } from '../libs/logger';
import { AppError } from '../libs/errors';

// Module barrels — GraphQL typeDefs and resolvers imported from barrels only
import * as Product from '../modules/product';
import * as Order from '../modules/order';
import * as Customer from '../modules/customer';
import * as Basket from '../modules/basket';
import * as Checkout from '../modules/checkout';
import * as Payment from '../modules/payment';
import * as Inventory from '../modules/inventory';
import * as Fulfillment from '../modules/fulfillment';
import * as Shipping from '../modules/shipping';
import * as Promotion from '../modules/promotion';
import * as Loyalty from '../modules/loyalty';
import * as Membership from '../modules/membership';
import * as Subscription from '../modules/subscription';
import * as Coupon from '../modules/coupon';
import * as Notification from '../modules/notification';
import * as Store from '../modules/store';
import * as Tax from '../modules/tax';
import * as Pricing from '../modules/pricing';
import * as Organization from '../modules/organization';
import * as Analytics from '../modules/analytics';
import * as Content from '../modules/content';
import * as Media from '../modules/media';
import * as Localization from '../modules/localization';
import * as Configuration from '../modules/configuration';
import * as Supplier from '../modules/supplier';
import * as Gdpr from '../modules/gdpr';
import * as Identity from '../modules/identity';
import * as Reporting from '../modules/reporting';
import * as Support from '../modules/support';
import * as Warehouse from '../modules/warehouse';
import * as Webhook from '../modules/webhook';

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
        const decoded = jwt.verify(token, String(secret)) as Record<string, unknown>;
        context.user = decoded as GraphQLContext['user'];
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
    { module: 'product', defs: Product.productTypeDefs },
    { module: 'order', defs: Order.orderTypeDefs },
    { module: 'customer', defs: Customer.customerTypeDefs },
    { module: 'basket', defs: Basket.basketTypeDefs },
    { module: 'checkout', defs: Checkout.checkoutTypeDefs },
    { module: 'payment', defs: Payment.paymentTypeDefs },
    { module: 'inventory', defs: Inventory.inventoryTypeDefs },
    { module: 'fulfillment', defs: Fulfillment.fulfillmentTypeDefs },
    { module: 'shipping', defs: Shipping.shippingTypeDefs },
    { module: 'promotion', defs: Promotion.promotionTypeDefs },
    { module: 'loyalty', defs: Loyalty.loyaltyTypeDefs },
    { module: 'membership', defs: Membership.membershipTypeDefs },
    { module: 'subscription', defs: Subscription.subscriptionTypeDefs },
    { module: 'coupon', defs: Coupon.couponTypeDefs },
    { module: 'notification', defs: Notification.notificationTypeDefs },
    { module: 'store', defs: Store.storeTypeDefs },
    { module: 'tax', defs: Tax.taxTypeDefs },
    { module: 'pricing', defs: Pricing.pricingTypeDefs },
    { module: 'analytics', defs: Analytics.analyticsTypeDefs },
    { module: 'content', defs: Content.contentTypeDefs },
    { module: 'media', defs: Media.mediaTypeDefs },
    { module: 'localization', defs: Localization.localizationTypeDefs },
    { module: 'configuration', defs: Configuration.configurationTypeDefs },
    { module: 'organization', defs: Organization.organizationTypeDefs },
    { module: 'supplier', defs: Supplier.supplierTypeDefs },
    { module: 'gdpr', defs: Gdpr.gdprTypeDefs },
    { module: 'identity', defs: Identity.identityTypeDefs },
    { module: 'reporting', defs: Reporting.reportingTypeDefs },
    { module: 'support', defs: Support.supportTypeDefs },
    { module: 'warehouse', defs: Warehouse.warehouseTypeDefs },
    { module: 'webhook', defs: Webhook.webhookTypeDefs },
  ];

  const allResolvers: { module: string; res: unknown }[] = [
    { module: 'product', res: Product.productResolvers },
    { module: 'order', res: Order.orderResolvers },
    { module: 'customer', res: Customer.customerResolvers },
    { module: 'basket', res: Basket.basketResolvers },
    { module: 'checkout', res: Checkout.checkoutResolvers },
    { module: 'payment', res: Payment.paymentResolvers },
    { module: 'inventory', res: Inventory.inventoryResolvers },
    { module: 'fulfillment', res: Fulfillment.fulfillmentResolvers },
    { module: 'shipping', res: Shipping.shippingResolvers },
    { module: 'promotion', res: Promotion.promotionResolvers },
    { module: 'loyalty', res: Loyalty.loyaltyResolvers },
    { module: 'membership', res: Membership.membershipResolvers },
    { module: 'subscription', res: Subscription.subscriptionResolvers },
    { module: 'coupon', res: Coupon.couponResolvers },
    { module: 'notification', res: Notification.notificationResolvers },
    { module: 'store', res: Store.storeResolvers },
    { module: 'tax', res: Tax.taxResolvers },
    { module: 'pricing', res: Pricing.pricingResolvers },
    { module: 'analytics', res: Analytics.analyticsResolvers },
    { module: 'content', res: Content.contentResolvers },
    { module: 'media', res: Media.mediaResolvers },
    { module: 'localization', res: Localization.localizationResolvers },
    { module: 'configuration', res: Configuration.configurationResolvers },
    { module: 'organization', res: Organization.organizationResolvers },
    { module: 'supplier', res: Supplier.supplierResolvers },
    { module: 'gdpr', res: Gdpr.gdprResolvers },
    { module: 'identity', res: Identity.identityResolvers },
    { module: 'reporting', res: Reporting.reportingResolvers },
    { module: 'support', res: Support.supportResolvers },
    { module: 'warehouse', res: Warehouse.warehouseResolvers },
    { module: 'webhook', res: Webhook.webhookResolvers },
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
