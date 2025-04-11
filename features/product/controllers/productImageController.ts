import { Request, Response } from "express";
import productRepo from "../repos/productRepo";
import productVariantRepo from "../repos/productVariantRepo";
import productImageRepo, { 
  ProductImage, 
  ProductImageCreateProps, 
  ProductImageUpdateProps
} from "../repos/productImageRepo";
import { validateRequest } from "../../../libs/validation";
import { errorResponse, successResponse } from "../../../libs/apiResponse";

/**
 * Product Image Controller for admin operations
 */
export class ProductImageController {
  /**
   * Get all images for a product
   */
  async getImagesByProductId(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      // Check if product exists
      const product = await productRepo.findById(productId);
      
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      const images = await productImageRepo.findByProductId(productId);
      
      successResponse(res, { images });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get all images for a variant
   */
  async getImagesByVariantId(req: Request, res: Response): Promise<void> {
    try {
      const { variantId } = req.params;
      
      // Check if variant exists
      const variant = await productVariantRepo.findById(variantId);
      
      if (!variant) {
        errorResponse(res, 'Variant not found', 404);
        return;
      }
      
      const images = await productImageRepo.findByVariantId(variantId);
      
      successResponse(res, { images });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get an image by ID
   */
  async getImageById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const image = await productImageRepo.findById(id);
      
      if (!image) {
        errorResponse(res, 'Image not found', 404);
        return;
      }
      
      successResponse(res, { image });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Create a new image for a product
   */
  async createImage(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['url']);
      
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
      
      // Check if variant exists if provided
      if (req.body.variantId) {
        const variant = await productVariantRepo.findById(req.body.variantId);
        
        if (!variant) {
          errorResponse(res, 'Variant not found', 404);
          return;
        }
        
        // Ensure variant belongs to the product
        if (variant.productId !== productId) {
          errorResponse(res, 'Variant does not belong to this product', 400);
          return;
        }
      }
      
      // Get count of existing images to determine position
      const existingImages = await productImageRepo.findByProductId(productId);
      const position = existingImages.length;
      
      // Check if this should be primary (if first image or explicitly set)
      const isPrimary = req.body.isPrimary || position === 0;
      
      // Prepare image data
      const imageData: ProductImageCreateProps = {
        ...req.body,
        productId,
        position,
        isPrimary,
        isVisible: req.body.isVisible !== undefined ? !!req.body.isVisible : true
      };
      
      // Add optional number fields
      if (req.body.width) imageData.width = Number(req.body.width);
      if (req.body.height) imageData.height = Number(req.body.height);
      if (req.body.size) imageData.size = Number(req.body.size);
      
      // Create the image
      const image = await productImageRepo.create(imageData);
      
      // If this is the primary image, update the product
      if (isPrimary) {
        await productRepo.update(productId, { primaryImageId: image.id });
      }
      
      // If this is for a variant, update the variant's imageIds
      if (req.body.variantId) {
        const variant = await productVariantRepo.findById(req.body.variantId);
        if (variant) {
          const imageIds = variant.imageIds || [];
          imageIds.push(image.id);
          await productVariantRepo.update(req.body.variantId, { imageIds });
        }
      }
      
      successResponse(res, { image }, 201);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Update an existing image
   */
  async updateImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if image exists
      const existingImage = await productImageRepo.findById(id);
      
      if (!existingImage) {
        errorResponse(res, 'Image not found', 404);
        return;
      }
      
      // Check if variant exists if changing variantId
      if (req.body.variantId && req.body.variantId !== existingImage.variantId) {
        const variant = await productVariantRepo.findById(req.body.variantId);
        
        if (!variant) {
          errorResponse(res, 'Variant not found', 404);
          return;
        }
        
        // Ensure variant belongs to the same product
        if (variant.productId !== existingImage.productId) {
          errorResponse(res, 'Variant does not belong to this product', 400);
          return;
        }
        
        // Remove from old variant's imageIds if there was one
        if (existingImage.variantId) {
          const oldVariant = await productVariantRepo.findById(existingImage.variantId);
          if (oldVariant && oldVariant.imageIds) {
            const updatedImageIds = oldVariant.imageIds.filter(imgId => imgId !== id);
            await productVariantRepo.update(existingImage.variantId, { imageIds: updatedImageIds });
          }
        }
        
        // Add to new variant's imageIds
        const newVariant = await productVariantRepo.findById(req.body.variantId);
        if (newVariant) {
          const imageIds = newVariant.imageIds || [];
          if (!imageIds.includes(id)) {
            imageIds.push(id);
            await productVariantRepo.update(req.body.variantId, { imageIds });
          }
        }
      }
      
      // Prepare update data
      const imageData: ProductImageUpdateProps = { ...req.body };
      
      // Process number fields
      if (req.body.width) imageData.width = Number(req.body.width);
      if (req.body.height) imageData.height = Number(req.body.height);
      if (req.body.size) imageData.size = Number(req.body.size);
      
      // Update the image
      const image = await productImageRepo.update(id, imageData);
      
      // If this is being set as primary, update the product
      if (req.body.isPrimary === true) {
        await productRepo.update(existingImage.productId, { primaryImageId: id });
      }
      
      successResponse(res, { image });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if image exists
      const existingImage = await productImageRepo.findById(id);
      
      if (!existingImage) {
        errorResponse(res, 'Image not found', 404);
        return;
      }
      
      // Delete the image
      await productImageRepo.delete(id);
      
      // If this was the primary image for the product, update the product
      if (existingImage.isPrimary) {
        // Find a new primary image
        const remainingImages = await productImageRepo.findByProductId(existingImage.productId);
        
        if (remainingImages.length > 0) {
          // Set the first remaining image as primary
          await productImageRepo.setPrimary(remainingImages[0].id);
          
          // Update the product's primaryImageId
          await productRepo.update(existingImage.productId, { primaryImageId: remainingImages[0].id });
        } else {
          // No images left, clear the primaryImageId
          await productRepo.update(existingImage.productId, { primaryImageId: undefined });
        }
      }
      
      // If this image was associated with a variant, update the variant's imageIds
      if (existingImage.variantId) {
        const variant = await productVariantRepo.findById(existingImage.variantId);
        
        if (variant && variant.imageIds) {
          const updatedImageIds = variant.imageIds.filter(imgId => imgId !== id);
          await productVariantRepo.update(existingImage.variantId, { imageIds: updatedImageIds });
        }
      }
      
      successResponse(res, { success: true });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Set an image as the primary one for a product
   */
  async setPrimaryImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if image exists
      const existingImage = await productImageRepo.findById(id);
      
      if (!existingImage) {
        errorResponse(res, 'Image not found', 404);
        return;
      }
      
      // Set as primary
      const image = await productImageRepo.setPrimary(id);
      
      // Update the product's primaryImageId
      await productRepo.update(existingImage.productId, { primaryImageId: id });
      
      successResponse(res, { image });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Reorder images for a product
   */
  async reorderImages(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { imageIds } = req.body;
      
      // Validate required fields
      const validation = validateRequest(req.body, ['imageIds']);
      
      if (!validation.isValid) {
        errorResponse(res, validation.message, 400);
        return;
      }
      
      if (!Array.isArray(imageIds)) {
        errorResponse(res, 'imageIds must be an array', 400);
        return;
      }
      
      // Check if product exists
      const product = await productRepo.findById(productId);
      
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      // Get all images for the product to validate the provided IDs
      const existingImages = await productImageRepo.findByProductId(productId);
      const existingIds = existingImages.map(img => img.id);
      
      // Check if all provided IDs are valid
      const areAllIdsValid = imageIds.every(id => existingIds.includes(id));
      
      if (!areAllIdsValid) {
        errorResponse(res, 'One or more image IDs are invalid', 400);
        return;
      }
      
      // Check if all existing images are included
      if (imageIds.length !== existingImages.length) {
        errorResponse(res, 'All images must be included in the reordering', 400);
        return;
      }
      
      // Reorder images
      await productImageRepo.reorder(productId, imageIds);
      
      // Get updated images
      const updatedImages = await productImageRepo.findByProductId(productId);
      
      successResponse(res, { images: updatedImages });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }
}

export default new ProductImageController();
