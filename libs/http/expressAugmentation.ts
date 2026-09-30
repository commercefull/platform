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
      /** Populated by libs/cookieParser. */
      cookies: Record<string, string>;
      /** Populated by libs/cookieParser when a COOKIE_SECRET is configured. */
      signedCookies: Record<string, string>;
      /** Populated by libs/flash.flashMiddleware. */
      flash: {
        (type: string, message: string | string[]): string[];
        (type: string): string[];
        (): Record<string, string[]>;
      };
    }
  }
}

export {};
