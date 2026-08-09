export const productTypeDefs = `#graphql
  type ProductImage {
    imageId: String!
    url: String!
    altText: String
    position: Int!
    isPrimary: Boolean!
  }

  type ProductVariantAttribute {
    attributeId: String!
    attributeName: String!
    value: String!
    displayValue: String
  }

  type ProductVariantDimensions {
    length: Float
    width: Float
    height: Float
    dimensionUnit: String!
  }

  type ProductVariant {
    variantId: String!
    sku: String!
    name: String!
    barcode: String
    basePrice: Float!
    salePrice: Float
    cost: Float
    effectivePrice: Float!
    isOnSale: Boolean!
    discountPercentage: Float!
    attributes: [ProductVariantAttribute!]!
    attributeString: String!
    stockQuantity: Int!
    lowStockThreshold: Int!
    isInStock: Boolean!
    isLowStock: Boolean!
    isDefault: Boolean!
    isActive: Boolean!
    position: Int!
    imageUrl: String
    weight: Float
    weightUnit: String
    dimensions: ProductVariantDimensions
  }

  type ProductDetail {
    productId: String!
    name: String!
    description: String!
    shortDescription: String
    sku: String
    slug: String!
    productTypeId: String!
    categoryId: String
    brandId: String
    merchantId: String
    status: String!
    visibility: String!
    basePrice: Float!
    salePrice: Float
    cost: Float
    effectivePrice: Float!
    isOnSale: Boolean!
    discountPercentage: Float!
    profitMargin: Float
    profitMarginPercentage: Float
    currency: String!
    isFeatured: Boolean!
    isVirtual: Boolean!
    isDownloadable: Boolean!
    isSubscription: Boolean!
    isTaxable: Boolean!
    taxClass: String
    isPurchasable: Boolean!
    hasVariants: Boolean!
    minOrderQuantity: Int!
    maxOrderQuantity: Int
    returnPolicy: String
    warranty: String
    externalId: String
    weight: Float
    weightUnit: String
    length: Float
    width: Float
    height: Float
    dimensionUnit: String
    metaTitle: String
    metaDescription: String
    metaKeywords: String
    tags: [String!]!
    variants: [ProductVariant!]!
    images: [ProductImage!]!
    primaryImage: ProductImage
    primaryImageUrl: String
    publishedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type ProductListItem {
    productId: String!
    name: String!
    slug: String!
    sku: String
    status: String!
    visibility: String!
    basePrice: Float!
    salePrice: Float
    effectivePrice: Float!
    isOnSale: Boolean!
    isFeatured: Boolean!
    hasVariants: Boolean!
    primaryImageUrl: String
    categoryId: String
    createdAt: String!
  }

  type ProductListResult {
    products: [ProductListItem!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type SearchProductItem {
    productId: String!
    name: String!
    slug: String!
    sku: String
    basePrice: Float!
    salePrice: Float
    effectivePrice: Float!
    isOnSale: Boolean!
    discountPercentage: Float!
    isFeatured: Boolean!
    primaryImageUrl: String
    categoryId: String
    brandId: String
    shortDescription: String
  }

  type SearchProductsResult {
    products: [SearchProductItem!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
    query: String!
  }

  input ProductFilterInput {
    categoryId: String
    brandId: String
    merchantId: String
    businessId: String
    storeId: String
    isFeatured: Boolean
    isVirtual: Boolean
    hasVariants: Boolean
    priceMin: Float
    priceMax: Float
    tags: [String!]
    search: String
  }

  input SearchFilterInput {
    categoryId: String
    brandId: String
    priceMin: Float
    priceMax: Float
    isFeatured: Boolean
    tags: [String!]
  }

  type Query {
    product(productId: String, slug: String, sku: String, includeVariants: Boolean, includeImages: Boolean): ProductDetail
    products(filters: ProductFilterInput, limit: Int, offset: Int, orderBy: String, orderDirection: String): ProductListResult!
    searchProducts(query: String!, filters: SearchFilterInput, limit: Int, offset: Int, orderBy: String): SearchProductsResult!
  }
`;
