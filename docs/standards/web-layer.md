# Web Layer Standards

The `web/` directory handles view rendering via EJS templates for each portal. It imports module use cases directly — no HTTP hops between the web layer and the business logic.

## Portal Layout

```
web/
├── admin/                     # Admin panel (Tabler UI)
│   ├── adminRouters.ts
│   ├── controllers/
│   └── views/
│       ├── layout.ejs
│       ├── layout-public.ejs
│       ├── dashboard.ejs
│       ├── login.ejs
│       ├── partials/          # navbar, sidebar, alerts
│       ├── products/
│       ├── orders/
│       └── ...
├── merchant/                  # Merchant dashboard (Tabler)
├── b2b/                       # B2B portal (Tabler)
├── storefront/                # Customer store (Tailwind)
└── respond.ts                 # Response helpers for all portals
```

## Web Controller Pattern

Web controllers import use cases directly from `modules/`:

```typescript
import { Request, Response } from 'express';
import { ListProductsUseCase, ListProductsCommand } from '../../../modules/product/application/useCases/ListProducts';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { adminRespond } from '../../respond';

export const listProducts = async (req: Request, res: Response) => {
  try {
    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(new ListProductsCommand());

    adminRespond(req, res, 'products/index', {
      products: result.products,
      total: result.total,
      pageName: 'Products',
    });
  } catch (error: any) {
    adminRespond(req, res, 'error', { message: error.message });
  }
};
```

## Response Helpers (`web/respond.ts`)

| Helper              | Portal     | Layout                   |
| ------------------- | ---------- | ------------------------ |
| `adminRespond`      | Admin      | `admin/views/layout`     |
| `merchantRespond`   | Merchant   | `merchant/views/layout`  |
| `b2bRespond`        | B2B        | `b2b/views/layout`       |
| `storefrontRespond` | Storefront | Direct render            |

## EJS Template Conventions

- Views are resolved relative to `web/`.
- Layouts wrap content via a `body` variable.
- Flash messages available as `successMsg` / `errorMsg`.
- Current user/session available as `user` and `session`.
- i18n available via `t('key')`.

### Admin / Merchant / B2B (Tabler)

```html
<div class="page-header d-print-none">
  <div class="row g-2 align-items-center">
    <div class="col"><h2 class="page-title"><%= pageName %></h2></div>
  </div>
</div>
<section class="content">
  <div class="container-fluid">
    <%- include("../partials/alerts") %>
    <!-- content -->
  </div>
</section>
```

### Storefront (Tailwind)

```html
<%- include("../partials/header") %>
<main class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- content -->
  </div>
</main>
<%- include("../partials/footer") %>
```

## Rules

- Web controllers must not contain business logic — delegate to use cases.
- Web controllers must not import from `infrastructure/` except to inject repositories into use cases.
- No direct SQL calls from `web/` — go through module use cases or legacy repos.
- Auth middleware is applied in each portal's router file (see [authentication.md](./authentication.md)).
