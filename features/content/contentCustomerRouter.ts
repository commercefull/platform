import express from "express";
import { userContactUsValidationRules, validateContactUs } from "./validator";
import {
  getHomePage,
  getAboutUsPage,
  getShippingPolicyPage,
  getCareersPage,
  getContactUsPage,
  submitContactForm
} from "./controllers/pageCustomerController";
import { getActiveContentTypes, getPublishedPageBySlug, getPublishedPages } from "./controllers/contentCustomerController";

const router = express.Router();

// GET: home page
router.get("/", getHomePage);

// GET: display about us page
router.get("/about-us", getAboutUsPage);

// GET: display shipping policy page
router.get("/shipping-policy", getShippingPolicyPage);

// GET: display careers page
router.get("/careers", getCareersPage);

// GET: display contact us page
router.get("/contact-us", getContactUsPage);

// POST: handle contact us form
router.post(
  "/contact-us",
  [userContactUsValidationRules, validateContactUs],
  submitContactForm
);

// Public routes for content access
router.get("/pages", getPublishedPages);
router.get("/pages/:slug", getPublishedPageBySlug);
router.get("/types", getActiveContentTypes);

export const contentRouter = router;
