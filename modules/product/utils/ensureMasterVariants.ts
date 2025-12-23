import productRepo from '../repos/productRepo';
import productVariantRepo from '../repos/productVariantRepo';

/**
 * Utility to ensure all products have a master variant
 * This can be run as a maintenance script or during system upgrades
 */
export async function ensureAllProductsHaveMasterVariants(): Promise<{ 
  total: number; 
  fixed: number; 
  failed: number; 
  details: Array<{ productId: string; status: string }> 
}> {
  const result = {
    total: 0,
    fixed: 0,
    failed: 0,
    details: [] as Array<{ productId: string; status: string }>
  };

  try {
    // Get all products (paginated to avoid memory issues)
    let page = 1;
    const limit = 100;
    let products;
    
    do {
      products = await productRepo.findAll({ 
        limit, 
        offset: (page - 1) * limit
      });
      
      result.total += products.length;
      
      // Process each product
      for (const product of products) {
        try {
          // Check if product has a master variant
          const masterVariant = await productVariantRepo.findDefaultForProduct(product.productId);
          
          if (!masterVariant) {
            // Create master variant
            const newMasterVariant = await productVariantRepo.ensureMasterVariantExists(product);
            
            if (newMasterVariant) {
              result.fixed++;
              result.details.push({ 
                productId: product.productId, 
                status: 'FIXED' 
              });
            } else {
              result.failed++;
              result.details.push({ 
                productId: product.productId, 
                status: 'FAILED' 
              });
            }
          } else {
            result.details.push({ 
              productId: product.productId, 
              status: 'OK' 
            });
          }
        } catch (error) {
          result.failed++;
          result.details.push({ 
            productId: product.productId, 
            status: `ERROR: ${(error as Error).message}` 
          });
        }
      }
      
      page++;
    } while (products.length === limit);
    
    return result;
  } catch (error) {
    throw new Error(`Failed to ensure master variants: ${(error as Error).message}`);
  }
}

/**
 * CLI entry point for running the utility
 * Example: ts-node ensureMasterVariants.ts
 */
if (require.main === module) {
  (async () => {
    try {
      
      const result = await ensureAllProductsHaveMasterVariants();
      
      
      console.log(`Products fixed (master variant created): ${result.fixed}`);
      
      
      if (result.failed > 0) {
        
        result.details
          .filter(detail => detail.status.startsWith('ERROR') || detail.status === 'FAILED')
          .forEach(detail => {
            
          });
      }
    } catch (error) {
      
      process.exit(1);
    }
    process.exit(0);
  })();
}
