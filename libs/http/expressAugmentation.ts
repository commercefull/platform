import type { HttpCompanyUser, HttpCustomerContext, HttpUser } from './user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends HttpUser {
      userId?: HttpUser['userId'];
    }

    interface Request {
      user?: User;
      rawBody?: Buffer;
      companyUser?: HttpCompanyUser;
      b2bCompanyUserId?: string;
      customer?: HttpCustomerContext;
    }
  }
}

export {};
