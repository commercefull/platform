# Module Structure (DDD)

## Layer Responsibilities

| Layer              | Purpose                                     | Location                                |
| ------------------ | ------------------------------------------- | --------------------------------------- |
| **Domain**         | Core business logic, aggregates, invariants | `modules/[mod]/domain/`                 |
| **Application**    | Orchestrate domain operations (use cases)   | `modules/[mod]/application/`            |
| **Infrastructure** | Data persistence, external adapters         | `modules/[mod]/infrastructure/`         |
| **Interface**      | HTTP controllers and routers                | `modules/[mod]/interface/`              |
| **Repos (legacy)** | Direct SQL repositories (pre-DDD modules)   | `modules/[mod]/repos/`                  |

### Dependency Rules

| Layer            | Can Depend On                 | Cannot Depend On                         |
| ---------------- | ----------------------------- | ---------------------------------------- |
| Domain           | Nothing (pure)                | Application, Infrastructure, Interface   |
| Application      | Domain                        | Infrastructure (directly), Interface     |
| Infrastructure   | Domain (implements interfaces)| Application, Interface                   |
| Interface        | Application, Domain           | Infrastructure (directly)                |

## DDD Module Layout (reference: `product`)

```
modules/[module-name]/
├── application/
│   ├── services/              # Application services
│   └── useCases/              # Use case classes
│       ├── CreateProduct.ts
│       ├── GetProduct.ts
│       ├── ListProducts.ts
│       ├── UpdateProduct.ts
│       └── index.ts
├── domain/
│   ├── entities/              # Aggregate roots & entities
│   │   ├── Product.ts
│   │   ├── ProductVariant.ts
│   │   └── ProductCategory.ts
│   ├── events/                # Domain events
│   ├── repositories/          # Repository interfaces
│   │   └── ProductRepository.ts
│   └── valueObjects/          # Value objects
│       ├── Price.ts
│       ├── Dimensions.ts
│       └── ProductStatus.ts
├── infrastructure/
│   └── repositories/          # SQL implementations
│       └── ProductRepository.ts
├── interface/
│   ├── controllers/
│   │   ├── ProductBusinessController.ts
│   │   └── ProductCustomerController.ts
│   ├── routers/
│   │   ├── productBusinessRouter.ts
│   │   └── productCustomerRouter.ts
│   └── jobs/                  # Background jobs (optional)
├── repos/                     # Legacy direct SQL repos (pre-DDD)
└── utils/                     # Module-specific utilities
```

## Legacy Module Layout

Modules not yet aligned to DDD use a flat structure:

```
modules/[module-name]/
├── [module]CustomerRouter.ts
├── [module]BusinessRouter.ts
├── [module]CustomerController.ts
├── [module]BusinessController.ts
└── repos/
    └── [module]Repo.ts
```

## Use Case Pattern

Use cases are command-driven classes with a single `execute` method.

```typescript
export class ListProductsCommand {
  constructor(
    public readonly filters?: { status?: string; search?: string },
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc',
  ) {}
}

export interface ListProductsResponse {
  products: ProductListItemResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: ListProductsCommand): Promise<ListProductsResponse> {
    // 1. Build filters from command
    // 2. Call repository
    // 3. Map domain entities to response DTOs
    // 4. Return response
  }
}
```

## Domain Entity Pattern (Aggregate Root)

```typescript
export class Product {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = props;
  }

  // Factory method for new entities
  static create(props: CreateProductProps): Product {
    // Validate invariants, set defaults
    return new Product({ ...props, status: ProductStatus.DRAFT });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // Domain methods enforce business rules
  publish(): void {
    if (this.props.status !== ProductStatus.ACTIVE) {
      throw new Error('Product must be active to publish');
    }
    this.props.publishedAt = new Date();
    this.props.visibility = ProductVisibility.VISIBLE;
    this.touch();
  }

  // Getters only — mutations go through domain methods
  get productId(): string { return this.props.productId; }
  get name(): string { return this.props.name; }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
```

## Repository Pattern

- Domain defines the **interface** (`domain/repositories/*.ts`).
- Infrastructure provides the **implementation** with raw SQL (`infrastructure/repositories/*.ts`).

```typescript
// Domain — contract
export interface IProductRepository {
  findById(productId: string): Promise<Product | null>;
  findAll(filters: ProductFilters): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(productId: string): Promise<void>;
}
```

## Value Object Pattern

Immutable, defined by attributes, no identity.

```typescript
export class Price {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) throw new Error('Price cannot be negative');
  }

  add(other: Price): Price {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Price(this.amount + other.amount, this.currency);
  }
}
```

## Master Variant Architecture (products)

1. Every product automatically has a master variant created with it.
2. The master variant holds the default price and inventory configuration.
3. The master variant is flagged with `isDefault: true` and cannot be removed.
4. When adding items to the basket without a specific variant, the master variant is used.
