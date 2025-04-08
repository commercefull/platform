import express from "express";
import { MerchantController } from "./controllers/merchantController";
import { MerchantRepo } from "./repos/merchantRepo";

const router = express.Router();
const merchantController = new MerchantController();

// Public routes for merchant information
// These provide limited access compared to admin routes

// Get active merchants (public storefront view)
router.get("/", (req, res, next) => {
  // Force status filter to only show active merchants for public API
  req.query.status = 'active';
  next();
}, merchantController.getMerchants);

// Get specific merchant by ID (if active)
router.get("/:id", async (req: any, res: any) => {
  try {
    const merchant = await (new MerchantRepo).findById(req.params.id);
    
    // Only return active merchants on public API
    if (!merchant || merchant.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Merchant not found"
      });
    }
    
    // Return limited merchant info for public view
    res.status(200).json({
      success: true,
      data: {
        id: merchant.id,
        name: merchant.name,
        website: merchant.website,
        logoUrl: merchant.logoUrl,
        description: merchant.description
      }
    });
  } catch (error) {
    console.error('Error fetching merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch merchant details'
    });
  }
});

export const merchantRouter = router;
