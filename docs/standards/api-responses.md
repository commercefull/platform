# API Response Standards

All API endpoints return a consistent JSON envelope. Helpers live in `libs/apiResponse.ts`.

## Helpers

```typescript
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../libs/apiResponse';

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
  "data": [ "..." ],
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
function respond(req: Request, res: Response, data: any, statusCode = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}
```

## Controller Error Handling

```typescript
export const getProduct = async (req: TypedRequest, res: Response) => {
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
