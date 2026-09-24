export const basketTypeDefs = `#graphql
  type BasketItem {
    basketItemId: String!
    productId: String!
    productVariantId: String
    sku: String!
    name: String!
    quantity: Int!
    unitPriceCents: Int!
    lineTotalCents: Int!
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
    subtotalCents: Int!
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
