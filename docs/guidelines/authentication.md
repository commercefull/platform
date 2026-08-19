# Authentication & Authorization

The platform supports both **session-based** (web portals) and **token-based** (API) authentication. Middleware auto-detects based on the `Accept` header.

## Dual Authentication Strategy

```typescript
export const isAdminLoggedIn = async (req, res, next) => {
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, ADMIN_JWT_SECRET); // JWT for API
  }
  return authenticateSession(req, res, next, 'admin', '/admin/login'); // Session for web
};
```

## Auth Middleware

| Middleware             | User Type    | JWT Secret            | Login Redirect    |
| ---------------------- | ------------ | --------------------- | ----------------- |
| `isAdminLoggedIn`      | Admin        | `ADMIN_JWT_SECRET`    | `/admin/login`    |
| `isOrganizationLoggedIn` | Organization | `MERCHANT_JWT_SECRET` | `/admin/login`    |
| `isCustomerLoggedIn`   | Customer     | `CUSTOMER_JWT_SECRET` | `/login`          |

Apply at router level:

```typescript
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isOrganizationLoggedIn);
router.get('/products', controller.listProducts);
```

Or per route where only some endpoints are protected:

```typescript
router.get('/profile', isCustomerLoggedIn, getProfile);
```

## Route Protection Requirements

**All `/business` routes must be protected** with `isOrganizationLoggedIn` middleware. The only exceptions are:

- **Public auth endpoints** in `identityBusinessRouter` — login, register, token, refresh, validate, forgot-password, reset-password (these must remain public)
- **Payment gateway webhooks** — HMAC-verified separately, not token-authenticated

### Applying auth to a business router

Add `router.use(isOrganizationLoggedIn)` immediately after router creation, before any route definitions:

```typescript
const router = express.Router();
router.use(isOrganizationLoggedIn);

router.get('/items', controller.listItems);
```

For routers with mixed public/protected routes (e.g. identity), place the middleware after the public routes:

```typescript
const router = express.Router();

// Public routes
router.post('/auth/login', login);
router.post('/auth/register', register);

// Protected routes
router.use(isOrganizationLoggedIn);
router.get('/auth/user/:userId', getUserDetails);
```

## Session Configuration

| Setting             | Value         | Reason                      |
| ------------------- | ------------- | --------------------------- |
| `name`              | `sid`         | Don't reveal tech stack     |
| `maxAge`            | 3 hours       | Session expiry              |
| `httpOnly`          | `true`        | Prevents XSS cookie access  |
| `secure`            | `true` (prod) | HTTPS only in production    |
| `sameSite`          | `lax`         | CSRF protection             |
| `saveUninitialized` | `false`       | GDPR compliance             |
| `store`             | Redis or PG   | Redis if `REDIS_URL` is set |

## Required Environment Variables

```bash
SESSION_SECRET=<64-char-hex>         # Session encryption
CUSTOMER_JWT_SECRET=<secure-secret>  # Customer JWT signing
MERCHANT_JWT_SECRET=<secure-secret>  # Organization JWT signing
ADMIN_JWT_SECRET=<secure-secret>     # Admin JWT signing
B2B_JWT_SECRET=<secure-secret>       # B2B JWT signing
COOKIE_SECRET=<secure-secret>        # Cookie signing
```

## Password Hashing

- Algorithm: **bcrypt** via `bcryptjs`
- Salt rounds: **10**
