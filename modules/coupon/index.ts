/**
 * coupon module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/CouponRepository';
export * from './domain/errors/CouponErrors';

// Interface exports (routers, GraphQL)
export { couponCustomerRouter } from './interface/routers/couponCustomerRouter';
export { couponBusinessRouter } from './interface/routers/couponRouter';
export { couponTypeDefs } from './interface/graphql/typeDefs';
export { couponResolvers } from './interface/graphql/resolvers';

export { manifest } from './manifest';
