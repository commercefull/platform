# Code Style & Formatting

## TypeScript Configuration

- **Target**: ES2023
- **Module**: NodeNext
- **Module resolution**: NodeNext
- **Strict mode**: Enabled

## ESLint Rules (baseline)

```javascript
{
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
}
```

## Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 140,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## File Naming Conventions

| Type                | Convention       | Example                               |
| ------------------- | ---------------- | ------------------------------------- |
| Domain entities     | PascalCase       | `Product.ts`, `ProductVariant.ts`     |
| Value objects       | PascalCase       | `Price.ts`, `ProductStatus.ts`        |
| Use cases           | PascalCase       | `CreateProduct.ts`, `ListProducts.ts` |
| Controllers         | camelCase        | `productBusinessController.ts`        |
| Routers             | camelCase        | `productBusinessRouter.ts`            |
| Legacy repositories | camelCase        | `productRepo.ts`                      |
| Infra repositories  | PascalCase       | `ProductRepository.ts`                |
| Migrations          | timestamp prefix | `20240805000468_createProduct.js`     |
| Seeds               | timestamp prefix | `20240805001026_seedSampleProduct.js` |
| EJS views           | kebab-case       | `product-list.ejs`                    |
| Locale files        | camelCase        | `product.json`, `shared.json`         |

## Directory Naming

- **Module directories**: camelCase (`product/`, `orderItem/`)
- **DDD layers**: camelCase (`application/`, `domain/`, `infrastructure/`, `interface/`)
- **Sub-directories**: camelCase (`useCases/`, `valueObjects/`, `entities/`)

## Import Style (TypeScript)

- **Always use ES module `import` syntax** — never use `require()` in any `.ts` file.
- **All imports must appear at the top of the file**, before any other code.
- **Dynamic `import()` inside function bodies is forbidden**; move it to the top.

```typescript
// ✅ CORRECT — top-level ES imports
import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

export const myHandler = async (req, res) => { ... };

// ❌ WRONG — require() anywhere
const { query } = require('../../../../libs/db');

// ❌ WRONG — import inside a function
export const myHandler = async (req, res) => {
  const { query } = await import('../../../../libs/db');
};
```

> Migration and seed files are plain JavaScript (`.js`) and use `exports.up` / `exports.seed` — `require()` is acceptable in those `.js` files only.

## Comments & Documentation

- Do not add or delete comments unless explicitly asked.
- Prefer expressive names and small functions over explanatory comments.
- Do not commit `console.log` in production code — use the Winston logger.
