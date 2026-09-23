/**
 * Attribute Use Cases Index
 * Export all use cases for attribute management
 */

// Create Attribute
export { CreateAttributeUseCase, CreateAttributeCommand, CreateAttributeResponse } from './CreateAttribute';
export { createAttributeUseCase } from '../wired';

// Update Attribute
export { UpdateAttributeUseCase, UpdateAttributeCommand, UpdateAttributeResponse } from './UpdateAttribute';
export { updateAttributeUseCase } from '../wired';

// Manage Attribute Values
export {
  AddAttributeValueUseCase,
  AddAttributeValueCommand,
  AddAttributeValueResponse,
} from './AddAttributeValue';
export {
  RemoveAttributeValueUseCase,
  RemoveAttributeValueCommand,
  RemoveAttributeValueResponse,
} from './RemoveAttributeValue';
export {
  GetAttributeValuesUseCase,
  GetAttributeValuesQuery,
  GetAttributeValuesResponse,
} from './GetAttributeValues';
export {
  addAttributeValueUseCase,
  removeAttributeValueUseCase,
  getAttributeValuesUseCase,
} from '../wired';

// Assign Product Attributes
export {
  SetProductAttributeUseCase,
  SetProductAttributeCommand,
  SetProductAttributeResponse,
} from './SetProductAttribute';
export {
  SetProductAttributesUseCase,
  SetProductAttributesCommand,
  SetProductAttributesResponse,
} from './SetProductAttributes';
export {
  GetProductAttributesUseCase,
  GetProductAttributesQuery,
  GetProductAttributesResponse,
  ProductAttributeWithValue,
} from './GetProductAttributes';
export {
  RemoveProductAttributeUseCase,
  RemoveProductAttributeCommand,
  RemoveProductAttributeResponse,
} from './RemoveProductAttribute';
export {
  setProductAttributeUseCase,
  setProductAttributesUseCase,
  getAssignedProductAttributesUseCase as getProductAttributesUseCase,
  removeProductAttributeUseCase,
} from '../wired';

// Search Products
export {
  SearchProductsUseCase,
  SearchProductsQuery,
  SearchProductsResponse,
} from './SearchProducts';
export {
  GetSearchSuggestionsUseCase,
  GetSearchSuggestionsQuery,
  GetSearchSuggestionsResponse,
} from './GetSearchSuggestions';
export {
  FindSimilarProductsUseCase,
  FindSimilarProductsQuery,
  FindSimilarProductsResponse,
} from './FindSimilarProducts';
export {
  FindByAttributeUseCase,
  FindByAttributeQuery,
  FindByAttributeResponse,
} from './FindByAttribute';
export {
  attributeSearchProductsUseCase as searchProductsUseCase,
  getSearchSuggestionsUseCase,
  findSimilarProductsUseCase,
  findByAttributeUseCase,
} from '../wired';
