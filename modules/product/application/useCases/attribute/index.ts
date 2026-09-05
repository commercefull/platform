/**
 * Attribute Use Cases Index
 * Export all use cases for attribute management
 */

// Create Attribute
export { CreateAttributeUseCase, CreateAttributeCommand, CreateAttributeResponse } from './CreateAttribute';
export { default as createAttributeUseCase } from './CreateAttribute';

// Update Attribute
export { UpdateAttributeUseCase, UpdateAttributeCommand, UpdateAttributeResponse } from './UpdateAttribute';
export { default as updateAttributeUseCase } from './UpdateAttribute';

// Manage Attribute Values
export {
  AddAttributeValueUseCase,
  AddAttributeValueCommand,
  AddAttributeValueResponse,
  RemoveAttributeValueCommand,
  RemoveAttributeValueResponse,
  GetAttributeValuesQuery,
  GetAttributeValuesResponse,
  addAttributeValueUseCase,
  removeAttributeValueUseCase,
  getAttributeValuesUseCase,
} from './ManageAttributeValues';

// Assign Product Attributes
export {
  SetProductAttributeUseCase,
  SetProductAttributeCommand,
  SetProductAttributeResponse,
  SetProductAttributesCommand,
  SetProductAttributesResponse,
  GetProductAttributesQuery,
  GetProductAttributesResponse,
  ProductAttributeWithValue,
  RemoveProductAttributeCommand,
  RemoveProductAttributeResponse,
  setProductAttributeUseCase,
  setProductAttributesUseCase,
  getProductAttributesUseCase,
  removeProductAttributeUseCase,
} from './AssignProductAttributes';

// Search Products
export {
  SearchProductsUseCase,
  SearchProductsQuery,
  SearchProductsResponse,
  GetSearchSuggestionsQuery,
  GetSearchSuggestionsResponse,
  FindSimilarProductsQuery,
  FindSimilarProductsResponse,
  FindByAttributeQuery,
  FindByAttributeResponse,
  searchProductsUseCase,
  getSearchSuggestionsUseCase,
  findSimilarProductsUseCase,
  findByAttributeUseCase,
} from './SearchProducts';
