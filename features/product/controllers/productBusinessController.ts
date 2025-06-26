import { Request, Response } from "express";
import productRepo, { ProductStatus, ProductVisibility, ProductCreateProps, ProductUpdateProps, ProductFilterOptions } from "../repos/productRepo";
import productVariantRepo from "../repos/productVariantRepo";
import { generateSlug } from "../../../libs/slug";
import { validateRequest } from "../../../libs/validation";
import { errorResponse, successResponse } from "../../../libs/apiResponse";


export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      visibility,
      categoryId,
      isFeatured,
      isVirtual,
      hasVariants,
      priceMin,
      priceMax,
      merchantId,
      brandId,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortDirection = 'DESC'
    } = req.query;

    // Convert query parameters to the right types
    const filterOptions: ProductFilterOptions = {
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      orderBy: String(sortBy),
      orderDirection: (sortDirection as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    // Add optional filters if they exist
    if (status) filterOptions.status = status as ProductStatus;
    if (visibility) filterOptions.visibility = visibility as ProductVisibility;
    if (categoryId) filterOptions.categoryId = String(categoryId);
    if (isFeatured !== undefined) filterOptions.isFeatured = isFeatured === 'true';
    if (isVirtual !== undefined) filterOptions.isVirtual = isVirtual === 'true';
    if (hasVariants !== undefined) filterOptions.hasVariants = hasVariants === 'true';
    if (priceMin) filterOptions.priceMin = Number(priceMin);
    if (priceMax) filterOptions.priceMax = Number(priceMax);
    if (merchantId) filterOptions.merchantId = String(merchantId);
    if (brandId) filterOptions.brandId = String(brandId);
    if (search) filterOptions.searchTerm = String(search);

    // Get products and count
    const products = await productRepo.findAll(filterOptions);
    const total = await productRepo.count(filterOptions);

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit));
    const currentPage = Number(page);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    successResponse(res, {
      products,
      pagination: {
        total,
        totalPages,
        currentPage,
        limit: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Get a product by ID
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await productRepo.findById(id);

    if (!product) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    successResponse(res, { product });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate required fields
    const validation = validateRequest(req.body, ['name', 'description', 'productTypeId']);

    if (!validation.isValid) {
      errorResponse(res, validation.message, 400);
      return;
    }

    const productData: ProductCreateProps = {
      ...req.body,
      // Generate slug if not provided
      slug: req.body.slug || generateSlug(req.body.name),
      // Set default values if not provided
      status: req.body.status || ProductStatus.DRAFT,
      visibility: req.body.visibility || ProductVisibility.HIDDEN,
      isFeatured: !!req.body.isFeatured,
      isVirtual: !!req.body.isVirtual,
      isDownloadable: !!req.body.isDownloadable,
      isSubscription: !!req.body.isSubscription,
      isTaxable: req.body.isTaxable !== undefined ? !!req.body.isTaxable : true,
      hasVariants: !!req.body.hasVariants
    };

    // Convert string prices to numbers if provided
    if (req.body.basePrice) productData.basePrice = Number(req.body.basePrice);
    if (req.body.salePrice) productData.salePrice = Number(req.body.salePrice);
    if (req.body.cost) productData.cost = Number(req.body.cost);

    // Convert string dimensions to numbers if provided
    if (req.body.weight) productData.weight = Number(req.body.weight);
    if (req.body.length) productData.length = Number(req.body.length);
    if (req.body.width) productData.width = Number(req.body.width);
    if (req.body.height) productData.height = Number(req.body.height);

    const product = await productRepo.create(productData);

    // Create master variant for the product
    const masterVariant = await productVariantRepo.ensureMasterVariantExists(product);

    if (!masterVariant) {
      // Log the error but don't fail the product creation
      console.error(`Warning: Failed to create master variant for product ${product.id}`);
    }

    successResponse(res, {
      product,
      masterVariant
    }, 201);
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Update an existing product
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await productRepo.findById(id);

    if (!existingProduct) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const productData: ProductUpdateProps = { ...req.body };

    // Generate slug if name was changed but slug wasn't provided
    if (req.body.name && !req.body.slug && req.body.name !== existingProduct.name) {
      productData.slug = generateSlug(req.body.name);
    }

    // Convert string prices to numbers if provided
    if (req.body.basePrice) productData.basePrice = Number(req.body.basePrice);
    if (req.body.salePrice) productData.salePrice = Number(req.body.salePrice);
    if (req.body.cost) productData.cost = Number(req.body.cost);

    // Convert string dimensions to numbers if provided
    if (req.body.weight) productData.weight = Number(req.body.weight);
    if (req.body.length) productData.length = Number(req.body.length);
    if (req.body.width) productData.width = Number(req.body.width);
    if (req.body.height) productData.height = Number(req.body.height);

    const product = await productRepo.update(id, productData);

    // Ensure master variant exists and update it with new product data if needed
    const masterVariant = await productVariantRepo.ensureMasterVariantExists(product);

    // If master variant exists and product data was updated, sync relevant fields
    if (masterVariant && (
      req.body.name ||
      req.body.basePrice !== undefined ||
      req.body.salePrice !== undefined ||
      req.body.cost !== undefined ||
      req.body.weight !== undefined ||
      req.body.weightUnit !== undefined ||
      req.body.length !== undefined ||
      req.body.width !== undefined ||
      req.body.height !== undefined ||
      req.body.dimensionUnit !== undefined
    )) {
      // Update master variant with new product data
      const updateData: any = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.basePrice !== undefined) updateData.price = Number(req.body.basePrice);
      if (req.body.salePrice !== undefined) updateData.compareAtPrice = Number(req.body.salePrice);
      if (req.body.cost !== undefined) updateData.costPrice = Number(req.body.cost);
      if (req.body.weight !== undefined) updateData.weight = Number(req.body.weight);
      if (req.body.weightUnit !== undefined) updateData.weightUnit = req.body.weightUnit;
      if (req.body.length !== undefined) updateData.length = Number(req.body.length);
      if (req.body.width !== undefined) updateData.width = Number(req.body.width);
      if (req.body.height !== undefined) updateData.height = Number(req.body.height);
      if (req.body.dimensionUnit !== undefined) updateData.dimensionUnit = req.body.dimensionUnit;

      // Only update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        await productVariantRepo.update(masterVariant.id, updateData);
      }
    }

    successResponse(res, { product });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Delete a product (soft delete)
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await productRepo.findById(id);

    if (!existingProduct) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    await productRepo.delete(id);

    successResponse(res, { message: 'Product deleted successfully' });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Update product status
 */
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !Object.values(ProductStatus).includes(status as ProductStatus)) {
      errorResponse(res, 'Invalid status value', 400);
      return;
    }

    // Check if product exists
    const existingProduct = await productRepo.findById(id);

    if (!existingProduct) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const product = await productRepo.updateStatus(id, status as ProductStatus);

    successResponse(res, { product });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Update product visibility
 */
export const updateProductVisibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    // Validate visibility
    if (!visibility || !Object.values(ProductVisibility).includes(visibility as ProductVisibility)) {
      errorResponse(res, 'Invalid visibility value', 400);
      return;
    }

    // Check if product exists
    const existingProduct = await productRepo.findById(id);

    if (!existingProduct) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const product = await productRepo.updateVisibility(id, visibility as ProductVisibility);

    successResponse(res, { product });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Get related products for a product
 */
export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    // Check if product exists
    const existingProduct = await productRepo.findById(id);

    if (!existingProduct) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const relatedProducts = await productRepo.findRelated(id, Number(limit));

    successResponse(res, { products: relatedProducts });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Get products by category
 */
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const filterOptions = {
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    };

    const products = await productRepo.findByCategory(categoryId, filterOptions);
    const total = await productRepo.countByCategory(categoryId);

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit));
    const currentPage = Number(page);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    successResponse(res, {
      products,
      pagination: {
        total,
        totalPages,
        currentPage,
        limit: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}

/**
 * Get product by ID with all its variants
 */
export const getProductWithVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await productRepo.findById(id);

    if (!product) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    // Get all variants for the product
    const variants = await productVariantRepo.findByProductId(id);

    // If no master variant exists, create one on-the-fly
    if (!variants.some(v => v.isDefault)) {
      const masterVariant = await productVariantRepo.ensureMasterVariantExists(product);
      if (masterVariant) {
        variants.unshift(masterVariant); // Add master variant at the beginning
      }
    }

    successResponse(res, {
      product,
      variants
    });
  } catch (error) {
    errorResponse(res, (error as Error).message);
  }
}
