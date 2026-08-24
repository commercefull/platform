import productRepo from '../../infrastructure/repositories/ProductRepository';
import productTypeRepo from '../../infrastructure/repositories/ProductTypeRepository';
import { ListProductsUseCase } from './ListProducts';
import { CreateProductUseCase } from './CreateProduct';
import { GetProductUseCase } from './GetProduct';
import { UpdateProductUseCase } from './UpdateProduct';
import { DeleteProductUseCase } from './DeleteProduct';
import { UpdateProductStatusUseCase } from './UpdateProductStatus';
import { ListProductTypesUseCase } from './ListProductTypes';

export const listProductsUseCase = new ListProductsUseCase(productRepo);
export const createProductUseCase = new CreateProductUseCase(productRepo);
export const getProductUseCase = new GetProductUseCase(productRepo);
export const updateProductUseCase = new UpdateProductUseCase(productRepo);
export const deleteProductUseCase = new DeleteProductUseCase(productRepo);
export const updateProductStatusUseCase = new UpdateProductStatusUseCase(productRepo);
export const listProductTypesUseCase = new ListProductTypesUseCase(productTypeRepo);
