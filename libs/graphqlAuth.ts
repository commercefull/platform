import { GraphQLError } from 'graphql';

export interface GraphQLAuthUser {
  userId?: string;
  id?: string;
  customerId?: string;
  _id?: string;
  email?: string;
  role?: string;
  type?: string;
  organizationId?: string;
  storeId?: string;
  permissions?: string[];
}

export interface GraphQLAuthContext {
  user?: GraphQLAuthUser;
  sessionId?: string;
}

/**
 * Require any authenticated user (customer, merchant, or admin).
 * Returns the user object if authenticated, throws UNAUTHENTICATED otherwise.
 */
export function requireAuth(context: GraphQLAuthContext): GraphQLAuthUser {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

/**
 * Require an authenticated customer.
 * Returns { customerId } extracted from the user.
 */
export function requireCustomerAuth(context: GraphQLAuthContext): { customerId: string; user: GraphQLAuthUser } {
  const user = requireAuth(context);
  const customerId = user.customerId || user._id || user.userId;
  if (!customerId) {
    throw new GraphQLError('Customer authentication required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return { customerId, user };
}

/**
 * Require an authenticated business user (merchant or admin).
 * Returns the user object.
 */
export function requireBusinessAuth(context: GraphQLAuthContext): GraphQLAuthUser {
  const user = requireAuth(context);
  const isBusiness =
    user.type === 'organization' ||
    user.type === 'admin' ||
    user.role === 'ADMIN' ||
    user.role === 'MERCHANT' ||
    !!user.organizationId;
  if (!isBusiness) {
    throw new GraphQLError('Business access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

/**
 * Require an authenticated admin user.
 * Returns the user object.
 */
export function requireAdminAuth(context: GraphQLAuthContext): GraphQLAuthUser {
  const user = requireAuth(context);
  if (user.type !== 'admin' && user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}
