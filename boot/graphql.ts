import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import jwt from 'jsonwebtoken';
import { SessionService } from '../libs/session';
import { logger } from '../libs/logger';

import { productTypeDefs } from '../modules/product/interface/graphql/typeDefs';
import { productResolvers } from '../modules/product/interface/graphql/resolvers';
import { orderTypeDefs } from '../modules/order/interface/graphql/typeDefs';
import { orderResolvers } from '../modules/order/interface/graphql/resolvers';
import { customerTypeDefs } from '../modules/customer/interface/graphql/typeDefs';
import { customerResolvers } from '../modules/customer/interface/graphql/resolvers';
import { basketTypeDefs } from '../modules/basket/interface/graphql/typeDefs';
import { basketResolvers } from '../modules/basket/interface/graphql/resolvers';
import { checkoutTypeDefs } from '../modules/checkout/interface/graphql/typeDefs';
import { checkoutResolvers } from '../modules/checkout/interface/graphql/resolvers';
import { paymentTypeDefs } from '../modules/payment/interface/graphql/typeDefs';
import { paymentResolvers } from '../modules/payment/interface/graphql/resolvers';
import { inventoryTypeDefs } from '../modules/inventory/interface/graphql/typeDefs';
import { inventoryResolvers } from '../modules/inventory/interface/graphql/resolvers';
import { fulfillmentTypeDefs } from '../modules/fulfillment/interface/graphql/typeDefs';
import { fulfillmentResolvers } from '../modules/fulfillment/interface/graphql/resolvers';
import { shippingTypeDefs } from '../modules/shipping/interface/graphql/typeDefs';
import { shippingResolvers } from '../modules/shipping/interface/graphql/resolvers';
import { promotionTypeDefs } from '../modules/promotion/interface/graphql/typeDefs';
import { promotionResolvers } from '../modules/promotion/interface/graphql/resolvers';
import { loyaltyTypeDefs } from '../modules/loyalty/interface/graphql/typeDefs';
import { loyaltyResolvers } from '../modules/loyalty/interface/graphql/resolvers';
import { membershipTypeDefs } from '../modules/membership/interface/graphql/typeDefs';
import { membershipResolvers } from '../modules/membership/interface/graphql/resolvers';
import { subscriptionTypeDefs } from '../modules/subscription/interface/graphql/typeDefs';
import { subscriptionResolvers } from '../modules/subscription/interface/graphql/resolvers';
import { couponTypeDefs } from '../modules/coupon/interface/graphql/typeDefs';
import { couponResolvers } from '../modules/coupon/interface/graphql/resolvers';
import { notificationTypeDefs } from '../modules/notification/interface/graphql/typeDefs';
import { notificationResolvers } from '../modules/notification/interface/graphql/resolvers';
import { storeTypeDefs } from '../modules/store/interface/graphql/typeDefs';
import { storeResolvers } from '../modules/store/interface/graphql/resolvers';
import { taxTypeDefs } from '../modules/tax/interface/graphql/typeDefs';
import { taxResolvers } from '../modules/tax/interface/graphql/resolvers';
import { pricingTypeDefs } from '../modules/pricing/interface/graphql/typeDefs';
import { pricingResolvers } from '../modules/pricing/interface/graphql/resolvers';
import { organizationTypeDefs } from '../modules/organization/interface/graphql/typeDefs';
import { organizationResolvers } from '../modules/organization/interface/graphql/resolvers';
import { analyticsTypeDefs } from '../modules/analytics/interface/graphql/typeDefs';
import { analyticsResolvers } from '../modules/analytics/interface/graphql/resolvers';
import { contentTypeDefs } from '../modules/content/interface/graphql/typeDefs';
import { contentResolvers } from '../modules/content/interface/graphql/resolvers';
import { mediaTypeDefs } from '../modules/media/interface/graphql/typeDefs';
import { mediaResolvers } from '../modules/media/interface/graphql/resolvers';
import { localizationTypeDefs } from '../modules/localization/interface/graphql/typeDefs';
import { localizationResolvers } from '../modules/localization/interface/graphql/resolvers';
import { configurationTypeDefs } from '../modules/configuration/interface/graphql/typeDefs';
import { configurationResolvers } from '../modules/configuration/interface/graphql/resolvers';
import { supplierTypeDefs } from '../modules/supplier/interface/graphql/typeDefs';
import { supplierResolvers } from '../modules/supplier/interface/graphql/resolvers';
import { gdprTypeDefs } from '../modules/gdpr/interface/graphql/typeDefs';
import { gdprResolvers } from '../modules/gdpr/interface/graphql/resolvers';
import { identityTypeDefs } from '../modules/identity/interface/graphql/typeDefs';
import { identityResolvers } from '../modules/identity/interface/graphql/resolvers';
import { reportingTypeDefs } from '../modules/reporting/interface/graphql/typeDefs';
import { reportingResolvers } from '../modules/reporting/interface/graphql/resolvers';
import { supportTypeDefs } from '../modules/support/interface/graphql/typeDefs';
import { supportResolvers } from '../modules/support/interface/graphql/resolvers';
import { warehouseTypeDefs } from '../modules/warehouse/interface/graphql/typeDefs';
import { warehouseResolvers } from '../modules/warehouse/interface/graphql/resolvers';
import { webhookTypeDefs } from '../modules/webhook/interface/graphql/typeDefs';
import { webhookResolvers } from '../modules/webhook/interface/graphql/resolvers';

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
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
    for (const secret of [CUSTOMER_JWT_SECRET, MERCHANT_JWT_SECRET]) {
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
            merchantId: session.merchantId,
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

export function configureGraphQL(app: Express): void {
  const typeDefs = mergeTypeDefs([
    productTypeDefs,
    orderTypeDefs,
    customerTypeDefs,
    basketTypeDefs,
    checkoutTypeDefs,
    paymentTypeDefs,
    inventoryTypeDefs,
    fulfillmentTypeDefs,
    shippingTypeDefs,
    promotionTypeDefs,
    loyaltyTypeDefs,
    membershipTypeDefs,
    subscriptionTypeDefs,
    couponTypeDefs,
    notificationTypeDefs,
    storeTypeDefs,
    taxTypeDefs,
    pricingTypeDefs,
    analyticsTypeDefs,
    contentTypeDefs,
    mediaTypeDefs,
    localizationTypeDefs,
    configurationTypeDefs,
    organizationTypeDefs,
    supplierTypeDefs,
    gdprTypeDefs,
    identityTypeDefs,
    reportingTypeDefs,
    supportTypeDefs,
    warehouseTypeDefs,
    webhookTypeDefs,
  ]);

  const resolvers = mergeResolvers([
    productResolvers,
    orderResolvers,
    customerResolvers,
    basketResolvers,
    checkoutResolvers,
    paymentResolvers,
    inventoryResolvers,
    fulfillmentResolvers,
    shippingResolvers,
    promotionResolvers,
    loyaltyResolvers,
    membershipResolvers,
    subscriptionResolvers,
    couponResolvers,
    notificationResolvers,
    storeResolvers,
    taxResolvers,
    pricingResolvers,
    analyticsResolvers,
    contentResolvers,
    mediaResolvers,
    localizationResolvers,
    configurationResolvers,
    organizationResolvers,
    supplierResolvers,
    gdprResolvers,
    identityResolvers,
    reportingResolvers,
    supportResolvers,
    warehouseResolvers,
    webhookResolvers,
  ]);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
  });

  // Register /graphql synchronously before storefront routes catch it.
  // The actual Apollo middleware is swapped in once the server has started.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let graphqlHandler: any = null;

  app.use(
    '/graphql',
    (req, res, next) => {
      // Serve GraphiQL UI for browser GET requests in non-production
      if (req.method === 'GET' && process.env.NODE_ENV !== 'production') {
        const accept = req.headers.accept || '';
        if (accept.includes('text/html')) {
          res.setHeader('Content-Type', 'text/html');
          res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>CommerceFull GraphiQL</title>
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
    },
  );

  apolloServer
    .start()
    .then(() => {
      graphqlHandler = expressMiddleware<GraphQLContext>(apolloServer, {
        context: async (args) => buildContext(args),
      });
      logger.info('GraphQL endpoint mounted at /graphql');
    })
    .catch((error) => {
      logger.error('Failed to start Apollo Server:', error);
    });
}
