import { Request, Response } from "express";
import productRepo from "../repos/productRepo";
import productVariantRepo, { 
  ProductVariantCreateProps, 
  ProductVariantUpdateProps,
  InventoryPolicy 
} from "../repos/productVariantRepo";
import { validateRequest } from "../../../libs/validation";
import { errorResponse, successResponse } from "../../../libs/apiResponse";

/**
 * Get all variants for a product
 */
export const getVariantsByProductId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      
      // Check if product exists
      const product = await productRepo.findById(productId);
      
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      const variants = await productVariantRepo.findByProductId(productId);
      
      successResponse(res, { variants });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Get a variant by ID
 */
export const getVariantById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const variant = await productVariantRepo.findById(id);
      
      if (!variant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      successResponse(res, { variant });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Create a new variant for a product
 */
export const createVariant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['sku', 'name', 'price', 'inventory', 'inventoryPolicy']);
      
      if (!validation.isValid) {
        errorResponse(res, validation.message, 400);
        return;
      }
      
      // Check if product exists
      const product = await productRepo.findById(productId);
      
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      // Check if sku is already in use
      const existingVariant = await productVariantRepo.findBySku(req.body.sku);
      
      if (existingVariant) {
        errorResponse(res, 'SKU already in use', 400);
        return;
      }
      
      // Get count of existing variants to determine position
      const existingVariants = await productVariantRepo.findByProductId(productId);
      const position = existingVariants.length;
      
      // Prepare variant data
      const variantData: ProductVariantCreateProps = {
        ...req.body,
        productId,
        position,
        isDefault: req.body.isDefault || (position === 0), // First variant is default if not specified
        isActive: req.body.isActive !== undefined ? !!req.body.isActive : true,
        price: Number(req.body.price),
        inventory: Number(req.body.inventory),
        inventoryPolicy: req.body.inventoryPolicy as InventoryPolicy
      };
      
      // Add optional number fields
      if (req.body.compareAtPrice) variantData.compareAtPrice = Number(req.body.compareAtPrice);
      if (req.body.costPrice) variantData.costPrice = Number(req.body.costPrice);
      if (req.body.weight) variantData.weight = Number(req.body.weight);
      
      // Process dimensions if provided
      if (req.body.dimensions) {
        // Extract individual dimension properties
        if (req.body.dimensions.length) variantData.length = Number(req.body.dimensions.length);
        if (req.body.dimensions.width) variantData.width = Number(req.body.dimensions.width);
        if (req.body.dimensions.height) variantData.height = Number(req.body.dimensions.height);
        if (req.body.dimensions.dimensionUnit) variantData.dimensionUnit = req.body.dimensions.dimensionUnit;
      }
      
      // Create the variant
      const variant = await productVariantRepo.create(variantData);
      
      // If this is the first variant or isDefault is true, update the product to have variants
      if (position === 0 || req.body.isDefault) {
        await productRepo.update(productId, { 
          hasVariants: true,
          variantAttributes: variant.options.map(option => option.name)
        });
      }
      
      successResponse(res, { variant }, 201);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Update an existing variant
 */
export const updateVariant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if variant exists
      const existingVariant = await productVariantRepo.findById(id);
      
      if (!existingVariant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      // Check if sku is already in use by another variant
      if (req.body.sku && req.body.sku !== existingVariant.sku) {
        const skuExists = await productVariantRepo.findBySku(req.body.sku);
        
        if (skuExists && skuExists.id !== id) {
          errorResponse(res, 'SKU already in use', 400);
          return;
        }
      }
      
      // Prepare update data
      const variantData: ProductVariantUpdateProps = { ...req.body };
      
      // Process number fields
      if (req.body.price) variantData.price = Number(req.body.price);
      if (req.body.compareAtPrice) variantData.compareAtPrice = Number(req.body.compareAtPrice);
      if (req.body.costPrice) variantData.costPrice = Number(req.body.costPrice);
      if (req.body.inventory) variantData.inventory = Number(req.body.inventory);
      if (req.body.weight) variantData.weight = Number(req.body.weight);
      
      // Process dimensions if provided
      if (req.body.dimensions) {
        // Extract individual dimension properties
        if (req.body.dimensions.length) variantData.length = Number(req.body.dimensions.length);
        if (req.body.dimensions.width) variantData.width = Number(req.body.dimensions.width);
        if (req.body.dimensions.height) variantData.height = Number(req.body.dimensions.height);
        if (req.body.dimensions.dimensionUnit) variantData.dimensionUnit = req.body.dimensions.dimensionUnit;
      }
      
      // Update the variant
      const variant = await productVariantRepo.update(id, variantData);
      
      // If isDefault is being set to true, make this the default variant
      if (req.body.isDefault === true) {
        await productVariantRepo.setDefault(id);
      }
      
      // If attributes are updated, update the product's variantAttributes
      if (req.body.attributes) {
        const allVariants = await productVariantRepo.findByProductId(existingVariant.productId);
        const allAttributes = new Set<string>();
        
        // Collect all unique attribute names from variant options
        allVariants.forEach(v => {
          v.options.forEach(option => allAttributes.add(option.name));
        });
        
        // Update the product
        await productRepo.update(existingVariant.productId, { 
          variantAttributes: Array.from(allAttributes)
        });
      }
      
      successResponse(res, { variant });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Delete a variant
 */
export const deleteVariant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if variant exists
      const existingVariant = await productVariantRepo.findById(id);
      
      if (!existingVariant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      // Delete the variant
      await productVariantRepo.delete(id);
      
      // Check if there are any remaining variants
      const remainingVariants = await productVariantRepo.findByProductId(existingVariant.productId);
      
      // If this was the default variant, set a new default if there are remaining variants
      if (existingVariant.isDefault && remainingVariants.length > 0) {
        await productVariantRepo.setDefault(remainingVariants[0].id);
      }
      
      // If no variants remain, update the product
      if (remainingVariants.length === 0) {
        await productRepo.update(existingVariant.productId, { 
          hasVariants: false,
          variantAttributes: {} 
        });
      }
      
      successResponse(res, { success: true });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Set a variant as the default for a product
 */
export const setDefaultVariant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if variant exists
      const existingVariant = await productVariantRepo.findById(id);
      
      if (!existingVariant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      // Set as default
      const variant = await productVariantRepo.setDefault(id);
      
      successResponse(res, { variant });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Update inventory for a variant
 */
export const updateInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['quantity']);
      
      if (!validation.isValid) {
        errorResponse(res, validation.message, 400);
        return;
      }
      
      // Check if variant exists
      const existingVariant = await productVariantRepo.findById(id);
      
      if (!existingVariant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      // Update inventory
      const variant = await productVariantRepo.updateInventory(id, Number(quantity));
      
      successResponse(res, { variant });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Adjust inventory for a variant (increment or decrement)
 */
export const adjustInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { adjustment } = req.body;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['adjustment']);
      
      if (!validation.isValid) {
        errorResponse(res, validation.message, 400);
        return;
      }
      
      // Check if variant exists
      const existingVariant = await productVariantRepo.findById(id);
      
      if (!existingVariant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      // Adjust inventory
      const variant = await productVariantRepo.adjustInventory(id, Number(adjustment));
      
      successResponse(res, { variant });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

/**
 * Reorder variants for a product
 */
export const reorderVariants = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const { variantIds } = req.body;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['variantIds']);
      
      if (!validation.isValid) {
        errorResponse(res, validation.message, 400);
        return;
      }
      
      if (!Array.isArray(variantIds)) {
        errorResponse(res, 'variantIds must be an array', 400);
        return;
      }
      
      // Check if product exists
      const product = await productRepo.findById(productId);
      
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      // Get all variants for the product to validate the provided IDs
      const existingVariants = await productVariantRepo.findByProductId(productId);
      const existingIds = existingVariants.map(v => v.id);
      
      // Check if all provided IDs are valid
      const areAllIdsValid = variantIds.every(id => existingIds.includes(id));
      
      if (!areAllIdsValid) {
        errorResponse(res, 'One or more variant IDs are invalid', 400);
        return;
      }
      
      // Check if all existing variants are included
      if (variantIds.length !== existingVariants.length) {
        errorResponse(res, 'All variants must be included in the reordering', 400);
        return;
      }
      
      // Reorder variants
      await productVariantRepo.reorder(productId, variantIds);
      
      // Get updated variants
      const updatedVariants = await productVariantRepo.findByProductId(productId);
      
      successResponse(res, { variants: updatedVariants });
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : String(error));
    }
}
