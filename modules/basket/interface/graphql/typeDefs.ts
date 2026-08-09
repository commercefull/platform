export const basketTypeDefs = `#graphql
  type BasketItem {
    basketItemId: String!
    productId: String!
    productVariantId: String
    sku: String!
    name: String!
    quantity: Int!
    unitPrice: Float!
    lineTotal: Float!
    imageUrl: String
    isGift: Boolean!
  }

  type Basket {
    basketId: String!
    customerId: String
    sessionId: String
    status: String!
    currency: String!
    items: [BasketItem!]!
    itemCount: Int!
    subtotal: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    myBasket(currency: String): Basket!
  }

  type Mutation {
    addItemToBasket(
      basketId: String!
      productId: String!
      sku: String!
      name: String!
      quantity: Int!
      unitPrice: Float!
      productVariantId: String
      imageUrl: String
      itemType: String
    ): Basket!

    updateBasketItemQuantity(
      basketId: String!
      basketItemId: String!
      quantity: Int!
    ): Basket!

    removeBasketItem(
      basketId: String!
      basketItemId: String!
    ): Basket!

    clearBasket(basketId: String!): Basket!
  }
`;
