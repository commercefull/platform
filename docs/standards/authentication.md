# Authentication & Authorization

The platform supports both **session-based** (web portals) and **token-based** (API) authentication. Middleware auto-detects based on the `Accept` header.

## Dual Authentication Strategy

```typescript
export const isAdminLoggedIn = async (req, res, next) => {
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, ADMIN_JWT_SECRET);      // JWT for API
  }
  return authenticateSession(req, res, next, 'admin', '/admin/login'); // Session for web
};
```

## Auth Middleware

| Middleware             | User Type  | JWT Secret              | Login Redirect     |
| ---------------------- | ---------- | ----------------------- | ------------------ |
| `isAdminLoggedIn`      | Admin      | `ADMIN_JWT_SECRET`      | `/admin/login`     |
| `isMerchantLoggedIn`   | Merchant   | `MERCHANT_JWT_SECRET`   | `/merchant/login`  |
| `isB2BLoggedIn`        | B2B user   | `B2B_JWT_SECRET`        | `/b2b/login`       |
| `isCustomerLoggedIn`   | Customer   | `CUSTOMER_JWT_SECRET`   | `/login`           |

Apply at router level:

```typescript
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isMerchantLoggedIn);
router.get('/products', controller.listProducts);
```

Or per route where only some endpoints are protected:

```typescript
router.get('/profile', isCustomerLoggedIn, getProfile);
```

## Session Configuration

| Setting            | Value          | Reason                        |
| ------------------ | -------------- | ----------------------------- |
| `name`             | `sid`          | Don't reveal tech stack       |
| `maxAge`           | 3 hours        | Session expiry                |
| `httpOnly`         | `true`         | Prevents XSS cookie access    |
| `secure`           | `true` (prod)  | HTTPS only in production      |
| `sameSite`         | `lax`          | CSRF protection               |
| `saveUninitialized`| `false`        | GDPR compliance               |
| `store`            | Redis or PG    | Redis if `REDIS_URL` is set   |

## Required Environment Variables

```bash
SESSION_SECRET=<64-char-hex>         # Session encryption
CUSTOMER_JWT_SECRET=<secure-secret>  # Customer JWT signing
MERCHANT_JWT_SECRET=<secure-secret>  # Merchant JWT signing
ADMIN_JWT_SECRET=<secure-secret>     # Admin JWT signing
B2B_JWT_SECRET=<secure-secret>       # B2B JWT signing
COOKIE_SECRET=<secure-secret>        # Cookie signing
```

## Password Hashing

- Algorithm: **bcrypt** via `bcryptjs`
- Salt rounds: **10**
