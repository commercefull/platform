import { Request, Response } from "express";
import productRepo, { ProductStatus, ProductVisibility, ProductFilterOptions } from "../repos/productRepo";
import { errorResponse, successResponse } from "../../../libs/apiResponse";
import { storefrontRespond } from "../../../libs/templates";

/**
 * Product Controller for public (storefront) operations
 */
export class ProductPublicController {
  /**
   * Get all published products for the storefront
   */
  async getPublishedProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        featured,
        search,
        minPrice,
        maxPrice,
        page = 1,
        limit = 12,
        sort = 'createdAt',
        direction = 'DESC'
      } = req.query;

      // Set up filter options for published products only
      const filterOptions: ProductFilterOptions = {
        status: ProductStatus.ACTIVE,
        visibility: ProductVisibility.VISIBLE,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        orderBy: String(sort),
        orderDirection: (direction as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      };

      // Add optional filters if they exist
      if (category) filterOptions.categoryId = String(category);
      if (featured === 'true') filterOptions.isFeatured = true;
      if (search) filterOptions.searchTerm = String(search);
      if (minPrice) filterOptions.priceMin = Number(minPrice);
      if (maxPrice) filterOptions.priceMax = Number(maxPrice);

      // Get products and count
      const products = await productRepo.findAll(filterOptions);
      const total = await productRepo.count(filterOptions);

      // Calculate pagination info
      const totalPages = Math.ceil(total / Number(limit));
      const currentPage = Number(page);
      const hasNextPage = currentPage < totalPages;
      const hasPrevPage = currentPage > 1;

      // Return data as JSON or render template depending on request's Accept header
      if (req.headers.accept?.includes('application/json')) {
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
      } else {
        storefrontRespond(req, res, "product/plp", {
          products,
          pagination: {
            total,
            totalPages,
            currentPage,
            limit: Number(limit),
            hasNextPage,
            hasPrevPage
          },
          successMsg: req.flash?.("success")?.[0],
          errorMsg: req.flash?.("error")?.[0]
        });
      }
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        errorResponse(res, (error as Error).message);
      } else {
        req.flash?.("error", (error as Error).message);
        res.redirect("/products");
      }
    }
  }

  /**
   * Get a single product by slug for the storefront
   */
  async getProductBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      
      const product = await productRepo.findBySlug(slug);
      
      if (!product || product.status !== ProductStatus.ACTIVE || product.visibility !== ProductVisibility.VISIBLE) {
        if (req.headers.accept?.includes('application/json')) {
          errorResponse(res, 'Product not found', 404);
          return;
        } else {
          req.flash?.("error", "Product not found");
          res.redirect("/products");
          return;
        }
      }
      
      // Get related products
      const relatedProducts = await productRepo.findRelated(product.id, 4);
      
      // Return data as JSON or render template depending on request's Accept header
      if (req.headers.accept?.includes('application/json')) {
        successResponse(res, { product, relatedProducts });
      } else {
        storefrontRespond(req, res, "product/pdp", {
          product,
          relatedProducts,
          successMsg: req.flash?.("success")?.[0],
          errorMsg: req.flash?.("error")?.[0]
        });
      }
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        errorResponse(res, (error as Error).message);
      } else {
        req.flash?.("error", (error as Error).message);
        res.redirect("/products");
      }
    }
  }

  /**
   * Get products by category for the storefront
   */
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const {
        page = 1,
        limit = 12,
        sort = 'createdAt',
        direction = 'DESC'
      } = req.query;
      
      // Find category by slug using CategoryRepo (assuming it exists)
      // For now, we'll just simulate this until we enhance the CategoryRepo
      const categoryId = slug; // This would normally be looked up by slug
      
      const filterOptions: ProductFilterOptions = {
        status: ProductStatus.ACTIVE,
        visibility: ProductVisibility.VISIBLE,
        categoryId,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        orderBy: String(sort),
        orderDirection: (direction as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      };
      
      const products = await productRepo.findAll(filterOptions);
      const total = await productRepo.count(filterOptions);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / Number(limit));
      const currentPage = Number(page);
      const hasNextPage = currentPage < totalPages;
      const hasPrevPage = currentPage > 1;
      
      // Return data as JSON or render template depending on request's Accept header
      if (req.headers.accept?.includes('application/json')) {
        successResponse(res, {
          products,
          category: { id: categoryId, slug },
          pagination: {
            total,
            totalPages,
            currentPage,
            limit: Number(limit),
            hasNextPage,
            hasPrevPage
          }
        });
      } else {
        storefrontRespond(req, res, "product/category", {
          products,
          category: { id: categoryId, slug },
          pagination: {
            total,
            totalPages,
            currentPage,
            limit: Number(limit),
            hasNextPage,
            hasPrevPage
          },
          successMsg: req.flash?.("success")?.[0],
          errorMsg: req.flash?.("error")?.[0]
        });
      }
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        errorResponse(res, (error as Error).message);
      } else {
        req.flash?.("error", (error as Error).message);
        res.redirect("/products");
      }
    }
  }

  /**
   * Search products for the storefront
   */
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const {
        page = 1,
        limit = 12,
        sort = 'createdAt',
        direction = 'DESC'
      } = req.query;
      
      if (!q) {
        res.redirect("/products");
      }
      
      const filterOptions: ProductFilterOptions = {
        status: ProductStatus.ACTIVE,
        visibility: ProductVisibility.VISIBLE,
        searchTerm: String(q),
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        orderBy: String(sort),
        orderDirection: (direction as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      };
      
      const products = await productRepo.findAll(filterOptions);
      const total = await productRepo.count(filterOptions);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / Number(limit));
      const currentPage = Number(page);
      const hasNextPage = currentPage < totalPages;
      const hasPrevPage = currentPage > 1;
      
      // Return data as JSON or render template depending on request's Accept header
      if (req.headers.accept?.includes('application/json')) {
        successResponse(res, {
          products,
          query: q,
          pagination: {
            total,
            totalPages,
            currentPage,
            limit: Number(limit),
            hasNextPage,
            hasPrevPage
          }
        });
      } else {
        storefrontRespond(req, res, "product/search", {
          products,
          query: q,
          pagination: {
            total,
            totalPages,
            currentPage,
            limit: Number(limit),
            hasNextPage,
            hasPrevPage
          },
          successMsg: req.flash?.("success")?.[0],
          errorMsg: req.flash?.("error")?.[0]
        });
      }
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        errorResponse(res, (error as Error).message);
      } else {
        req.flash?.("error", (error as Error).message);
        res.redirect("/products");
      }
    }
  }
}

export default new ProductPublicController();
