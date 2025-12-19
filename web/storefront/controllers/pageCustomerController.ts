import { Request, Response } from "express";
import { storefrontRespond } from "../../../libs/templates";
import ProductRepo from "../../../modules/product/infrastructure/repositories/ProductRepository";
import { ListProductsCommand, ListProductsUseCase } from "../../../modules/product/application/useCases/ListProducts";

// GET: home page
export const getHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get featured/latest products
    const productCommand = new ListProductsCommand(
      { isFeatured: true },
      9,
      0
    );
    const productUseCase = new ListProductsUseCase(ProductRepo);
    const productResult = await productUseCase.execute(productCommand);

    storefrontRespond(req, res, "page/home", {
      pageName: "Home",
      products: productResult.products,
      // Categories are not yet available via product module. Pass empty for now.
      categories: [],
      user: req.user
    });
  } catch (error: any) {
    console.error("Error loading home page:", error);
    storefrontRespond(req, res, "error", {
      pageName: "Error",
      error: error.message || "Failed to load home page",
      user: req.user
    });
  }
};

// GET: display about us page
export const getAboutUsPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/about-us", {
    pageName: "About Us",
    user: req.user
  });
};

// GET: display shipping policy page
export const getShippingPolicyPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/shipping-policy", {
    pageName: "Shipping Policy",
    user: req.user
  });
};

// GET: display careers page
export const getCareersPage = (req: Request, res: Response): void => {
  storefrontRespond(req, res, "page/careers", {
    pageName: "Careers",
    user: req.user
  });
};

// GET: display contact us page and form with csrf tokens
export const getContactUsPage = (req: Request, res: Response): void => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error");
  storefrontRespond(req, res, "page/contact-us", {
    pageName: "Contact Us",
    successMsg,
    errorMsg,
    user: req.user
  });
};

// POST: handle contact us form logic using nodemailer
export const submitContactForm = (req: Request, res: Response): void => {
  // This would typically send an email, but for now we'll just redirect with success
  req.flash("success", "Thank you for your message! We'll get back to you soon.");
  res.redirect("/contact-us");
};
