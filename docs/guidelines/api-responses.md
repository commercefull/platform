# API Response Standards

All API endpoints return a consistent JSON envelope. Helpers live in `libs/apiResponse.ts`.

## Transport Helpers (required)

Controllers never call `res.status`/`res.json`/`res.redirect`/`res.render`/`res.send`/`res.cookie`/`res.setHeader` directly — every response goes through a helper. The helpers delegate to Express, so wire behavior (and test mocks of `res.*`) is unchanged; they are the only files to edit if the framework is ever swapped.

```typescript
import {
  jsonResponse, sendResponse, redirectResponse, renderResponse,
  setStatus, setHeader, cookieResponse,
} from 'libs/apiResponse';

jsonResponse(res, 200, { items });                 // res.status(200).json(...)
sendResponse(res, 200, '<xml/>');                  // res.status(200).send(...)
redirectResponse(res, '/admin/products');          // res.redirect(302, url)
redirectResponse(res, '/admin/products', 301);     // custom status
renderResponse(res, 'partials/suggestions', data); // res.render — partials/previews only
setStatus(res, 204);                               // bare res.status (rare)
setHeader(res, 'X-Total-Count', '42');             // res.setHeader / res.set
cookieResponse(res, 'token', value, { httpOnly: true }); // res.cookie
```

- **Partial/preview renders** use `renderResponse` — never `adminRespond`/`storefrontRespond`, which wrap the page in a layout.
- **Full page renders** go through `adminRespond` / `storefrontRespond` (`web/respond.ts`).
- Fetch `Response` objects (e.g. PSP adapters) still use native `await res.json()` — the helpers are for Express `HttpResponse` only.

## Envelope Helpers

```typescript
import { successResponse, errorResponse, validationErrorResponse } from '../../libs/apiResponse';

// Success (200)
successResponse(res, data);
// → { success: true, data: { ... } }

// Success with custom status (201 Created)
successResponse(res, data, 201);

// Error (500 by default)
errorResponse(res, 'Something went wrong');
// → { success: false, error: { message: '...', statusCode: 500 } }

// Error with custom status (404)
errorResponse(res, 'Not found', 404);

// Validation error (400)
validationErrorResponse(res, ['Name is required', 'Email is invalid']);
// → { success: false, error: { message: 'Validation failed', statusCode: 400, errors: [...] } }
```

## Response Shapes

### Success

```json
{
  "success": true,
  "data": { "...": "..." },
  "message": "Operation successful"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "statusCode": 400,
    "errors": ["optional", "field-level", "errors"]
  }
}
```

### Paginated

```json
{
  "success": true,
  "data": ["..."],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Content Negotiation (dual JSON / HTML controllers)

Some controllers serve both API and portal views. Prefer a `respond` helper that branches on `Accept`:

```typescript
function respond(req: HttpRequest, res: HttpResponse, data: any, statusCode = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    setStatus(res, statusCode);
    renderResponse(res, htmlTemplate, { data, success: true });
  } else {
    jsonResponse(res, statusCode, { success: true, data });
  }
}
```

## Controller Error Handling

```typescript
export const getProduct = async (req: HttpRequest, res: HttpResponse) => {
  // import type { HttpRequest, HttpResponse } from 'libs/http';
  try {
    const { productId } = req.params;
    const product = await productRepo.findById(productId);
    if (!product) return errorResponse(res, 'Product not found', 404);
    successResponse(res, product);
  } catch (error: any) {
    logger.error('Error fetching product:', error);
    errorResponse(res, 'Failed to fetch product');
  }
};
```

When re-throwing, always preserve the original cause:

```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new Error('Operation failed', { cause: error });
}
```
