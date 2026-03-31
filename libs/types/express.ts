/**
 * Express Type Augmentation
 *
 * Extends Express types with proper User interface and typed Request.
 * This file is included in the TypeScript compilation via tsconfig.json.
 *
 * - Defines the User interface based on what auth middleware sets on req.user
 * - Creates TypedRequest type that overrides params to use string instead of string | string[]
 * - Adds rawBody to Request for webhook signature verification
 */

import { Roles } from 'libs/roles';
import { Request as ExpressRequest } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      userId?: string;
      id?: string;
      _id?: string;
      customerId?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      role?: string;
      roles?: Roles;
      type?: 'admin' | 'merchant' | 'b2b' | 'customer';
      status?: boolean;
      merchantId?: string;
      companyId?: string;
      storeId?: string;
      storeRole?: string;
      storeIds?: string[];
      facilityId?: string;
      providerId?: string;
      gender?: string;
      defaultCurrencyId?: string;
      defaultFacilityId?: string;
      permissions?: string[];
    }

    interface Request {
      user?: User;
      rawBody?: Buffer;
      companyUser?: any;
      b2bCompanyUserId?: string;
      customer?: { customerId?: string; [key: string]: any };
    }
  }
}

// Custom TypedRequest that overrides params to use string instead of string | string[]
export interface TypedRequest<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends ExpressRequest<P, ResBody, ReqBody, ReqQuery, Locals> {
  params: P;
  user?: Express.User;
  rawBody?: Buffer;
  companyUser?: any;
  b2bCompanyUserId?: string;
  customer?: { customerId?: string; [key: string]: any };
}

export {};
